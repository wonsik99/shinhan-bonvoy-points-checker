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
  it("flags L2-credited overseas Marriott expecting L5", () => {
    const [result] = analyzeTransactions([tx({})]);
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L5");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(1049 - 629);
    expect(result.effectiveIncluded).toBe(true);
  });

  it("flags a shared Qingdao merchant as overseas Marriott expecting L5", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "QINGDAOQINGMAOIYEYOXINGON" }),
    ]);

    expect(result.classification.normalizedName).toBe(
      "Renaissance Qingdao Hotel / Element Qingdao"
    );
    expect(result.classification.region).toBe("overseas");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L5");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(420);
    expect(result.effectiveIncluded).toBe(true);
  });

  it("auto-flags TIAD via derived exact alias on the L2 fallback grade", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "TIAD", pointType: "L2", actualPoints: 629 }),
    ]);
    expect(result.classification.confidence).toBe("high");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L5");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(420);
  });

  it("marks L5 Marriott rows as ok_l5", () => {
    const [result] = analyzeTransactions([
      tx({ pointType: "L5", actualPoints: 1049 }),
    ]);
    expect(result.analysisStatus).toBe("ok_l5");
    expect(result.effectiveIncluded).toBe(false);
  });

  it.each(["L4", "L5"])(
    "treats an unmapped %s merchant as Marriott confirmed by the statement grade",
    (pointType) => {
      const [result] = analyzeTransactions([
        tx({
          merchantName: "OPAQUE MERCHANT CO LTD",
          pointType,
          actualPoints: 1049,
        }),
      ]);

      expect(result.classification.isLikelyMarriott).toBe(false);
      expect(result.analysisStatus).toBe("ok_l5");
      expect(result.gradeConfirmedMarriott).toBe(true);
      expect(result.effectiveIncluded).toBe(false);
    }
  );

  it("marks canceled rows as canceled regardless of merchant", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "OPAQUE MERCHANT CO LTD",
        pointType: "L5",
        isCanceled: true,
      }),
    ]);
    expect(result.analysisStatus).toBe("canceled");
    expect(result.gradeConfirmedMarriott).toBeUndefined();
    expect(result.effectiveIncluded).toBe(false);
  });

  it.each(["L1", "L2", "L3"])(
    "keeps an unmapped %s merchant outside the Marriott set",
    (pointType) => {
      const [result] = analyzeTransactions([
        tx({ merchantName: "ZIPPY AUTO WASH - ELLSWO", pointType }),
      ]);
      expect(result.analysisStatus).toBe("not_marriott");
      expect(result.gradeConfirmedMarriott).toBeUndefined();
    }
  );

  it("sends medium-confidence merchants to needs_review, not missing", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "THE PLAZA", pointType: "L1", actualPoints: 210 }),
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

  it("defensively avoids auto-counting impossible overseas grade combinations", () => {
    const [result] = analyzeTransactions([
      tx({ pointType: "L1", actualPoints: 210 }),
    ]);
    expect(result.analysisStatus).toBe("needs_review");
    expect(result.expectedPointType).toBe("L5");
    expect(result.effectiveIncluded).toBe(false);
  });

  it("treats already-L5 Hotel 55 as ok_l5", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "HOTEL 55 CHICAGO", pointType: "L5", actualPoints: 1049 }),
    ]);
    expect(result.analysisStatus).toBe("ok_l5");
  });

  it("auto-flags HOTEL 55 CHICAGO as missing_suspected on L2", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "HOTEL 55 CHICAGO" }),
    ]);
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.effectiveIncluded).toBe(true);
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(420);
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

  it("treats the Daegu Marriott merchant alias as domestic L4", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "비에스떠블유파트너스",
        pointType: "L1",
        actualPoints: 210,
      }),
    ]);
    expect(result.classification.normalizedName).toBe("Daegu Marriott Hotel");
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(839);
  });

  it("treats the Sejong Marriott merchant alias as domestic L4", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "세경호텔",
        pointType: "L1",
        actualPoints: 210,
      }),
    ]);
    expect(result.classification.normalizedName).toBe(
      "Courtyard by Marriott Sejong"
    );
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(839);
  });

  it("treats the Fairfield Busan merchant alias as domestic L4", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "제이엔에스인부산",
        pointType: "L1",
        actualPoints: 210,
      }),
    ]);
    expect(result.classification.normalizedName).toBe(
      "Fairfield by Marriott Busan"
    );
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(839);
  });

  it("treats the Sheraton Grand Incheon merchant alias as domestic L4", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "대우송도호텔",
        pointType: "L1",
        actualPoints: 210,
      }),
    ]);
    expect(result.classification.normalizedName).toBe(
      "Sheraton Grand Incheon Hotel"
    );
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(839);
  });

  it("treats the Four Points Seoul Guro merchant alias as domestic L4", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "와이씨앤티",
        pointType: "L1",
        actualPoints: 210,
      }),
    ]);
    expect(result.classification.normalizedName).toBe(
      "Four Points by Sheraton Seoul, Guro"
    );
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(839);
  });

  it("treats the Courtyard Times Square merchant alias as domestic L4", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "경방",
        pointType: "L1",
        actualPoints: 210,
      }),
    ]);
    expect(result.classification.normalizedName).toBe(
      "Courtyard by Marriott Seoul Times Square"
    );
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(839);
  });

  it("treats the Courtyard Botanic Park merchant alias as domestic L4", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "미래엠",
        pointType: "L1",
        actualPoints: 210,
      }),
    ]);
    expect(result.classification.normalizedName).toBe(
      "Courtyard by Marriott Seoul Botanic Park"
    );
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("missing_suspected");
    expect(result.expectedPointType).toBe("L4");
    expect(result.expectedPoints).toBe(1049);
    expect(result.difference).toBe(839);
  });

  it("defensively avoids auto-counting impossible domestic grade combinations", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "코트야드메리어트서울남대문", pointType: "L2", actualPoints: 629 }),
    ]);
    expect(result.analysisStatus).toBe("needs_review");
    expect(result.expectedPointType).toBe("L4");
    expect(result.effectiveIncluded).toBe(false);
  });

  it("still expects L5 for overseas Marriott merchants", () => {
    const [result] = analyzeTransactions([tx({})]);
    expect(result.expectedPointType).toBe("L5");
    expect(result.analysisStatus).toBe("missing_suspected");
  });

  it("treats L4 on an overseas Marriott merchant as a confirmed special grade", () => {
    const [result] = analyzeTransactions([
      tx({ pointType: "L4", actualPoints: 839 }),
    ]);
    expect(result.analysisStatus).toBe("ok_l5");
    expect(result.gradeConfirmedMarriott).toBe(true);
    expect(result.difference).toBeUndefined();
    expect(result.effectiveIncluded).toBe(false);
  });

  it("keeps an ambiguous domestic property in review with an L4 expectation", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "THE PLAZA", pointType: "L1", actualPoints: 210 }),
    ]);
    expect(result.classification.confidence).toBe("medium");
    expect(result.classification.region).toBe("domestic");
    expect(result.analysisStatus).toBe("needs_review");
    expect(result.expectedPointType).toBe("L4");
    expect(result.difference).toBe(839);
    expect(result.effectiveIncluded).toBe(false);
  });
});

describe("applyFeedback", () => {
  it("includes review rows only after ✅ include", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "THE PLAZA", pointType: "L1", actualPoints: 210 }),
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
      tx({ merchantName: "THE PLAZA", pointType: "L1", actualPoints: 2000 }),
    ]);
    const included = applyFeedback(results, { [results[0].id]: "include" });
    expect(included[0].effectiveIncluded).toBe(false);
  });

  it("removes missing_suspected rows from totals on ❌ exclude", () => {
    const results = analyzeTransactions([tx({})]);
    const excluded = applyFeedback(results, { [results[0].id]: "exclude" });
    expect(excluded[0].effectiveIncluded).toBe(false);
  });

  it("keeps missing_suspected rows included for include or unsure feedback", () => {
    const results = analyzeTransactions([tx({})]);
    expect(
      applyFeedback(results, { [results[0].id]: "include" })[0]
        .effectiveIncluded
    ).toBe(true);
    expect(
      applyFeedback(results, { [results[0].id]: "unsure" })[0]
        .effectiveIncluded
    ).toBe(true);
  });

  it("records exclude or unsure feedback on unmatched rows without including them", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "SAMMAEBONG CO LTD" }),
    ]);
    for (const action of ["exclude", "unsure"] as const) {
      const [updated] = applyFeedback(results, { [results[0].id]: action });
      expect(updated.userFeedback).toBe(action);
      expect(updated.userDesignatedMarriott).toBeUndefined();
      expect(updated.effectiveIncluded).toBe(false);
    }
  });
});

describe("user-designated Marriott (false-negative rescue)", () => {
  const notMarriott = tx({
    merchantName: "SAMMAEBONG CO LTD",
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
    expect(flagged.expectedPointType).toBe("L5");
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

  it("uses L1 -> L4 for user-designated unmatched domestic-looking fallback rows", () => {
    const domesticFallback = tx({
      merchantName: "SAMMAEBONG CO LTD",
      eligibleAmount: 600000,
      pointType: "L1",
      actualPoints: 600,
    });
    const results = analyzeTransactions([domesticFallback]);
    const [flagged] = applyFeedback(results, { [results[0].id]: "include" });
    expect(flagged.expectedPointType).toBe("L4");
    expect(flagged.expectedPoints).toBe(3000);
    expect(flagged.difference).toBe(2400);
    expect(flagged.effectiveIncluded).toBe(true);
  });
});

describe("grade-confirmed alias feedback", () => {
  it.each(["L4", "L5"])(
    "queues an unmapped %s merchant without changing inquiry totals",
    (pointType) => {
      const results = analyzeTransactions([
        tx({
          merchantName: "SAMMAEBONG CO LTD",
          eligibleAmount: 600000,
          pointType,
          actualPoints: 3000,
        }),
      ]);
      const [selected] = applyFeedback(results, {
        [results[0].id]: "include",
      });

      expect(selected.analysisStatus).toBe("ok_l5");
      expect(selected.gradeConfirmedMarriott).toBe(true);
      expect(selected.userFeedback).toBe("include");
      expect(selected.userDesignatedMarriott).toBeUndefined();
      expect(selected.difference).toBeUndefined();
      expect(selected.effectiveIncluded).toBe(false);
    }
  );
});

describe("summarizeResults", () => {
  it("sums expected additional points over included rows only", () => {
    const results = analyzeTransactions([
      tx({ id: "a" }), // missing, diff 420
      tx({
        id: "b",
        merchantName: "THE PLAZA",
        pointType: "L1",
        actualPoints: 210,
      }), // review, not included
      tx({ id: "c", merchantName: "ZIPPY AUTO WASH" }),
    ]);
    const summary = summarizeResults(results);
    expect(summary.totalCount).toBe(3);
    expect(summary.missingSuspectedCount).toBe(1);
    expect(summary.needsReviewCount).toBe(1);
    expect(summary.totalExpectedAdditionalPoints).toBe(1049 - 629);

    const withInclude = summarizeResults(
      applyFeedback(results, { b: "include" })
    );
    expect(withInclude.totalExpectedAdditionalPoints).toBe(
      1049 - 629 + (1049 - 210)
    );
  });

  it("counts every status and included feedback path in a mixed result set", () => {
    const results = analyzeTransactions([
      tx({ id: "missing" }),
      tx({
        id: "review",
        merchantName: "THE PLAZA",
        pointType: "L1",
        actualPoints: 210,
      }),
      tx({ id: "ok", pointType: "L5", actualPoints: 1049 }),
      tx({
        id: "designated",
        merchantName: "SAMMAEBONG CO LTD",
        originalAmount: 600000,
        eligibleAmount: 600000,
        actualPoints: 1800,
      }),
      tx({ id: "canceled", isCanceled: true }),
    ]);
    const withFeedback = applyFeedback(results, {
      review: "include",
      designated: "include",
    });

    expect(summarizeResults(withFeedback)).toEqual({
      totalCount: 5,
      marriottCount: 3,
      okL5Count: 1,
      okAccruedPoints: 1049,
      missingSuspectedCount: 1,
      needsReviewCount: 1,
      canceledCount: 1,
      includedCount: 3,
      totalExpectedAdditionalPoints: 2040 + (1049 - 210) - 420,
    });
  });

  it("sums already-credited points over ok_l5 rows only", () => {
    const results = analyzeTransactions([
      tx({
        id: "ok-overseas",
        merchantName: "OPAQUE MERCHANT CO LTD",
        pointType: "L5",
        actualPoints: 2500,
      }),
      tx({
        id: "ok-domestic",
        merchantName: "웨스틴조선서울",
        pointType: "L4",
        actualPoints: 1000,
      }),
      tx({ id: "missing", pointType: "L2", actualPoints: 629 }), // not ok
      tx({ id: "canceled", isCanceled: true, actualPoints: 9999 }), // excluded
    ]);
    const summary = summarizeResults(results);

    expect(summary.okL5Count).toBe(2);
    expect(summary.marriottCount).toBe(4);
    // Only the two ok_l5 rows contribute; missing/canceled are ignored.
    expect(summary.okAccruedPoints).toBe(3500);
  });

  it("reports zero accrued points when there are no ok_l5 rows", () => {
    const summary = summarizeResults(
      analyzeTransactions([tx({ id: "missing", pointType: "L2" })])
    );
    expect(summary.okL5Count).toBe(0);
    expect(summary.okAccruedPoints).toBe(0);
  });
});
