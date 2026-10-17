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

const merchantName = "QINHUANGDAO MARRIOTT RESO";
const officialName = "Qinhuangdao Marriott Resort";

function transaction(
  overrides: Partial<NormalizedTransaction> = {}
): NormalizedTransaction {
  return {
    id: "synthetic-qinhuangdao",
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

describe("Qinhuangdao Marriott Resort truncated statement alias", () => {
  it("attaches the exact descriptor to the existing Chinese hotel", () => {
    const property = marriottProperties.find(({ id }) => id === "cn-bpemc");
    expect(property).toMatchObject({
      officialName,
      propertyCode: "BPEMC",
      country: "CN",
      region: "overseas",
      brand: "Marriott Hotels",
      status: "active",
      aliases: expect.arrayContaining([
        expect.objectContaining({
          value: merchantName,
          match: "exact",
          brandGroup: "marriott",
          confidence: "high",
          status: "active",
        }),
      ]),
    });
  });

  it.each([
    merchantName,
    "  qinhuangdao marriott reso  ",
    "QINHUANGDAO   MARRIOTT   RESO",
    "QINHUANGDAO-MARRIOTT-RESO",
  ])("recognizes the normalized full descriptor (%s)", (name) => {
    expect(classifyMerchant(name)).toMatchObject({
      normalizedName: officialName,
      matchedPattern: merchantName,
      isLikelyMarriott: true,
      confidence: "high",
      status: "active",
      region: "overseas",
    });
  });

  it.each([officialName, "QINHUANGDAO MARRIOTT RESORT"])(
    "preserves the complete official-name match (%s)",
    (name) => {
      expect(classifyMerchant(name)).toMatchObject({
        normalizedName: officialName,
        isLikelyMarriott: true,
        status: "active",
        region: "overseas",
      });
    }
  );

  it.each([
    ["SHPCY", "Courtyard by Marriott Qinhuangdao West"],
    ["SHPSI", "Sheraton Qinhuangdao Beidaihe Hotel"],
    ["SHPFI", "Fairfield by Marriott Qinhuangdao Haigang"],
  ])("keeps the separate Qinhuangdao hotel %s distinct", (propertyCode, name) => {
    expect(
      marriottProperties.find((property) => property.propertyCode === propertyCode)
        ?.officialName
    ).toBe(name);
    expect(classifyMerchant(name)).toMatchObject({
      normalizedName: name,
      isLikelyMarriott: true,
      status: "active",
      region: "overseas",
    });
  });

  it.each([
    "QINHUANGDAO",
    "QINHUANGDAO MARRIOTT",
    "QINHUANGDAO MARRIOTT RES",
    "BEIJING MARRIOTT RESO",
    "QINHUANGDAO MARRIOTT RESO SHOP",
    "OTHER QINHUANGDAO MARRIOTT RESO",
    "QINHUANGDAO MARRIOTT RESO2",
    "MARRIOTT RESO QINHUANGDAO",
  ])("does not apply the alias to partial or extended descriptors (%s)", (name) => {
    // Existing brand/token rules may still recognize Marriott independently.
    expect(classifyMerchant(name).matchedPattern).not.toBe(merchantName);
  });

  it.each(["L4", "L5"])("preserves normal %s accrual", (pointType) => {
    const results = analyzeTransactions([
      transaction({ pointType, actualPoints: 500 }),
    ]);
    expect(results[0]).toMatchObject({
      analysisStatus: "ok_l5",
      gradeConfirmedMarriott: true,
      effectiveIncluded: false,
      classification: { normalizedName: officialName, region: "overseas" },
    });
    expect(summarizeResults(results).totalExpectedAdditionalPoints).toBe(0);
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });

  it("preserves the overseas L2 rule and the original merchant in the inquiry", () => {
    const results = analyzeTransactions([transaction()]);
    expect(results[0]).toMatchObject({
      analysisStatus: "missing_suspected",
      expectedPointType: "L5",
      expectedPoints: 500,
      difference: 200,
      effectiveIncluded: true,
      classification: { normalizedName: officialName, confidence: "high" },
    });
    expect(summarizeResults(results)).toMatchObject({
      missingSuspectedCount: 1,
      includedCount: 1,
      totalExpectedAdditionalPoints: 200,
    });
    expect(buildInquiryMessage(results)).toContain(merchantName);
    expect(buildInquiryMessage(results)).not.toContain(officialName);
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });

  it.each(["L1", "L3"])("keeps %s review-only", (pointType) => {
    const results = analyzeTransactions([transaction({ pointType })]);
    expect(results[0]).toMatchObject({
      analysisStatus: "needs_review",
      effectiveIncluded: false,
      classification: { normalizedName: officialName },
    });
    expect(summarizeResults(results).totalExpectedAdditionalPoints).toBe(0);
    expect(buildInquiryMessage(results.filter((row) => row.effectiveIncluded))).toBe("");
  });

  it.each([500, 600])("does not include a non-positive L2 gap (%s points)", (actualPoints) => {
    const results = analyzeTransactions([transaction({ actualPoints })]);
    expect(results[0]).toMatchObject({
      analysisStatus: "needs_review",
      effectiveIncluded: false,
    });
    const included = applyFeedback(results, { "synthetic-qinhuangdao": "include" });
    expect(included[0].effectiveIncluded).toBe(false);
    expect(summarizeResults(included).totalExpectedAdditionalPoints).toBe(0);
  });

  it("allows local exclusion without changing the global alias", () => {
    const results = applyFeedback(analyzeTransactions([transaction()]), {
      "synthetic-qinhuangdao": "exclude",
    });
    expect(results[0].effectiveIncluded).toBe(false);
    expect(summarizeResults(results).totalExpectedAdditionalPoints).toBe(0);
    expect(analyzeTransactions([transaction()])[0].effectiveIncluded).toBe(true);
  });

  it.each(["L2", "L5"])("preserves cancellation precedence for %s", (pointType) => {
    const results = analyzeTransactions([transaction({ pointType, isCanceled: true })]);
    expect(results[0]).toMatchObject({
      analysisStatus: "canceled",
      effectiveIncluded: false,
    });
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });
});
