import type {
  AnalysisResult,
  NormalizedTransaction,
  UserFeedbackAction,
} from "@/types/transaction";
import { classifyMerchant } from "@/lib/classifyMerchant";
import { activeCardProfile } from "@/rules/cardProfiles";

/**
 * Marriott special accrual: 1,000원당 5P (더 베스트 기준), applied to both
 * domestic (L4) and overseas (L5) Marriott payments.
 * round(amount / 1000 × 5) — numerically identical to round(amount × 0.005).
 */
export function expectedMarriottPoints(eligibleAmount: number): number {
  return Math.round(
    (eligibleAmount / 1000) * activeCardProfile.marriottPointsPer1000
  );
}

/** Spec-named alias kept for the L5 (overseas) case. */
export function expectedL5Points(eligibleAmount: number): number {
  return expectedMarriottPoints(eligibleAmount);
}

function expectedPointTypeForRegion(isDomestic: boolean): "L4" | "L5" {
  return isDomestic
    ? (activeCardProfile.domesticGrade as "L4")
    : (activeCardProfile.overseasGrade as "L5");
}

function fallbackPointTypeForRegion(isDomestic: boolean): string {
  return isDomestic
    ? activeCardProfile.domesticFallbackGrade
    : activeCardProfile.overseasFallbackGrade;
}

function expectedPointTypeFromObservedGrade(pointType: string): "L4" | "L5" {
  return pointType === activeCardProfile.domesticFallbackGrade ||
    pointType === activeCardProfile.domesticGrade
    ? (activeCardProfile.domesticGrade as "L4")
    : (activeCardProfile.overseasGrade as "L5");
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

    // For the active card profile, the statement's Marriott special-accrual
    // grades are stronger transaction evidence than merchant-name matching.
    // Keep the raw classification intact so an unmapped merchant can still be
    // identified as an alias candidate without misrepresenting a DB match.
    const gradeConfirmedMarriott =
      tx.pointType === activeCardProfile.domesticGrade ||
      tx.pointType === activeCardProfile.overseasGrade;
    if (gradeConfirmedMarriott) {
      return {
        ...tx,
        classification,
        analysisStatus: "ok_l5" as const,
        effectiveIncluded: false,
        gradeConfirmedMarriott: true,
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

    const isDomestic = classification.region === "domestic";

    const expectedPointType = expectedPointTypeForRegion(isDomestic);
    const fallbackPointType = fallbackPointTypeForRegion(isDomestic);
    const expectedPoints = expectedMarriottPoints(tx.eligibleAmount);
    const difference = expectedPoints - tx.actualPoints;
    const base = {
      ...tx,
      classification: isDomestic
        ? {
            ...classification,
            reason: `${classification.reason} 국내 Marriott 결제는 L4(1,000원당 5P) 적립이 정상입니다.`,
          }
        : classification,
      expectedPointType,
      expectedPoints,
      difference,
    };

    const isConfident =
      classification.isLikelyMarriott &&
      (classification.confidence === "certain" ||
        classification.confidence === "high");

    // Shinhan's grade families are region-specific: domestic payments use
    // L1/L4, overseas payments use L2/L5. The confirmed missing-accrual
    // patterns are domestic Marriott L1 -> L4 and overseas Marriott L2 -> L5.
    if (isConfident && difference > 0 && tx.pointType === fallbackPointType) {
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
 * - not_marriott + ✅ include → user-designated Marriott (false-negative rescue):
 *   expected points are computed and it joins the totals + inquiry message.
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

    // The user manually marked an unmatched transaction as a Marriott hotel.
    if (result.analysisStatus === "not_marriott") {
      if (feedback !== "include") {
        return { ...result, userFeedback: feedback, effectiveIncluded: false };
      }
      const expectedPoints = expectedMarriottPoints(result.eligibleAmount);
      const difference = expectedPoints - result.actualPoints;
      return {
        ...result,
        userFeedback: feedback,
        userDesignatedMarriott: true,
        expectedPointType: expectedPointTypeFromObservedGrade(result.pointType),
        expectedPoints,
        difference,
        effectiveIncluded: difference > 0,
      };
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
  /** Points already correctly credited on ok_l5 Marriott payments. */
  okAccruedPoints: number;
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
    marriottCount: results.filter(
      (r) => r.classification.isLikelyMarriott || r.gradeConfirmedMarriott
    ).length,
    okL5Count: results.filter((r) => r.analysisStatus === "ok_l5").length,
    okAccruedPoints: results
      .filter((r) => r.analysisStatus === "ok_l5")
      .reduce((sum, r) => sum + Math.max(0, r.actualPoints), 0),
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
