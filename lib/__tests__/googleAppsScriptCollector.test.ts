import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const sourcePath = fileURLToPath(
  new URL("../../google-apps-script/Code.gs", import.meta.url)
);
const source = readFileSync(sourcePath, "utf8");
const DAILY_KEY = "COLLECTOR_WRITES_2026-07-12";

class MockSheet {
  rows: unknown[][] = [];

  getLastRow() {
    return this.rows.length;
  }

  getLastColumn() {
    return this.rows.reduce((max, row) => Math.max(max, row.length), 0);
  }

  getRange(row: number, column: number, rowCount: number, columnCount: number) {
    return {
      getValues: () =>
        Array.from({ length: rowCount }, (_, rowOffset) =>
          Array.from(
            { length: columnCount },
            (_, columnOffset) =>
              this.rows[row - 1 + rowOffset]?.[column - 1 + columnOffset] ?? ""
          )
        ),
    };
  }

  deleteColumn(oneBasedColumn: number) {
    for (const row of this.rows) {
      row.splice(oneBasedColumn - 1, 1);
    }
  }

  appendRow(row: unknown[]) {
    this.rows.push([...row]);
  }
}

class MockSpreadsheet {
  sheets = new Map<string, MockSheet>();

  getSheetByName(name: string) {
    return this.sheets.get(name) ?? null;
  }

  insertSheet(name: string) {
    const sheet = new MockSheet();
    this.sheets.set(name, sheet);
    return sheet;
  }
}

type Harness = ReturnType<typeof createHarness>;

function createHarness(options: { lockAvailable?: boolean } = {}) {
  const spreadsheet = new MockSpreadsheet();
  const properties = new Map<string, string>();
  const cache = new Map<string, string>();
  let spreadsheetAccesses = 0;
  let lockReleases = 0;

  const ContentService = {
    MimeType: { JSON: "application/json" },
    createTextOutput(content: string) {
      return {
        content,
        mimeType: "text/plain",
        setMimeType(mimeType: string) {
          this.mimeType = mimeType;
          return this;
        },
      };
    },
  };

  const Utilities = {
    DigestAlgorithm: { SHA_256: "SHA-256" },
    newBlob(value: string) {
      return { getBytes: () => Array.from(Buffer.from(value, "utf8")) };
    },
    formatDate() {
      return "2026-07-12";
    },
    computeDigest(_algorithm: string, value: string) {
      return Array.from(createHash("sha256").update(value).digest());
    },
    base64EncodeWebSafe(bytes: number[]) {
      return Buffer.from(bytes)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    },
  };

  const context = vm.createContext({
    CacheService: {
      getScriptCache: () => ({
        get: (key: string) => cache.get(key) ?? null,
        put: (key: string, value: string) => cache.set(key, value),
      }),
    },
    ContentService,
    LockService: {
      getScriptLock: () => ({
        tryLock: () => options.lockAvailable !== false,
        releaseLock: () => {
          lockReleases += 1;
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => properties.get(key) ?? null,
        setProperty: (key: string, value: string) => {
          properties.set(key, value);
        },
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => {
        spreadsheetAccesses += 1;
        return spreadsheet;
      },
    },
    Utilities,
  });

  vm.runInContext(source, context, { filename: sourcePath });

  return {
    context,
    spreadsheet,
    properties,
    cache,
    get spreadsheetAccesses() {
      return spreadsheetAccesses;
    },
    get lockReleases() {
      return lockReleases;
    },
  };
}

function post(harness: Harness, payload: unknown, rawBody?: string) {
  const response = harness.context.doPost({
    postData: { contents: rawBody ?? JSON.stringify(payload) },
  });
  return JSON.parse(response.content) as Record<string, unknown>;
}

function validFeedback(overrides: Record<string, unknown> = {}) {
  return {
    type: "feedback",
    merchant_raw_name: "COURTYARD BY MARRIOTT",
    normalized_merchant_name: "Courtyard by Marriott",
    user_action: "include",
    detected_status: "missing_suspected",
    detected_confidence: "certain",
    point_type: "L2",
    anonymous_session_id: "session-1",
    ...overrides,
  };
}

describe("Google Apps Script collector admission controls", () => {
  it("accepts valid feedback once and suppresses an exact replay", () => {
    const harness = createHarness();
    const payload = validFeedback({
      merchant_raw_name: " =SUM(1,1)",
    });

    expect(post(harness, payload)).toEqual({ ok: true });
    expect(post(harness, payload)).toEqual({ ok: true });

    const sheet = harness.spreadsheet.getSheetByName("feedback");
    expect(sheet?.rows).toHaveLength(2);
    expect(sheet?.rows[1][1]).toBe("' =SUM(1,1)");
    expect(harness.properties.get(DAILY_KEY)).toBe("1");
    expect(harness.lockReleases).toBe(2);
  });

  it("rejects unknown types, extra fields, invalid enums, and oversized bodies before Sheet access", () => {
    const cases = [
      { type: "unknown", merchant_raw_name: "noise" },
      validFeedback({ unexpected: "field" }),
      validFeedback({ user_action: "maybe" }),
      validFeedback({ detected_status: "admin" }),
      validFeedback({ detected_confidence: "certainly" }),
    ];

    for (const payload of cases) {
      const harness = createHarness();
      expect(post(harness, payload)).toEqual({
        ok: false,
        error: "request rejected",
      });
      expect(harness.spreadsheetAccesses).toBe(0);
    }

    const oversized = createHarness();
    expect(
      post(
        oversized,
        { type: "parse_error", diagnostic: "x" },
        JSON.stringify({ type: "parse_error", diagnostic: "x".repeat(9000) })
      )
    ).toEqual({ ok: false, error: "request rejected" });
    expect(oversized.spreadsheetAccesses).toBe(0);
  });

  it("rejects a paused collector, an exhausted daily budget, and a busy lock", () => {
    const paused = createHarness();
    paused.properties.set("COLLECTOR_PAUSED", "true");
    expect(post(paused, validFeedback())).toEqual({
      ok: false,
      error: "request rejected",
    });
    expect(paused.spreadsheetAccesses).toBe(0);

    const exhausted = createHarness();
    exhausted.properties.set(DAILY_KEY, "500");
    expect(post(exhausted, validFeedback())).toEqual({
      ok: false,
      error: "request rejected",
    });
    expect(exhausted.spreadsheetAccesses).toBe(0);

    const busy = createHarness({ lockAvailable: false });
    expect(post(busy, validFeedback())).toEqual({
      ok: false,
      error: "request rejected",
    });
    expect(busy.spreadsheetAccesses).toBe(0);
  });

  it("caps varied payloads at the global daily budget", () => {
    const harness = createHarness();
    harness.properties.set(DAILY_KEY, "499");

    expect(post(harness, validFeedback({ anonymous_session_id: "a" }))).toEqual({
      ok: true,
    });
    expect(post(harness, validFeedback({ anonymous_session_id: "b" }))).toEqual({
      ok: false,
      error: "request rejected",
    });

    expect(harness.properties.get(DAILY_KEY)).toBe("500");
    expect(harness.spreadsheet.getSheetByName("feedback")?.rows).toHaveLength(2);
  });

  it("keeps parse-error collection working while bounding diagnostics and replays", () => {
    const harness = createHarness();
    const payload = {
      type: "parse_error",
      diagnostic: "\t=IMPORTXML(\"https://example.invalid\",\"//x\")",
    };

    expect(post(harness, payload)).toEqual({ ok: true });
    expect(post(harness, payload)).toEqual({ ok: true });

    const sheet = harness.spreadsheet.getSheetByName("parse_error");
    expect(sheet?.rows).toHaveLength(2);
    expect(String(sheet?.rows[1][1])).toMatch(/^'\t=IMPORTXML/);
    expect(harness.properties.get(DAILY_KEY)).toBe("1");

    const invalid = createHarness();
    expect(
      post(invalid, {
        type: "parse_error",
        diagnostic: "d".repeat(4001),
      })
    ).toEqual({ ok: false, error: "request rejected" });
    expect(invalid.spreadsheetAccesses).toBe(0);
  });
});
