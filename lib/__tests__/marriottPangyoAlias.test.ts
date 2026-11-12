import { describe, expect, it } from "vitest";
import { analyzeTransactions } from "@/lib/analyzeTransactions";
import { classifyMerchant } from "@/lib/classifyMerchant";
import { buildAutomaticAliasFeedback } from "@/lib/feedback";
import { koreaMarriottProperties } from "@/rules/marriott";
import type { NormalizedTransaction } from "@/types/transaction";

const officialName = "Courtyard by Marriott Seoul Pangyo";
const merchantName = "판교테크노밸리호텔";

function transaction(
  overrides: Partial<NormalizedTransaction> = {}
): NormalizedTransaction {
  return {
    id: "synthetic-pangyo",
    rowIndex: 0,
    merchantName,
    originalAmount: 100000,
    eligibleAmount: 100000,
    pointType: "L4",
    actualPoints: 500,
    isCanceled: false,
    raw: {},
    ...overrides,
  };
}

describe("Courtyard Seoul Pangyo business-name alias", () => {
  it("attaches the exact business name to the existing domestic hotel", () => {
    const properties = koreaMarriottProperties.filter(
      (property) => property.id === "kr-courtyard-seoul-pangyo"
    );
    expect(properties).toHaveLength(1);
    expect(properties[0]).toMatchObject({
      officialName,
      country: "KR",
      region: "domestic",
      brand: "Courtyard by Marriott",
      aliases: expect.arrayContaining([
        expect.objectContaining({ value: merchantName, match: "exact" }),
      ]),
    });
  });

  it.each([merchantName, "  판교 테크노밸리 호텔  "])(
    "recognizes the verified business name with optional spacing (%s)",
    (name) => {
      expect(classifyMerchant(name)).toMatchObject({
        isLikelyMarriott: true,
        confidence: "high",
        status: "active",
        normalizedName: officialName,
        matchedPattern: merchantName,
        region: "domestic",
      });
    }
  );

  it.each([
    "COURTYARD MARRIOTT SEOUL PANGYO",
    "COURTYARD BY MARRIOTT SEOUL PANGYO",
    "코트야드메리어트판교",
    "코트야드서울판교",
  ])("preserves the existing domestic aliases (%s)", (name) => {
    expect(classifyMerchant(name)).toMatchObject({
      isLikelyMarriott: true,
      status: "active",
      region: "domestic",
    });
  });

  it.each([
    "판교테크노밸리",
    "판교테크노밸리호텔용품",
    "가상판교테크노밸리호텔",
  ])("does not promote partial or extended business names (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.normalizedName).not.toBe(officialName);
  });

  it("keeps L4 normal and stops suggesting it as an unmapped alias", () => {
    const results = analyzeTransactions([transaction()]);
    expect(results[0]).toMatchObject({
      analysisStatus: "ok_l5",
      gradeConfirmedMarriott: true,
      effectiveIncluded: false,
      classification: { normalizedName: officialName, region: "domestic" },
    });
    expect(results[0].difference).toBeUndefined();
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });

  it("uses the domestic L1-to-L4 rule when a positive difference exists", () => {
    const [result] = analyzeTransactions([
      transaction({ pointType: "L1", actualPoints: 100 }),
    ]);
    expect(result).toMatchObject({
      analysisStatus: "missing_suspected",
      expectedPointType: "L4",
      expectedPoints: 500,
      difference: 400,
      effectiveIncluded: true,
    });
  });

  it("keeps an unexpected L2 grade in review rather than auto-counting it", () => {
    const [result] = analyzeTransactions([
      transaction({ pointType: "L2", actualPoints: 300 }),
    ]);
    expect(result).toMatchObject({
      analysisStatus: "needs_review",
      expectedPointType: "L4",
      effectiveIncluded: false,
    });
  });

  it("preserves cancellation precedence", () => {
    const [result] = analyzeTransactions([transaction({ isCanceled: true })]);
    expect(result).toMatchObject({
      analysisStatus: "canceled",
      effectiveIncluded: false,
    });
    expect(buildAutomaticAliasFeedback([result])).toEqual({});
  });
});
