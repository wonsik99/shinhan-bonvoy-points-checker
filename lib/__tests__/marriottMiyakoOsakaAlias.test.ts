import { describe, expect, it } from "vitest";
import { analyzeTransactions, summarizeResults } from "@/lib/analyzeTransactions";
import { classifyMerchant } from "@/lib/classifyMerchant";
import { buildAutomaticAliasFeedback } from "@/lib/feedback";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { marriottProperties } from "@/rules/marriott";
import type { NormalizedTransaction } from "@/types/transaction";

const officialName = "Sheraton Miyako Hotel Osaka";
const merchantName = "MIYAKO HOTELSSHERATON OSK";

function transaction(
  overrides: Partial<NormalizedTransaction> = {}
): NormalizedTransaction {
  return {
    id: "synthetic-miyako-osaka",
    rowIndex: 0,
    merchantName,
    originalAmount: 100000,
    eligibleAmount: 100000,
    pointType: "L5",
    actualPoints: 500,
    isCanceled: false,
    raw: {},
    ...overrides,
  };
}

describe("Sheraton Miyako Hotel Osaka glued statement alias", () => {
  it("attaches the exact statement name to the existing Osaka hotel", () => {
    const property = marriottProperties.find(({ id }) => id === "jp-osays");
    expect(property).toMatchObject({
      officialName,
      propertyCode: "OSAYS",
      country: "JP",
      region: "overseas",
      brand: "Sheraton",
      status: "active",
      aliases: expect.arrayContaining([
        expect.objectContaining({
          value: merchantName,
          match: "exact",
          confidence: "high",
          status: "active",
          brandGroup: "marriott",
        }),
      ]),
    });
  });

  it.each([
    merchantName,
    "  miyako hotelssheraton osk  ",
    "MIYAKO HOTELS SHERATON OSK",
    "MIYAKO HOTELS-SHERATON OSK",
  ])("recognizes the normalized full statement name (%s)", (name) => {
    expect(classifyMerchant(name)).toMatchObject({
      isLikelyMarriott: true,
      confidence: "high",
      status: "active",
      normalizedName: officialName,
      matchedPattern: merchantName,
      region: "overseas",
    });
  });

  it.each([officialName, "SHERATON MIYAKO HOTEL OSAKA"])(
    "preserves the official-name match (%s)",
    (name) => {
      expect(classifyMerchant(name)).toMatchObject({
        isLikelyMarriott: true,
        normalizedName: officialName,
        region: "overseas",
      });
    }
  );

  it("keeps the Tokyo Sheraton Miyako separate", () => {
    expect(classifyMerchant("Sheraton Miyako Hotel Tokyo").normalizedName).toBe(
      "Sheraton Miyako Hotel Tokyo"
    );
  });

  it("keeps Osaka Marriott Miyako Hotel separate from Sheraton Miyako", () => {
    const otherHotel = marriottProperties.find(({ propertyCode }) => propertyCode === "OSAMC");
    expect(otherHotel?.id).not.toBe("jp-osays");
    expect(classifyMerchant("Osaka Marriott Miyako Hotel").normalizedName).toBe(
      "Osaka Marriott Miyako Hotel"
    );
  });

  it.each([
    "MIYAKO HOTELS",
    "MIYAKO HOTELSSHERATON",
    "MIYAKO HOTELSSHERATON TKY",
    "MIYAKO HOTEL KYOTO HACHIJO",
    "MIYAKO HOTELSSHERATON OSK SHOP",
    "OTHER MIYAKO HOTELSSHERATON OSK",
    "MIYAKO HOTELSSHERATON OSK2",
    "MIYAKO HOTELSSHERATON OSA",
    "OSK MIYAKO HOTELSSHERATON",
  ])("does not map other Miyako Hotels names to Osaka (%s)", (name) => {
    const classification = classifyMerchant(name);
    expect(classification.normalizedName).not.toBe(officialName);
    expect(classification.matchedPattern).not.toBe(merchantName);
  });

  it("keeps L5 normal and stops suggesting it as an unmapped alias", () => {
    const results = analyzeTransactions([transaction()]);
    expect(results[0]).toMatchObject({
      analysisStatus: "ok_l5",
      gradeConfirmedMarriott: true,
      effectiveIncluded: false,
      classification: { normalizedName: officialName, region: "overseas" },
    });
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });

  it("uses the overseas L2-to-L5 rule when a positive difference exists", () => {
    const [result] = analyzeTransactions([
      transaction({ pointType: "L2", actualPoints: 300 }),
    ]);
    expect(result).toMatchObject({
      analysisStatus: "missing_suspected",
      expectedPointType: "L5",
      expectedPoints: 500,
      difference: 200,
      effectiveIncluded: true,
    });
  });

  it.each(["L1", "L3"])(
    "keeps %s in review and out of automatic totals and inquiry text",
    (pointType) => {
      const results = analyzeTransactions([
        transaction({ pointType, actualPoints: 300 }),
      ]);
      expect(results[0]).toMatchObject({
        analysisStatus: "needs_review",
        effectiveIncluded: false,
        classification: { normalizedName: officialName },
      });
      expect(summarizeResults(results)).toMatchObject({
        missingSuspectedCount: 0,
        needsReviewCount: 1,
        totalExpectedAdditionalPoints: 0,
      });
      expect(buildInquiryMessage(results.filter((row) => row.effectiveIncluded))).toBe("");
      expect(buildAutomaticAliasFeedback(results)).toEqual({});
    }
  );

  it.each([500, 600])("does not suspect missing points for L2 with %s points", (actualPoints) => {
    const [result] = analyzeTransactions([transaction({ pointType: "L2", actualPoints })]);
    expect(result).toMatchObject({ analysisStatus: "needs_review", effectiveIncluded: false });
  });

  it("preserves cancellation precedence", () => {
    const [result] = analyzeTransactions([transaction({ isCanceled: true })]);
    expect(result).toMatchObject({
      analysisStatus: "canceled",
      effectiveIncluded: false,
    });
  });
});
