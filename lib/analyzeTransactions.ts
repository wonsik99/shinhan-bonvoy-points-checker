import type {
  AnalysisResult,
  NormalizedTransaction,
  UserFeedbackAction,
} from "@/types/transaction";
import { classifyMerchant } from "@/lib/classifyMerchant";

/** Observed Shinhan Bonvoy accrual rate for L5 (0.5%). */
export const L5_RATE = 0.005;

export function expectedL5Points(eligibleAmount: number): number {
  return Math.round(eligibleAmount * L5_RATE);
}

/**
 * Deterministic per-transaction analysis. Feedback is applied separately via
 * applyFeedback so re-running analysis never loses user input.
 */
export function analyzeTransactions(
  transactions: NormalizedTransaction[]
): AnalysisResult[] {
  return transactions.map((tx) => {
    const classification = classifyMerchant(tx.merchantName);

    if (tx.isCanceled) {
      return {
        ...tx,
        classification,
        analysisStatus: "canceled" as const,
        effectiveIncluded: false,
      };
    }

    const isMarriottish =
      classification.isLikelyMarriott ||
      classification.status === "needs_review";

    if (!isMarriottish) {
      return {
        ...tx,
        classification,
        analysisStatus: "not_marriott" as const,
        effectiveIncluded: false,
      };
    }

    if (tx.pointType === "L5") {
      return {
        ...tx,
        classification,
        analysisStatus: "ok_l5" as const,
        effectiveIncluded: false,
      };
    }

    const expectedPoints = expectedL5Points(tx.eligibleAmount);
    const difference = expectedPoints - tx.actualPoints;
    const base = {
      ...tx,
      classification,
      expectedPointType: "L5" as const,
      expectedPoints,
      difference,
    };

    const isConfident =
      classification.isLikelyMarriott &&
      (classification.confidence === "certain" ||
        classification.confidence === "high");

    // Confident Marriott, non-L5, positive gap → suspected missing accrual.
    // Everything else Marriott-ish (medium/low confidence, or no positive gap)
    // goes to the review bucket rather than being asserted as missing.
    if (isConfident && difference > 0) {
      return {
        ...base,
        analysisStatus: "missing_suspected" as const,
        effectiveIncluded: true,
      };
    }

    return {
      ...base,
      analysisStatus: "needs_review" as const,
      effectiveIncluded: false,
    };
  });
}

/**
 * Applies user feedback to analysis results.
 * - needs_review + ✅ include (with positive difference) → counted in totals
 * - missing_suspected + ❌ exclude → removed from totals
 * Feedback never promotes a merchant to a global rule; it only affects this session.
 */
export function applyFeedback(
  results: AnalysisResult[],
  feedbackById: Record<string, UserFeedbackAction>
): AnalysisResult[] {
  return results.map((result) => {
    const feedback = feedbackById[result.id];
    if (!feedback) {
      return result.userFeedback === undefined
        ? result
        : { ...result, userFeedback: undefined, effectiveIncluded: result.analysisStatus === "missing_suspected" };
    }

    let effectiveIncluded = result.effectiveIncluded;
    if (result.analysisStatus === "needs_review") {
      effectiveIncluded = feedback === "include" && (result.difference ?? 0) > 0;
    } else if (result.analysisStatus === "missing_suspected") {
      effectiveIncluded = feedback !== "exclude";
    }

    return { ...result, userFeedback: feedback, effectiveIncluded };
  });
}

export interface AnalysisSummary {
  totalCount: number;
  marriottCount: number;
  okL5Count: number;
  missingSuspectedCount: number;
  needsReviewCount: number;
  canceledCount: number;
  includedCount: number;
  totalExpectedAdditionalPoints: number;
}

export function summarizeResults(results: AnalysisResult[]): AnalysisSummary {
  const included = results.filter((r) => r.effectiveIncluded);
  return {
    totalCount: results.length,
    marriottCount: results.filter((r) => r.classification.isLikelyMarriott)
      .length,
    okL5Count: results.filter((r) => r.analysisStatus === "ok_l5").length,
    missingSuspectedCount: results.filter(
      (r) => r.analysisStatus === "missing_suspected"
    ).length,
    needsReviewCount: results.filter(
      (r) => r.analysisStatus === "needs_review"
    ).length,
    canceledCount: results.filter((r) => r.analysisStatus === "canceled")
      .length,
    includedCount: included.length,
    totalExpectedAdditionalPoints: included.reduce(
      (sum, r) => sum + Math.max(0, r.difference ?? 0),
      0
    ),
  };
}
