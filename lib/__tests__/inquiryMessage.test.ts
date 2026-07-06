import { describe, expect, it } from "vitest";
import { analyzeTransactions } from "@/lib/analyzeTransactions";
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
      "- 2026-04-17 / POSTCARD CABINS THE TH / 209,755원 / 실제 L2 / 예상 차이 420P"
    );
    expect(message).toContain("총 420포인트가 덜 적립된 것으로 보입니다");
  });
});
