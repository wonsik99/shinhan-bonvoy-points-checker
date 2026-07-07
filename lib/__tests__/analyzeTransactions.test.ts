import { describe, expect, it } from "vitest";
import {
  analyzeTransactions,
  applyFeedback,
  expectedL5Points,
  summarizeResults,
} from "@/lib/analyzeTransactions";
import type { NormalizedTransaction } from "@/types/transaction";

function tx(overrides: Partial<NormalizedTransaction>): NormalizedTransaction {
  return {
    id: overrides.id ?? "row-0-test",
    rowIndex: 0,
    merchantName: "FAIRFIELD INN ANN ARBO",
    originalAmount: 209755,
    eligibleAmount: 209755,
    pointType: "L2",
    actualPoints: 629,
    isCanceled: false,
    raw: {},
    ...overrides,
  };
}

describe("expectedL5Points", () => {
  it("computes 0.5% rounded", () => {
    expect(expectedL5Points(209755)).toBe(1049);
    expect(expectedL5Points(234068)).toBe(1170);
    expect(expectedL5Points(792371)).toBe(3962);
  });
});

describe("analyzeTransactions", () => {
  it("flags non-L5 certain Marriott rows as missing_suspected", () => {
    const [result] = analyzeTransactions([tx({})]);
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(1049 - 629);
    expect(result.effectiveIncluded).toBe(true);
  });

  it("marks L5 Marriott rows as ok_l5", () => {
    const [result] = analyzeTransactions([
      tx({ pointType: "L5", actualPoints: 1049 }),
    ]);
    expect(result.analysisStatus).toBe("ok_l5");
    expect(result.effectiveIncluded).toBe(false);
  });

  it("marks canceled rows as canceled regardless of merchant", () => {
    const [result] = analyzeTransactions([tx({ isCanceled: true })]);
    expect(result.analysisStatus).toBe("canceled");
    expect(result.effectiveIncluded).toBe(false);
  });

  it("marks non-Marriott merchants as not_marriott", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "ZIPPY AUTO WASH - ELLSWO" }),
    ]);
    expect(result.analysisStatus).toBe("not_marriott");
  });

  it("sends medium-confidence merchants to needs_review, not missing", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "HOTEL 55 CHICAGO" }),
    ]);
    expect(result.analysisStatus).toBe("needs_review");
    expect(result.effectiveIncluded).toBe(false);
    expect(result.expectedPoints).toBe(1049);
  });

  it("does not flag missing when difference is not positive", () => {
    const [result] = analyzeTransactions([
      tx({ pointType: "L2", actualPoints: 2000 }),
    ]);
    expect(result.analysisStatus).toBe("needs_review");
    expect(result.effectiveIncluded).toBe(false);
  });

  it("treats already-L5 review candidates as ok_l5", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "HOTEL 55 CHICAGO", pointType: "L5", actualPoints: 1049 }),
    ]);
    expect(result.analysisStatus).toBe("ok_l5");
  });
});

describe("domestic Marriott (L4) handling", () => {
  it("treats L4 on a domestic Marriott merchant as properly credited", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "코트야드메리어트서울남대문", pointType: "L4", actualPoints: 839 }),
    ]);
    expect(result.analysisStatus).toBe("ok_l5");
  });

  it("treats L5 on a domestic Marriott merchant as properly credited too", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "웨스틴조선서울", pointType: "L5", actualPoints: 1049 }),
    ]);
    expect(result.analysisStatus).toBe("ok_l5");
  });

  it("flags L1-credited domestic Marriott expecting L4 at 5P/1,000원", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "코트야드메리어트서울남대문", pointType: "L1", actualPoints: 210 }),
    ]);
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049); // round(209755 / 1000 × 5)
    expect(result.difference).toBe(1049 - 210);
    expect(result.classification.reason).toContain("L4");
  });

  it("still expects L5 for overseas Marriott merchants", () => {
    const [result] = analyzeTransactions([tx({})]);
    expect(result.expectedPointType).toBe("L5");
    expect(result.analysisStatus).toBe("missing_suspected");
  });

  it("does not treat L4 on an overseas Marriott merchant as proper", () => {
    const [result] = analyzeTransactions([
      tx({ pointType: "L4", actualPoints: 839 }),
    ]);
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.difference).toBe(1049 - 839);
  });
});

describe("applyFeedback", () => {
  it("includes review rows only after ✅ include", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "HOTEL 55 CHICAGO" }),
    ]);
    const included = applyFeedback(results, { [results[0].id]: "include" });
    expect(included[0].effectiveIncluded).toBe(true);
    expect(included[0].userFeedback).toBe("include");

    const excluded = applyFeedback(results, { [results[0].id]: "exclude" });
    expect(excluded[0].effectiveIncluded).toBe(false);

    const unsure = applyFeedback(results, { [results[0].id]: "unsure" });
    expect(unsure[0].effectiveIncluded).toBe(false);
  });

  it("does not include review rows with non-positive difference even when included", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "HOTEL 55 CHICAGO", actualPoints: 2000 }),
    ]);
    const included = applyFeedback(results, { [results[0].id]: "include" });
    expect(included[0].effectiveIncluded).toBe(false);
  });

  it("removes missing_suspected rows from totals on ❌ exclude", () => {
    const results = analyzeTransactions([tx({})]);
    const excluded = applyFeedback(results, { [results[0].id]: "exclude" });
    expect(excluded[0].effectiveIncluded).toBe(false);
  });
});

describe("user-designated Marriott (false-negative rescue)", () => {
  const notMarriott = tx({
    merchantName: "MYSTIQUE SANTORINI",
    originalAmount: 600000,
    eligibleAmount: 600000,
    pointType: "L2",
    actualPoints: 1800,
  });

  it("does nothing until the user flags it", () => {
    const [result] = analyzeTransactions([notMarriott]);
    expect(result.analysisStatus).toBe("not_marriott");
    expect(result.effectiveIncluded).toBe(false);
    expect(result.difference).toBeUndefined();
  });

  it("computes expected points and includes it once flagged ✅", () => {
    const results = analyzeTransactions([notMarriott]);
    const [flagged] = applyFeedback(results, { [results[0].id]: "include" });
    expect(flagged.userDesignatedMarriott).toBe(true);
    expect(flagged.expectedPoints).toBe(3000); // round(600000 / 1000 × 5)
    expect(flagged.difference).toBe(3000 - 1800);
    expect(flagged.effectiveIncluded).toBe(true);
    // Status stays not_marriott so the row remains flaggable in the full table.
    expect(flagged.analysisStatus).toBe("not_marriott");
  });

  it("counts the flagged points in the summary total", () => {
    const results = analyzeTransactions([notMarriott]);
    const summary = summarizeResults(
      applyFeedback(results, { [results[0].id]: "include" })
    );
    expect(summary.totalExpectedAdditionalPoints).toBe(1200);
  });

  it("reverts cleanly when the flag is toggled off", () => {
    const results = analyzeTransactions([notMarriott]);
    const [reverted] = applyFeedback(results, {});
    expect(reverted.userDesignatedMarriott).toBeUndefined();
    expect(reverted.effectiveIncluded).toBe(false);
    expect(reverted.analysisStatus).toBe("not_marriott");
  });

  it("does not fabricate missing points when the row was already well-credited", () => {
    const wellCredited = tx({
      merchantName: "MYSTIQUE SANTORINI",
      eligibleAmount: 600000,
      pointType: "L5",
      actualPoints: 3000,
    });
    const results = analyzeTransactions([wellCredited]);
    const [flagged] = applyFeedback(results, { [results[0].id]: "include" });
    expect(flagged.difference).toBe(0);
    expect(flagged.effectiveIncluded).toBe(false);
  });
});

describe("summarizeResults", () => {
  it("sums expected additional points over included rows only", () => {
    const results = analyzeTransactions([
      tx({ id: "a" }), // missing, diff 420
      tx({ id: "b", merchantName: "HOTEL 55 CHICAGO" }), // review, not included
      tx({ id: "c", merchantName: "ZIPPY AUTO WASH" }),
    ]);
    const summary = summarizeResults(results);
    expect(summary.totalCount).toBe(3);
    expect(summary.missingSuspectedCount).toBe(1);
    expect(summary.needsReviewCount).toBe(1);
    expect(summary.totalExpectedAdditionalPoints).toBe(1049 - 629);

    const withInclude = summarizeResults(
      applyFeedback(results, { "b": "include" })
    );
    expect(withInclude.totalExpectedAdditionalPoints).toBe((1049 - 629) * 2);
  });
});
