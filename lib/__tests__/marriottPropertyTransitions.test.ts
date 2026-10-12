import { describe, expect, it } from "vitest";
import { classifyMerchant, normalizeMerchantName } from "@/lib/classifyMerchant";
import { analyzeTransactions, applyFeedback } from "@/lib/analyzeTransactions";
import { isValidTransactionDate, matchMarriottPropertyTransition } from "@/lib/marriottPropertyTransitions";
import { marriottPropertyTransitions } from "@/rules/marriottPropertyTransitions";
import { marriottProperties } from "@/rules/marriott";
import type { NormalizedTransaction } from "@/types/transaction";

function tx(overrides: Partial<NormalizedTransaction> = {}): NormalizedTransaction {
  return {
    id: "transition-test",
    rowIndex: 0,
    merchantName: "W SOUTH BEACH",
    transactionDate: "2026-08-20",
    originalAmount: 100000,
    eligibleAmount: 100000,
    pointType: "L2",
    actualPoints: 300,
    isCanceled: false,
    raw: {},
    ...overrides,
  };
}

describe("Marriott affiliation transition guards", () => {
  it("preserves stable historical IDs and does not invent unknown end dates", () => {
    expect(marriottPropertyTransitions.map((row) => row.propertyCode)).toEqual([
      "MIAWS", "ATLBH", "DAYLM", "JANCY", "OKCCA",
    ]);
    for (const transition of marriottPropertyTransitions) {
      expect(marriottProperties.find((row) => row.propertyCode === transition.propertyCode)).toBeDefined();
      expect(transition.reviewedAt).toBe("2026-10-03");
      expect(transition.evidenceUrls.length).toBeGreaterThan(0);
      for (const url of transition.evidenceUrls) expect(new URL(url).protocol).toBe("https:");
      if (transition.propertyCode !== "MIAWS") expect(transition.lastMarriottOperatingDate).toBeUndefined();
    }
  });

  it.each(["2026-07-26", "2026-08-18", "2026-08-19"])(
    "keeps historical W South Beach payments on %s in the existing rules",
    (date) => {
      const [result] = analyzeTransactions([tx({ transactionDate: date })]);
      expect(result.classification.isLikelyMarriott).toBe(true);
      expect(result.analysisStatus).toBe("missing_suspected");
      expect(result.effectiveIncluded).toBe(true);
      expect(result.difference).toBe(200);
    }
  );

  it.each(["2026-08-20", "2026-10-03", "2027-01-01", undefined, "", "2026-08-32", "2026-02-29", "2026/08/19"])(
    "keeps W South Beach in review after departure or with an unusable date (%s)",
    (date) => {
      const [result] = analyzeTransactions([tx({ transactionDate: date })]);
      expect(result.classification).toMatchObject({ isLikelyMarriott: false, status: "needs_review", confidence: "medium" });
      expect(result.analysisStatus).toBe("needs_review");
      expect(result.effectiveIncluded).toBe(false);
    }
  );

  it.each(["W SOUTH BEACH", "WSOUTHBEACH", "VISA*W-SOUTH-BEACH F&B", "W HOTEL SOUTH BEACH"])(
    "handles statement punctuation and glued words (%s)",
    (name) => expect(classifyMerchant(name, "2026-08-20").status).toBe("needs_review")
  );

  it.each(["NW SOUTH BEACH", "W SOUTH BEACHFRONT", "W DUBAI THE PALM", "W NORTH BEACH"])(
    "does not apply the South Beach transition to other names (%s)",
    (name) => expect(matchMarriottPropertyTransition(normalizeMerchantName(name), "2026-10-03")).toBeUndefined()
  );

  it("does not infer a transaction date from posting or aggregation dates", () => {
    const [result] = analyzeTransactions([tx({
      transactionDate: undefined,
      postingDate: "2026-08-18",
      aggregationDate: "2026-08-18",
    })]);
    expect(result.analysisStatus).toBe("needs_review");
    const [historical] = analyzeTransactions([tx({
      transactionDate: "2026-08-19",
      postingDate: "2026-08-20",
      aggregationDate: "2026-10-03",
    })]);
    expect(historical.analysisStatus).toBe("missing_suspected");
  });

  it.each(["L4", "L5"])("preserves statement-confirmed %s priority", (pointType) => {
    const [result] = analyzeTransactions([tx({ pointType })]);
    expect(result.analysisStatus).toBe("ok_l5");
    expect(result.gradeConfirmedMarriott).toBe(true);
    expect(result.classification.status).toBe("needs_review");
  });

  it("preserves cancellation priority and local user feedback", () => {
    expect(analyzeTransactions([tx({ pointType: "L5", isCanceled: true })])[0].analysisStatus).toBe("canceled");
    const [review] = analyzeTransactions([tx()]);
    const [included] = applyFeedback([review], { [review.id]: "include" });
    expect(included.effectiveIncluded).toBe(true);
    expect(included.analysisStatus).toBe("needs_review");
    expect(included.difference).toBe(200);
  });

  it.each(marriottPropertyTransitions.filter((row) => row.propertyCode !== "MIAWS"))(
    "keeps unknown-date transitions in review before generic brand fallback ($propertyCode)",
    (transition) => {
      for (const date of ["2020-01-01", "2026-10-03", undefined]) {
        for (const alias of transition.aliases) {
          const [result] = analyzeTransactions([tx({ merchantName: alias, transactionDate: date })]);
          expect(result.analysisStatus, alias).toBe("needs_review");
          expect(result.effectiveIncluded, alias).toBe(false);
        }
      }
    }
  );

  it("does not confuse the separate Lenox Park property with ATLBH", () => {
    const name = "RESIDENCE INN BY MARRIOTT ATLANTA BUCKHEAD/LENOX PARK";
    expect(matchMarriottPropertyTransition(normalizeMerchantName(name))).toBeUndefined();
    expect(classifyMerchant(name)).toMatchObject({
      isLikelyMarriott: true,
      status: "active",
      normalizedName: "Residence Inn by Marriott Atlanta Buckhead",
    });
    expect(classifyMerchant("RESIDENCE INN BY MARRIOTT ATLANTA BUCKHEAD").status).toBe("needs_review");
    expect(classifyMerchant("FAIRFIELD LIMA MIRAFLORES").isLikelyMarriott).toBe(true);
    expect(classifyMerchant("COURTYARD JACKSON AIRPORT PEARL").isLikelyMarriott).toBe(true);
  });

  it.each(["COURTYARD BY MARRIOT JACKSON RIDGELAND", "RESIDENCE INN BY MARRIOT ATLANTA BUCKHEAD"])(
    "keeps the common one-T statement spelling inside the guard (%s)",
    (name) => expect(classifyMerchant(name).status).toBe("needs_review")
  );

  it.each(["2024-02-29", "2000-02-29", "2026-08-19", "2026-12-31"])(
    "accepts a real ISO calendar date (%s)",
    (value) => expect(isValidTransactionDate(value)).toBe(true)
  );
  it.each([undefined, "", "1900-02-29", "2026-04-31", "0000-01-01", "2026-00-01", "2026-13-01", "2026-01-00", "2026-08-19T00:00:00Z"])(
    "rejects malformed or impossible dates (%s)",
    (value) => expect(isValidTransactionDate(value)).toBe(false)
  );
});
