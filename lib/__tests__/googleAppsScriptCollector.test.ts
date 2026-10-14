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
const FEEDBACK_HEADERS = [
  "created_at",
  "merchant_raw_name",
  "normalized_name",
  "user_action",
  "detected_status",
  "detected_confidence",
  "point_type",
  "session_id",
];

class MockSheet {
  rows: unknown[][] = [];

  constructor(private readonly onAppend: () => void) {}

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
    this.onAppend();
    this.rows.push([...row]);
  }
}

class MockSpreadsheet {
  sheets = new Map<string, MockSheet>();

  constructor(private readonly onAppend: (sheetName: string) => void) {}

  getSheetByName(name: string) {
    return this.sheets.get(name) ?? null;
  }

  insertSheet(name: string) {
    const sheet = new MockSheet(() => this.onAppend(name));
    this.sheets.set(name, sheet);
    return sheet;
  }
}

type Harness = ReturnType<typeof createHarness>;

function createHarness(
  options: {
    lockAvailable?: boolean;
    lockAvailableAfterMs?: number;
    appendFailureAt?: number;
    flushFailureAt?: number;
  } = {}
) {
  const events: string[] = [];
  const lockWaitArguments: number[] = [];
  let appendCalls = 0;
  let flushCalls = 0;
  const spreadsheet = new MockSpreadsheet((sheetName) => {
    appendCalls += 1;
    events.push(`append:${sheetName}`);
    if (appendCalls === options.appendFailureAt) {
      throw new Error("mock Sheet append failure");
    }
  });
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
        put: (key: string, value: string) => {
          events.push("cache:put");
          cache.set(key, value);
        },
      }),
    },
    ContentService,
    LockService: {
      getScriptLock: () => ({
        tryLock: (timeoutMs: number) => {
          lockWaitArguments.push(timeoutMs);
          events.push("lock:try");
          return (
            options.lockAvailable !== false &&
            timeoutMs >= (options.lockAvailableAfterMs ?? 0)
          );
        },
        releaseLock: () => {
          lockReleases += 1;
          events.push("lock:release");
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => properties.get(key) ?? null,
        setProperty: (key: string, value: string) => {
          events.push(`property:${key}=${value}`);
          properties.set(key, value);
        },
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => {
        spreadsheetAccesses += 1;
        return spreadsheet;
      },
      flush: () => {
        flushCalls += 1;
        events.push("sheet:flush");
        if (flushCalls === options.flushFailureAt) {
          throw new Error("mock Sheet flush failure");
        }
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
    events,
    lockWaitArguments,
    get spreadsheetAccesses() {
      return spreadsheetAccesses;
    },
    get lockReleases() {
      return lockReleases;
    },
    get flushCalls() {
      return flushCalls;
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
    expect(harness.flushCalls).toBe(1);
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

  it("waits up to 30 seconds for another writer and flushes before releasing the lock", () => {
    const harness = createHarness({ lockAvailableAfterMs: 1500 });

    expect(post(harness, validFeedback())).toEqual({ ok: true });
    expect(harness.lockWaitArguments).toEqual([30000]);
    expect(harness.flushCalls).toBe(1);
    expect(harness.events).toEqual([
      "lock:try",
      `property:${DAILY_KEY}=1`,
      "append:feedback",
      "append:feedback",
      "sheet:flush",
      "cache:put",
      "lock:release",
    ]);
  });

  it("rejects a writer still busy after the full wait without reserving a slot", () => {
    const harness = createHarness({ lockAvailableAfterMs: 30001 });

    expect(post(harness, validFeedback())).toEqual({
      ok: false,
      error: "request rejected",
    });
    expect(harness.lockWaitArguments).toEqual([30000]);
    expect(harness.spreadsheetAccesses).toBe(0);
    expect(harness.properties.has(DAILY_KEY)).toBe(false);
    expect(harness.flushCalls).toBe(0);
    expect(harness.lockReleases).toBe(0);
  });

  it("rolls back the daily slot and releases the lock when appending a submission fails", () => {
    const harness = createHarness({ appendFailureAt: 2 });
    const payload = validFeedback();

    expect(post(harness, payload)).toEqual({
      ok: false,
      error: "request rejected",
    });
    expect(harness.properties.get(DAILY_KEY)).toBe("0");
    expect(harness.cache.size).toBe(0);
    expect(harness.lockReleases).toBe(1);
    expect(harness.flushCalls).toBe(0);
    expect(harness.spreadsheet.getSheetByName("feedback")?.rows).toEqual([
      FEEDBACK_HEADERS,
    ]);
    expect(harness.events.slice(-2)).toEqual([
      `property:${DAILY_KEY}=0`,
      "lock:release",
    ]);

    expect(post(harness, payload)).toEqual({ ok: true });
    expect(harness.properties.get(DAILY_KEY)).toBe("1");
    expect(harness.spreadsheet.getSheetByName("feedback")?.rows).toHaveLength(2);
    expect(harness.flushCalls).toBe(1);
    expect(harness.lockReleases).toBe(2);
  });

  it("keeps the reserved slot and releases the lock if flushing an appended row fails", () => {
    const harness = createHarness({ flushFailureAt: 1 });

    expect(post(harness, validFeedback())).toEqual({
      ok: false,
      error: "request rejected",
    });
    // An appended row may already have persisted. Do not free a slot or mark
    // the request as cached before the flush has successfully completed.
    expect(harness.spreadsheet.getSheetByName("feedback")?.rows).toHaveLength(2);
    expect(harness.properties.get(DAILY_KEY)).toBe("1");
    expect(harness.cache.size).toBe(0);
    expect(harness.flushCalls).toBe(1);
    expect(harness.lockReleases).toBe(1);
    expect(harness.events.slice(-2)).toEqual(["sheet:flush", "lock:release"]);
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
    expect(sheet?.rows[0]).toEqual(["created_at", "diagnostic"]);
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

  it.each([
    ["Korean", "한".repeat(4000)],
    ["emoji", "🏨".repeat(2000)],
    ["escaped controls", "\u0000".repeat(4000)],
    ["quotes and backslashes", '"\\'.repeat(2000)],
    ["unpaired surrogate escapes", "\ud800".repeat(4000)],
  ])("accepts 4,000 UTF-16 units of %s in a diagnostic", (_label, diagnostic) => {
    const harness = createHarness();
    const payload = { type: "parse_error", diagnostic };
    const body = JSON.stringify(payload);

    expect(diagnostic.length).toBe(4000);
    expect(Buffer.byteLength(body, "utf8")).toBeLessThanOrEqual(32768);
    expect(post(harness, payload)).toEqual({ ok: true });
    expect(harness.spreadsheet.getSheetByName("parse_error")?.rows[1][1]).toBe(
      diagnostic
    );
    expect(harness.flushCalls).toBe(1);
    expect(harness.properties.get(DAILY_KEY)).toBe("1");
  });

  it.each(["한".repeat(4001), "🏨".repeat(2000) + "한", "\u0000".repeat(4001)])(
    "rejects a diagnostic exceeding the 4,000 UTF-16 unit limit",
    (diagnostic) => {
      const harness = createHarness();

      expect(post(harness, { type: "parse_error", diagnostic })).toEqual({
        ok: false,
        error: "request rejected",
      });
      expect(harness.spreadsheetAccesses).toBe(0);
      expect(harness.lockWaitArguments).toEqual([]);
    }
  );

  it("checks the 32KB body limit in actual UTF-8 bytes before parsing or writing", () => {
    const payload = { type: "parse_error", diagnostic: "한".repeat(4000) };
    const serialized = JSON.stringify(payload);
    const exactBody =
      serialized + " ".repeat(32768 - Buffer.byteLength(serialized));
    const exact = createHarness();

    expect(Buffer.byteLength(exactBody, "utf8")).toBe(32768);
    expect(post(exact, payload, exactBody)).toEqual({ ok: true });

    const oversized = createHarness();
    expect(post(oversized, payload, exactBody + " ")).toEqual({
      ok: false,
      error: "request rejected",
    });
    expect(oversized.spreadsheetAccesses).toBe(0);
    expect(oversized.lockWaitArguments).toEqual([]);
  });
});

describe("Google Apps Script feedback schema compatibility", () => {
  it("creates the canonical eight-column feedback header for a new sheet", () => {
    const harness = createHarness();

    expect(post(harness, validFeedback())).toEqual({ ok: true });

    const sheet = harness.spreadsheet.getSheetByName("feedback");
    expect(sheet?.rows[0]).toEqual(FEEDBACK_HEADERS);
    expect(sheet?.rows[1]).toHaveLength(8);
    expect(sheet?.rows[1].slice(1)).toEqual([
      "COURTYARD BY MARRIOTT",
      "Courtyard by Marriott",
      "include",
      "missing_suspected",
      "certain",
      "L2",
      "session-1",
    ]);
  });

  it("preserves the legacy difference column and old values while keeping the session in column nine", () => {
    const harness = createHarness();
    const sheet = harness.spreadsheet.insertSheet("feedback");
    const headers = [
      ...FEEDBACK_HEADERS.slice(0, 7),
      "expected_difference",
      "session_id",
    ];
    const oldRow = [
      "old date",
      "old merchant",
      "old hotel",
      "exclude",
      "needs_review",
      "low",
      "L2",
      300,
      "old session",
    ];
    sheet.rows = [[...headers], [...oldRow]];

    expect(post(harness, validFeedback())).toEqual({ ok: true });

    expect(sheet.rows[0]).toEqual(headers);
    expect(sheet.rows[1]).toEqual(oldRow);
    expect(sheet.rows[2]).toHaveLength(9);
    expect(sheet.rows[2].slice(1)).toEqual([
      "COURTYARD BY MARRIOTT",
      "Courtyard by Marriott",
      "include",
      "missing_suspected",
      "certain",
      "L2",
      "",
      "session-1",
    ]);
  });

  it("maps each sent field to reordered headers and leaves custom columns blank without changing old rows", () => {
    const harness = createHarness();
    const sheet = harness.spreadsheet.insertSheet("feedback");
    const headers = [
      "review_note",
      "session_id",
      "detected_status",
      "merchant_raw_name",
      "created_at",
      "point_type",
      "normalized_name",
      "user_action",
      "expected_difference",
      "detected_confidence",
      "reviewer",
    ];
    const oldRow = headers.map((header) => `existing:${header}`);
    sheet.rows = [[...headers], [...oldRow]];

    expect(
      post(harness, validFeedback({ merchant_raw_name: "=MARRIOTT" }))
    ).toEqual({ ok: true });

    expect(sheet.rows[0]).toEqual(headers);
    expect(sheet.rows[1]).toEqual(oldRow);
    const appended = sheet.rows[2];
    expect(appended).toHaveLength(headers.length);
    expect(appended[0]).toBe("");
    expect(appended[1]).toBe("session-1");
    expect(appended[2]).toBe("missing_suspected");
    expect(appended[3]).toBe("'=MARRIOTT");
    expect(Object.prototype.toString.call(appended[4])).toBe("[object Date]");
    expect(appended[5]).toBe("L2");
    expect(appended[6]).toBe("Courtyard by Marriott");
    expect(appended[7]).toBe("include");
    expect(appended[8]).toBe("");
    expect(appended[9]).toBe("certain");
    expect(appended[10]).toBe("");
  });

  it.each([
    [
      "missing required column",
      FEEDBACK_HEADERS.filter((header) => header !== "session_id"),
    ],
    ["duplicate required column", [...FEEDBACK_HEADERS, "merchant_raw_name"]],
    [
      "misspelled required column",
      FEEDBACK_HEADERS.map((header) =>
        header === "point_type" ? "point_types" : header
      ),
    ],
    [
      "whitespace around a required column",
      FEEDBACK_HEADERS.map((header) =>
        header === "session_id" ? "session_id " : header
      ),
    ],
    ["empty header row", ["", "", ""]],
  ] satisfies [string, string[]][])(
    "rejects %s without modifying existing Sheet data",
    (_label, headers) => {
      const harness = createHarness();
      const sheet = harness.spreadsheet.insertSheet("feedback");
      const oldRow = headers.map((header) => `old:${header}`);
      sheet.rows = [[...headers], [...oldRow]];

      expect(post(harness, validFeedback())).toEqual({
        ok: false,
        error: "request rejected",
      });
      expect(sheet.rows).toEqual([headers, oldRow]);
      expect(harness.properties.get(DAILY_KEY)).toBe("0");
      expect(harness.cache.size).toBe(0);
      expect(harness.flushCalls).toBe(0);
      expect(harness.lockReleases).toBe(1);
    }
  );
});

describe("Google Apps Script public version response", () => {
  it("exposes only a liveness message and the collector version without reading private state", () => {
    const harness = createHarness();
    harness.properties.set("COLLECTOR_PAUSED", "true");
    harness.properties.set(DAILY_KEY, "317");
    harness.properties.set("PRIVATE_PROPERTY", "private-property-value");
    harness.cache.set("private-cache-key", "private-cache-value");
    const sheet = harness.spreadsheet.insertSheet("feedback");
    sheet.rows = [
      [...FEEDBACK_HEADERS],
      [
        "old date",
        "private merchant",
        "",
        "include",
        "needs_review",
        "low",
        "L2",
        "private-session-id",
      ],
    ];

    const response = harness.context.doGet();

    expect(response.content).toBe(
      "Bonvoy L5 Checker collector is running. collectorVersion=2026-10-04.1"
    );
    expect(response.mimeType).toBe("text/plain");
    expect(harness.spreadsheetAccesses).toBe(0);
    expect(harness.flushCalls).toBe(0);
    expect(harness.lockWaitArguments).toEqual([]);
    expect(harness.events).toEqual([]);
  });
});

describe("Google Apps Script parse-error schema compatibility", () => {
  it.each([
    ["canonical two-column header", ["created_at", "diagnostic"]],
    [
      "canonical header with user-added columns",
      ["created_at", "diagnostic", "review_note", "reviewer"],
    ],
  ] satisfies [string, string[]][])(
    "preserves existing %s and row values when appending a diagnostic",
    (_label, headers) => {
      const harness = createHarness();
      const sheet = harness.spreadsheet.insertSheet("parse_error");
      const oldRow = headers.map((header) => `existing:${header}`);
      sheet.rows = [[...headers], [...oldRow]];

      expect(
        post(harness, { type: "parse_error", diagnostic: "=private diagnostic" })
      ).toEqual({ ok: true });

      expect(sheet.rows[0]).toEqual(headers);
      expect(sheet.rows[1]).toEqual(oldRow);
      expect(sheet.rows[2]).toHaveLength(2);
      expect(Object.prototype.toString.call(sheet.rows[2][0])).toBe(
        "[object Date]"
      );
      expect(sheet.rows[2][1]).toBe("'=private diagnostic");
      expect(
        sheet.getRange(3, 1, 1, headers.length).getValues()[0].slice(2)
      ).toEqual(Array(headers.length - 2).fill(""));
      expect(harness.properties.get(DAILY_KEY)).toBe("1");
      expect(harness.flushCalls).toBe(1);
      expect(harness.lockReleases).toBe(1);
    }
  );
});
