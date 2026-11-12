import { describe, expect, it } from "vitest";
import {
  analyzeTransactions,
  applyFeedback,
  summarizeResults,
} from "@/lib/analyzeTransactions";
import { classifyMerchant } from "@/lib/classifyMerchant";
import { buildAutomaticAliasFeedback } from "@/lib/feedback";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { marriottProperties } from "@/rules/marriott";
import type { NormalizedTransaction } from "@/types/transaction";

const merchantName = "RH SEAPORT DISTRICT";
const officialName = "Renaissance Boston Seaport District";

function transaction(
  overrides: Partial<NormalizedTransaction> = {}
): NormalizedTransaction {
  return {
    id: "synthetic-boston-seaport",
    rowIndex: 0,
    merchantName,
    originalAmount: 100000,
    eligibleAmount: 100000,
    pointType: "L2",
    actualPoints: 300,
    isCanceled: false,
    raw: {},
    ...overrides,
  };
}

describe("Renaissance Boston Seaport District candidate statement alias", () => {
  it("adds only a review-only alias without downgrading the existing hotel", () => {
    const property = marriottProperties.find(({ id }) => id === "us-boswf");
    expect(property).toMatchObject({
      propertyCode: "BOSWF",
      officialName,
      country: "US",
      region: "overseas",
      status: "active",
      brandGroup: "marriott",
      aliases: expect.arrayContaining([
        expect.objectContaining({
          value: merchantName,
          match: "exact",
          brandGroup: "marriott_candidate",
          confidence: "medium",
          status: "needs_review",
        }),
      ]),
    });
    expect(classifyMerchant(officialName)).toMatchObject({
      normalizedName: officialName,
      isLikelyMarriott: true,
      status: "active",
      region: "overseas",
    });
  });

  it.each([
    merchantName,
    "  rh seaport district  ",
    "RH   SEAPORT   DISTRICT",
    "RH-SEAPORT-DISTRICT",
  ])("recognizes the normalized full descriptor as a candidate (%s)", (name) => {
    expect(classifyMerchant(name)).toMatchObject({
      normalizedName: officialName,
      matchedPattern: merchantName,
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
      region: "overseas",
      reason: expect.stringContaining("추정"),
    });
    expect(classifyMerchant(name).reason).toContain("확인이 필요");
  });

  it.each([
    "RH",
    "SEAPORT DISTRICT",
    "RH SEAPORT",
    "RH SEAPORT DISTRICT SHOP",
    "OTHER RH SEAPORT DISTRICT",
    "RH SEAPORT DISTRICT2",
    "SEAPORT DISTRICT RH",
  ])("does not attach partial, extended, or reordered descriptors (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.normalizedName).not.toBe(officialName);
    expect(result.matchedPattern).not.toBe(merchantName);
    expect(result.isLikelyMarriott).toBe(false);
  });

  it.each([
    ["BOSAL", "Aloft by Marriott Boston Seaport District"],
    ["BOSEL", "Element by Marriott Boston Seaport District"],
    ["BOSOW", "The Westin Boston Seaport District"],
    ["BOSFP", "Residence Inn by Marriott Boston Downtown/Seaport"],
  ])("preserves the separate Seaport hotel %s", (propertyCode, name) => {
    expect(marriottProperties.find((property) => property.propertyCode === propertyCode)?.officialName).toBe(name);
    expect(classifyMerchant(name)).toMatchObject({
      normalizedName: name,
      isLikelyMarriott: true,
      status: "active",
      region: "overseas",
    });
  });

  it("keeps L5 normal without treating the candidate as a confirmed hotel match", () => {
    const results = analyzeTransactions([
      transaction({ pointType: "L5", actualPoints: 500 }),
    ]);
    expect(results[0]).toMatchObject({
      analysisStatus: "ok_l5",
      gradeConfirmedMarriott: true,
      effectiveIncluded: false,
      classification: {
        normalizedName: officialName,
        isLikelyMarriott: false,
        confidence: "medium",
        status: "needs_review",
      },
    });
    expect(results[0].difference).toBeUndefined();
    expect(summarizeResults(results)).toMatchObject({
      okL5Count: 1,
      includedCount: 0,
      totalExpectedAdditionalPoints: 0,
    });
    // A candidate still belongs in the existing local, opt-in report queue.
    expect(buildAutomaticAliasFeedback(results)).toEqual({
      "synthetic-boston-seaport": "include",
    });
  });

  it.each(["L1", "L2", "L3"])(
    "keeps %s in review and out of automatic totals and inquiries",
    (pointType) => {
      const results = analyzeTransactions([transaction({ pointType })]);
      expect(results[0]).toMatchObject({
        analysisStatus: "needs_review",
        expectedPointType: "L5",
        effectiveIncluded: false,
        classification: { normalizedName: officialName, confidence: "medium" },
      });
      expect(summarizeResults(results)).toMatchObject({
        missingSuspectedCount: 0,
        needsReviewCount: 1,
        includedCount: 0,
        totalExpectedAdditionalPoints: 0,
      });
      expect(buildInquiryMessage(results.filter((row) => row.effectiveIncluded))).toBe("");
      expect(buildAutomaticAliasFeedback(results)).toEqual({});
    }
  );

  it("requires explicit local inclusion and never promotes the global alias", () => {
    const included = applyFeedback(analyzeTransactions([transaction()]), {
      "synthetic-boston-seaport": "include",
    });
    expect(included[0]).toMatchObject({
      analysisStatus: "needs_review",
      effectiveIncluded: true,
      classification: { confidence: "medium", status: "needs_review" },
    });
    expect(summarizeResults(included).totalExpectedAdditionalPoints).toBe(200);
    expect(analyzeTransactions([transaction()])[0].effectiveIncluded).toBe(false);
    expect(classifyMerchant(merchantName).status).toBe("needs_review");
  });

  it.each([500, 600])("does not include a non-positive L2 gap (%s points)", (actualPoints) => {
    const results = analyzeTransactions([transaction({ actualPoints })]);
    expect(results[0]).toMatchObject({
      analysisStatus: "needs_review",
      effectiveIncluded: false,
    });
    const included = applyFeedback(results, { "synthetic-boston-seaport": "include" });
    expect(included[0].effectiveIncluded).toBe(false);
    expect(summarizeResults(included).totalExpectedAdditionalPoints).toBe(0);
  });

  it.each(["L2", "L5"])("preserves cancellation precedence for %s", (pointType) => {
    const results = analyzeTransactions([transaction({ pointType, isCanceled: true })]);
    expect(results[0]).toMatchObject({ analysisStatus: "canceled", effectiveIncluded: false });
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });
});
