import { describe, expect, it } from "vitest";
import { analyzeTransactions } from "@/lib/analyzeTransactions";
import { classifyMerchant } from "@/lib/classifyMerchant";
import { koreaMarriottProperties } from "@/rules/marriott";
import type { NormalizedTransaction } from "@/types/transaction";

const officialName = "The Westin Seoul Parnas";

function transaction(
  overrides: Partial<NormalizedTransaction> = {}
): NormalizedTransaction {
  return {
    id: "synthetic-parnas",
    rowIndex: 0,
    merchantName: "(주)파르나스호텔",
    originalAmount: 100000,
    eligibleAmount: 100000,
    pointType: "L1",
    actualPoints: 100,
    isCanceled: false,
    raw: {},
    ...overrides,
  };
}

describe("The Westin Seoul Parnas operator-name alias", () => {
  it("keeps only the bare and company operator names as review candidates", () => {
    const [property] = koreaMarriottProperties.filter(
      ({ id }) => id === "kr-westin-seoul-parnas"
    );
    const operatorAliases = property.aliases.filter(
      ({ status }) => status === "needs_review"
    );
    expect(operatorAliases.map(({ value, match }) => [value, match])).toEqual([
      ["파르나스", "exact"],
      ["파르나스호텔", "contains"],
    ]);
  });

  it.each(["파르나스", "(주)파르나스호텔", "파르나스호텔(주)", "파르나스 호텔"])(
    "keeps the operator name %s in review",
    (name) => {
      expect(classifyMerchant(name)).toMatchObject({
        isLikelyMarriott: false,
        status: "needs_review",
        confidence: "medium",
        normalizedName: officialName,
        region: "domestic",
      });
    }
  );

  it.each([
    "카츠8 파르나스몰점",
    "파르나스몰",
    "파르나스타워 스타벅스",
    "그랜드인터컨티넨탈서울파르나스",
    "그랜드 인터컨티넨탈 파르나스",
  ])("does not suggest the Westin for the non-hotel or IHG name %s", (name) => {
    const result = classifyMerchant(name);
    expect(result.normalizedName).not.toBe(officialName);
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.status).toBe("rejected");
  });

  it.each(["웨스틴파르나스", "웨스틴서울파르나스", "WESTIN SEOUL PARNAS"])(
    "still confirms the Westin name %s",
    (name) => {
      expect(classifyMerchant(name)).toMatchObject({
        isLikelyMarriott: true,
        status: "active",
        region: "domestic",
      });
    }
  );

  it("leaves a mall tenant out of review and the inquiry", () => {
    const [result] = analyzeTransactions([
      transaction({ merchantName: "카츠8 파르나스몰점" }),
    ]);
    expect(result).toMatchObject({
      analysisStatus: "not_marriott",
      effectiveIncluded: false,
    });
  });

  it("keeps an L1 operator-name payment in review rather than auto-counting it", () => {
    const [result] = analyzeTransactions([transaction()]);
    expect(result).toMatchObject({
      analysisStatus: "needs_review",
      expectedPointType: "L4",
      difference: 400,
      effectiveIncluded: false,
    });
  });

  it("treats an L4 operator-name payment as normal accrual", () => {
    const [result] = analyzeTransactions([
      transaction({ pointType: "L4", actualPoints: 500 }),
    ]);
    expect(result).toMatchObject({
      analysisStatus: "ok_l5",
      gradeConfirmedMarriott: true,
    });
  });
});
