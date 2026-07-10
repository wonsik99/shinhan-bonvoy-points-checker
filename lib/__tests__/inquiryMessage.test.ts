import { describe, expect, it } from "vitest";
import { analyzeTransactions, applyFeedback } from "@/lib/analyzeTransactions";
import { buildInquiryMessage } from "@/lib/inquiryMessage";

describe("buildInquiryMessage", () => {
  it("returns empty string when nothing is included", () => {
    expect(buildInquiryMessage([])).toBe("");
  });

  it("lists included rows with dates, amounts, and total difference", () => {
    const results = analyzeTransactions([
      {
        id: "row-0",
        rowIndex: 0,
        transactionDate: "2026-04-17",
        merchantName: "POSTCARD CABINS THE TH",
        originalAmount: 209755,
        eligibleAmount: 209755,
        pointType: "L2",
        actualPoints: 629,
        isCanceled: false,
        raw: {},
      },
    ]);
    const message = buildInquiryMessage(results.filter((r) => r.effectiveIncluded));

    expect(message).toContain("신한 메리어트 본보이 카드 포인트 적립 관련 문의드립니다");
    expect(message).toContain(
      "- 2026-04-17 / POSTCARD CABINS THE TH / 209,755원 / 실제 L2 → L5 예상 / 차이 420P"
    );
    expect(message).toContain("총 420포인트가 덜 적립된 것으로 보입니다");
  });

  it("uses the domestic L4 expectation for an included review candidate", () => {
    const results = analyzeTransactions([
      {
        id: "domestic-review",
        rowIndex: 0,
        transactionDate: "2026-04-17",
        merchantName: "THE PLAZA",
        originalAmount: 209755,
        eligibleAmount: 209755,
        pointType: "L1",
        actualPoints: 210,
        isCanceled: false,
        raw: {},
      },
    ]);
    const included = applyFeedback(results, { "domestic-review": "include" });
    const message = buildInquiryMessage(
      included.filter((result) => result.effectiveIncluded)
    );

    expect(message).toContain("실제 L1 → L4 예상 / 차이 839P");
  });

  it("falls back for missing dates and grades and never reports a negative gap", () => {
    const [base] = analyzeTransactions([
      {
        id: "fallbacks",
        rowIndex: 0,
        postingDate: "2026-04-18",
        merchantName: "HOTEL 55 CHICAGO",
        originalAmount: 100000,
        eligibleAmount: 100000,
        pointType: "",
        actualPoints: 900,
        isCanceled: false,
        raw: {},
      },
    ]);
    const message = buildInquiryMessage([
      {
        ...base,
        expectedPointType: undefined,
        difference: undefined,
      },
      {
        ...base,
        id: "no-date",
        transactionDate: undefined,
        postingDate: undefined,
        pointType: "L1",
        expectedPointType: "L4",
        difference: -10,
      },
    ]);

    expect(message).toContain(
      "- 2026-04-18 / HOTEL 55 CHICAGO / 100,000원 / 실제 등급 미상 → L5 예상 / 차이 0P"
    );
    expect(message).toContain(
      "- 날짜 미상 / HOTEL 55 CHICAGO / 100,000원 / 실제 L1 → L4 예상 / 차이 0P"
    );
    expect(message).toContain("총 0포인트");
  });

  it("includes a user-designated Marriott row in the summary and message", () => {
    const results = analyzeTransactions([
      {
        id: "manual",
        rowIndex: 0,
        transactionDate: "2026-04-17",
        merchantName: "SAMMAEBONG CO LTD",
        originalAmount: 600000,
        eligibleAmount: 600000,
        pointType: "L2",
        actualPoints: 1800,
        isCanceled: false,
        raw: {},
      },
    ]);
    const flagged = applyFeedback(results, { manual: "include" });
    const message = buildInquiryMessage(
      flagged.filter((result) => result.effectiveIncluded)
    );

    expect(message).toContain("SAMMAEBONG CO LTD");
    expect(message).toContain("실제 L2 → L5 예상 / 차이 1,200P");
    expect(message).toContain("총 1,200포인트");
  });
});
