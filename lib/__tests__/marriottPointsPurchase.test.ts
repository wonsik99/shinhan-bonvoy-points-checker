import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeTransactions, applyFeedback, summarizeResults } from "@/lib/analyzeTransactions";
import { classifyMerchant } from "@/lib/classifyMerchant";
import {
  buildAutomaticAliasFeedback,
  isAutomaticAliasFeedbackCandidate,
  submitJudgments,
} from "@/lib/feedback";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { hotelAccrualExclusionRules } from "@/rules/marriottOverrides";
import type { NormalizedTransaction, UserFeedbackAction } from "@/types/transaction";

const merchantName = "Marriott by Points";
const transaction = (overrides: Partial<NormalizedTransaction> = {}): NormalizedTransaction => ({
  id: "synthetic-points-purchase",
  rowIndex: 0,
  merchantName,
  transactionDate: "2026-10-01",
  originalAmount: 100000,
  eligibleAmount: 100000,
  pointType: "L2",
  actualPoints: 300,
  isCanceled: false,
  raw: {},
  ...overrides,
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Reviewed Marriott points purchase exclusion", () => {
  it("contains only the manually approved exact descriptor", () => {
    expect(hotelAccrualExclusionRules).toEqual([{
      pattern: "MARRIOTT BY POINTS",
      match: "exact",
      reasonCode: "points_purchase",
      reason: "포인트 구매 거래 — 호텔 특별적립 검사 제외",
    }]);
  });

  it.each([
    merchantName,
    "MARRIOTT BY POINTS",
    "  marriott   by   points  ",
    "Marriott\u00a0by\u200bPoints",
  ])("identifies the complete normalized purchase descriptor (%s)", (name) => {
    expect(classifyMerchant(name)).toMatchObject({
      isLikelyMarriott: false,
      confidence: "high",
      status: "rejected",
      normalizedName: "메리어트 본보이 포인트 구매",
      hotelAccrualExclusion: "points_purchase",
      matchedPattern: "MARRIOTT BY POINTS",
      reason: "포인트 구매 거래 — 호텔 특별적립 검사 제외",
    });
  });

  it.each([
    "MARRIOTT", "POINTS", "BY POINTS", "MARRIOTT POINTS",
    "MARRIOTT BY POINTS HOTEL", "HOTEL MARRIOTT BY POINTS",
    "MARRIOTT BY POINTS2", "MARRIOTT BY POINT", "POINTS BY MARRIOTT",
    "MARRIOTTBYPOINTS", "MARRIOTT-BY-POINTS",
  ])("does not extend the exclusion to an unapproved descriptor (%s)", (name) => {
    expect(classifyMerchant(name).hotelAccrualExclusion).toBeUndefined();
  });

  it.each([
    "FOUR POINTS BY SHERATON",
    "FOUR POINTS FLEX BY SHERATON",
    "QINHUANGDAO MARRIOTT RESO",
    "London Marriott Hotel Maida Vale",
  ])("keeps actual Marriott hotel rules intact (%s)", (name) => {
    const result = analyzeTransactions([transaction({ merchantName: name })])[0];
    expect(result.classification.hotelAccrualExclusion).toBeUndefined();
    expect(result.classification.isLikelyMarriott).toBe(true);
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.effectiveIncluded).toBe(true);
  });

  it.each(["L1", "L2", "L3"])("excludes %s purchases without computing hotel points", (pointType) => {
    const input = transaction({ pointType });
    const results = analyzeTransactions([input]);
    expect(results[0]).toMatchObject({ ...input, analysisStatus: "not_marriott", effectiveIncluded: false });
    expect(results[0].expectedPointType).toBeUndefined();
    expect(results[0].expectedPoints).toBeUndefined();
    expect(results[0].difference).toBeUndefined();
    expect(summarizeResults(results)).toMatchObject({
      totalCount: 1, marriottCount: 0, missingSuspectedCount: 0,
      needsReviewCount: 0, okL5Count: 0, includedCount: 0,
      totalExpectedAdditionalPoints: 0,
    });
    expect(buildInquiryMessage(results.filter((row) => row.effectiveIncluded))).toBe("");
  });

  it.each([0, 500, 999])("does not certify or recalculate the actual L2 award (%s)", (actualPoints) => {
    const [result] = analyzeTransactions([transaction({ actualPoints })]);
    expect(result.actualPoints).toBe(actualPoints);
    expect(result.analysisStatus).toBe("not_marriott");
    expect(result.expectedPoints).toBeUndefined();
    expect(result.difference).toBeUndefined();
  });

  it.each(["L4", "L5"])("preserves observed %s precedence without suggesting a hotel alias", (pointType) => {
    const results = analyzeTransactions([transaction({ pointType, actualPoints: 500 })]);
    expect(results[0]).toMatchObject({
      analysisStatus: "ok_l5", gradeConfirmedMarriott: true,
      actualPoints: 500, effectiveIncluded: false,
    });
    expect(summarizeResults(results)).toMatchObject({ okL5Count: 1, okAccruedPoints: 500 });
    expect(isAutomaticAliasFeedbackCandidate(results[0])).toBe(false);
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });

  it.each(["L2", "L4", "L5"])("preserves cancellation precedence for %s", (pointType) => {
    const results = analyzeTransactions([transaction({ pointType, isCanceled: true })]);
    expect(results[0]).toMatchObject({ analysisStatus: "canceled", effectiveIncluded: false });
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });

  it.each<UserFeedbackAction>(["include", "exclude", "unsure"])(
    "does not promote the purchase through local feedback (%s)", (action) => {
      const results = applyFeedback(analyzeTransactions([transaction()]), {
        "synthetic-points-purchase": action,
      });
      expect(results[0].analysisStatus).toBe("not_marriott");
      expect(results[0].effectiveIncluded).toBe(false);
      expect(results[0].userDesignatedMarriott).toBeUndefined();
      expect(results[0].userFeedback).toBeUndefined();
      expect(results[0].difference).toBeUndefined();
      expect(summarizeResults(results).totalExpectedAdditionalPoints).toBe(0);
    }
  );

  it("clears stale inclusion fields without mutating the original record", () => {
    const [original] = analyzeTransactions([transaction()]);
    const stale = {
      ...original, effectiveIncluded: true, userDesignatedMarriott: true,
      userFeedback: "include" as const, expectedPointType: "L5" as const,
      expectedPoints: 500, difference: 200,
    };
    const [result] = applyFeedback([stale], {});
    expect(result.effectiveIncluded).toBe(false);
    expect(result.expectedPointType).toBeUndefined();
    expect(result.expectedPoints).toBeUndefined();
    expect(result.difference).toBeUndefined();
    expect(stale.effectiveIncluded).toBe(true);
  });

  it("excludes only the purchase from a mixed session and preserves unmatched-hotel rescue", () => {
    const results = applyFeedback(analyzeTransactions([
      transaction({ eligibleAmount: 3000000 }),
      transaction({ id: "hotel", merchantName: "FOUR POINTS BY SHERATON" }),
      transaction({ id: "unknown", merchantName: "SAMMAEBONG CO LTD" }),
    ]), { unknown: "include", "synthetic-points-purchase": "include" });
    expect(results[2].userDesignatedMarriott).toBe(true);
    expect(summarizeResults(results)).toMatchObject({ includedCount: 2, totalExpectedAdditionalPoints: 400 });
    const inquiry = buildInquiryMessage(results.filter((row) => row.effectiveIncluded));
    expect(inquiry).not.toContain(merchantName);
    expect(inquiry).toContain("FOUR POINTS BY SHERATON");
    expect(inquiry).toContain("SAMMAEBONG CO LTD");
  });

  it("still queues a genuinely unmapped L5 hotel", () => {
    const results = analyzeTransactions([transaction({ merchantName: "UNMAPPED TEST MERCHANT", pointType: "L5" })]);
    expect(buildAutomaticAliasFeedback(results)).toEqual({ "synthetic-points-purchase": "include" });
  });

  it("never transmits the known points purchase as a hotel judgment", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", "https://collector.invalid/exec");
    vi.stubGlobal("window", {});
    const fetchMock = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", fetchMock);
    const [purchase] = analyzeTransactions([transaction()]);
    expect(await submitJudgments([{ result: purchase, action: "include" }])).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    const [hotel] = analyzeTransactions([transaction({ id: "hotel", merchantName: "FOUR POINTS BY SHERATON" })]);
    expect(await submitJudgments([
      { result: purchase, action: "include" }, { result: hotel, action: "include" },
    ])).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.merchant_raw_name).toBe("FOUR POINTS BY SHERATON");
    expect(payload).not.toHaveProperty("hotelAccrualExclusion");
  });
});
