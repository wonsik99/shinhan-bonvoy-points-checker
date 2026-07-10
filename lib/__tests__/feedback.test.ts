import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isFeedbackPersistenceEnabled,
  submitJudgments,
  submitParseErrorReport,
} from "@/lib/feedback";
import type { AnalysisResult } from "@/types/transaction";

const ENDPOINT = "https://script.google.com/macros/s/test/exec";

function result(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    id: "row-0-test",
    rowIndex: 0,
    transactionDate: "2026-04-17",
    postingDate: "2026-04-18",
    merchantName: "COURTYARD BY MARRIOTT",
    originalAmount: 209755,
    eligibleAmount: 209755,
    pointType: "L2",
    actualPoints: 629,
    isCanceled: false,
    cardNumberMasked: "****-****-****-3456",
    raw: { cardNumber: "1234-5678-9012-3456", private: true },
    classification: {
      isLikelyMarriott: true,
      confidence: "certain",
      status: "active",
      normalizedName: "Courtyard by Marriott",
      reason: "test",
      region: "overseas",
    },
    analysisStatus: "missing_suspected",
    expectedPointType: "L5",
    expectedPoints: 1049,
    difference: 420,
    effectiveIncluded: true,
    ...overrides,
  };
}

function installBrowser(existingSessionId: string | null = null) {
  const sessionStorage = {
    getItem: vi.fn(() => existingSessionId),
    setItem: vi.fn(),
  };
  const randomUUID = vi.fn(() => "sid-created");
  vi.stubGlobal("window", { sessionStorage });
  vi.stubGlobal("crypto", { randomUUID });
  return { sessionStorage, randomUUID };
}

function installFetch() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0) {
  const init = fetchMock.mock.calls[callIndex][1] as RequestInit;
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("feedback persistence configuration", () => {
  it("is enabled only when the collector endpoint is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", "");
    expect(isFeedbackPersistenceEnabled()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    expect(isFeedbackPersistenceEnabled()).toBe(true);
  });

  it("does not dispatch judgments when disabled, server-side, or empty", async () => {
    const fetchMock = installFetch();
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", "");
    expect(
      await submitJudgments([{ result: result(), action: "include" }])
    ).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    expect(
      await submitJudgments([{ result: result(), action: "include" }])
    ).toBe(false);

    installBrowser();
    expect(await submitJudgments([])).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("submitJudgments", () => {
  it("sends only allowlisted metadata using a no-cors text request", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    const { sessionStorage, randomUUID } = installBrowser();
    const fetchMock = installFetch();

    await expect(
      submitJudgments([{ result: result(), action: "include" }])
    ).resolves.toBe(true);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "bonvoy-l5-checker-session-id",
      "sid-created"
    );
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(ENDPOINT);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });

    const body = requestBody(fetchMock);
    expect(body).toEqual({
      type: "feedback",
      merchant_raw_name: "COURTYARD BY MARRIOTT",
      normalized_merchant_name: "Courtyard by Marriott",
      user_action: "include",
      detected_status: "missing_suspected",
      detected_confidence: "certain",
      point_type: "L2",
      anonymous_session_id: "sid-created",
    });
    expect(Object.keys(body).sort()).toEqual(
      [
        "anonymous_session_id",
        "detected_confidence",
        "detected_status",
        "merchant_raw_name",
        "normalized_merchant_name",
        "point_type",
        "type",
        "user_action",
      ].sort()
    );
    expect(JSON.stringify(body)).not.toContain("209755");
    expect(JSON.stringify(body)).not.toContain("3456");
    expect(JSON.stringify(body)).not.toContain("2026-04-17");
    expect(JSON.stringify(body)).not.toContain("private");
  });

  it("reuses one session id for every item in a batch", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    const { sessionStorage, randomUUID } = installBrowser("sid-existing");
    const fetchMock = installFetch();

    await expect(
      submitJudgments([
        { result: result({ id: "a" }), action: "include" },
        { result: result({ id: "b" }), action: "exclude" },
      ])
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBody(fetchMock, 0).anonymous_session_id).toBe("sid-existing");
    expect(requestBody(fetchMock, 1).anonymous_session_id).toBe("sid-existing");
    expect(randomUUID).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  it("marks user-designated rows and serializes absent names and grades as null", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    installBrowser("sid-existing");
    const fetchMock = installFetch();

    const designated = result({
      merchantName: "SAMMAEBONG CO LTD",
      pointType: "",
      analysisStatus: "not_marriott",
      userDesignatedMarriott: true,
      classification: {
        isLikelyMarriott: false,
        confidence: "none",
        status: "rejected",
        reason: "test",
      },
    });
    await submitJudgments([{ result: designated, action: "include" }]);

    expect(requestBody(fetchMock)).toMatchObject({
      normalized_merchant_name: null,
      detected_status: "user_designated",
      point_type: null,
    });
  });

  it("falls back to an anonymous id when session storage is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: vi.fn(() => {
          throw new Error("blocked");
        }),
        setItem: vi.fn(),
      },
    });
    const fetchMock = installFetch();

    await submitJudgments([{ result: result(), action: "unsure" }]);
    expect(requestBody(fetchMock).anonymous_session_id).toBe("anonymous");
  });

  it("returns false when a request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    installBrowser("sid-existing");
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitJudgments([{ result: result(), action: "include" }])
    ).resolves.toBe(false);
  });
});

describe("submitParseErrorReport", () => {
  it("truncates diagnostics to 4,000 characters", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    installBrowser();
    const fetchMock = installFetch();

    await expect(submitParseErrorReport("가".repeat(4001))).resolves.toBe(true);
    expect(requestBody(fetchMock)).toEqual({
      type: "parse_error",
      diagnostic: "가".repeat(4000),
    });
  });

  it("returns false without a browser or endpoint and on network failure", async () => {
    const fetchMock = installFetch();
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", "");
    expect(await submitParseErrorReport("diagnostic")).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", ENDPOINT);
    expect(await submitParseErrorReport("diagnostic")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    installBrowser();
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await submitParseErrorReport("diagnostic")).toBe(false);
  });
});
