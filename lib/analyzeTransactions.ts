import type {
  AnalysisResult,
  NormalizedTransaction,
  UserFeedbackAction,
} from "@/types/transaction";
import { classifyMerchant } from "@/lib/classifyMerchant";
import {
  activeCardProfile,
  cardProfileById,
  cardProfileForGrade,
  theBestProfile,
  type CardProfile,
} from "@/rules/cardProfiles";

type ExpectedPointType = NonNullable<AnalysisResult["expectedPointType"]>;

/**
 * Marriott special accrual for one payment: round(amount / 1000 × rate),
 * 5P on 더 베스트 (L4/L5) and 4P on 더 클래식 (C2/C3).
 */
export function expectedMarriottPoints(
  eligibleAmount: number,
  profile: CardProfile = theBestProfile
): number {
  return Math.round((eligibleAmount / 1000) * profile.marriottPointsPer1000);
}

/** Spec-named alias kept for the L5 (overseas) case. */
export function expectedL5Points(eligibleAmount: number): number {
  return expectedMarriottPoints(eligibleAmount);
}

function expectedPointTypeForRegion(
  profile: CardProfile,
  isDomestic: boolean
): ExpectedPointType {
  return (isDomestic
    ? profile.domesticGrade
    : profile.overseasGrade) as ExpectedPointType;
}

function fallbackPointTypeForRegion(
  profile: CardProfile,
  isDomestic: boolean
): string {
  return isDomestic
    ? profile.domesticFallbackGrade
    : profile.overseasFallbackGrade;
}

/**
 * 더 베스트 grades are region-specific (L1/L4 domestic, L2/L5 overseas), so
 * the observed grade gives the region. 더 클래식 uses C1 for both, so the
 * merchant column the name came from decides instead.
 */
function expectedPointTypeForDesignation(
  profile: CardProfile,
  result: AnalysisResult
): ExpectedPointType {
  if (profile.domesticFallbackGrade === profile.overseasFallbackGrade) {
    return expectedPointTypeForRegion(
      profile,
      result.merchantSource === "domestic"
    );
  }
  return expectedPointTypeForRegion(
    profile,
    result.pointType === profile.domesticFallbackGrade ||
      result.pointType === profile.domesticGrade
  );
}

/** Statement grade(s) counted for this payment, e.g. "C1+C4" with a paired top-up. */
export function actualGradeLabel(result: AnalysisResult): string {
  const bonusGrade = cardProfileById(result.cardProfileId)?.bonusGrade;
  return result.bonusPoints !== undefined && bonusGrade
    ? `${result.pointType}+${bonusGrade}`
    : result.pointType;
}

/** Points already credited for this payment, including a paired top-up line. */
export function actualPointsTotal(result: AnalysisResult): number {
  return result.actualPoints + (result.bonusPoints ?? 0);
}

/** Short reason a needs_review row is waiting for the user's judgment. */
export function reviewReasonLabel(result: AnalysisResult): string {
  if (result.unsupportedGrade) return "지원하지 않는 적립 등급이에요";
  if (result.bonusAmountMismatch) return "추가적립 금액이 맞지 않아요";
  const { classification } = result;
  const isConfident =
    classification.isLikelyMarriott &&
    (classification.confidence === "certain" ||
      classification.confidence === "high");
  if (isConfident) {
    return (result.difference ?? 0) > 0
      ? "메리어트 결제지만 적립 등급이 평소와 달라요"
      : "추가로 받을 포인트가 없어 보여요";
  }
  return "메리어트인지 확실하지 않아요";
}

/**
 * Rows whose hotel accrual must never be counted or user-designated: a known
 * points purchase, or a top-up bonus line that belongs to another payment.
 */
export function isHotelAccrualLocked(result: AnalysisResult): boolean {
  return (
    result.classification.hotelAccrualExclusion !== undefined ||
    result.accrualRole === "bonus"
  );
}

interface BonusPairing {
  /** Base row id → paired bonus line. */
  byBaseId: Map<string, NormalizedTransaction>;
  /** Bonus row id → base row id. */
  baseIdByBonusId: Map<string, string>;
  /** Base rows with an unpaired bonus line on the same card, date and merchant. */
  ambiguousBaseIds: Set<string>;
}

function looseBonusKey(tx: NormalizedTransaction): string {
  return [tx.cardNumberMasked ?? "", tx.transactionDate ?? "", tx.merchantName].join("|");
}

function isSameBonusPayment(
  base: NormalizedTransaction,
  bonus: NormalizedTransaction
): boolean {
  if ((base.cardNumberMasked ?? "") !== (bonus.cardNumberMasked ?? "")) {
    return false;
  }
  if (base.slipNumber && bonus.slipNumber) {
    return base.slipNumber === bonus.slipNumber;
  }
  return (
    looseBonusKey(base) === looseBonusKey(bonus) &&
    base.eligibleAmount === bonus.eligibleAmount
  );
}

/**
 * Pairs each 더 클래식 C4 top-up line with the C1 payment it belongs to, one
 * to one: by 매출전표번호 when both rows carry it, otherwise by card, date,
 * merchant and eligible amount. Canceled rows never pair.
 */
function pairBonusLines(transactions: NormalizedTransaction[]): BonusPairing {
  const pairing: BonusPairing = {
    byBaseId: new Map(),
    baseIdByBonusId: new Map(),
    ambiguousBaseIds: new Set(),
  };
  const bases: NormalizedTransaction[] = [];
  const bonuses: NormalizedTransaction[] = [];
  for (const tx of transactions) {
    const profile = cardProfileForGrade(tx.pointType);
    if (tx.isCanceled || !profile?.bonusGrade) continue;
    if (tx.pointType === profile.bonusGrade) bonuses.push(tx);
    else if (
      tx.pointType === profile.domesticFallbackGrade ||
      tx.pointType === profile.overseasFallbackGrade
    ) {
      bases.push(tx);
    }
  }

  const unpairedBonuses: NormalizedTransaction[] = [];
  for (const bonus of bonuses) {
    const base = bases.find(
      (candidate) =>
        !pairing.byBaseId.has(candidate.id) && isSameBonusPayment(candidate, bonus)
    );
    if (base) {
      pairing.byBaseId.set(base.id, bonus);
      pairing.baseIdByBonusId.set(bonus.id, base.id);
    } else {
      unpairedBonuses.push(bonus);
    }
  }

  for (const bonus of unpairedBonuses) {
    for (const base of bases) {
      if (
        !pairing.byBaseId.has(base.id) &&
        looseBonusKey(base) === looseBonusKey(bonus)
      ) {
        pairing.ambiguousBaseIds.add(base.id);
      }
    }
  }
  return pairing;
}

/**
 * Deterministic per-transaction analysis. Feedback is applied separately via
 * applyFeedback so re-running analysis never loses user input.
 */
export function analyzeTransactions(
  transactions: NormalizedTransaction[]
): AnalysisResult[] {
  const pairing = pairBonusLines(transactions);

  return transactions.map((tx): AnalysisResult => {
    const classification = classifyMerchant(tx.merchantName, tx.transactionDate);
    const profile = cardProfileForGrade(tx.pointType);
    const pairedBonus = pairing.byBaseId.get(tx.id);
    const bonusBaseRowId = pairing.baseIdByBonusId.get(tx.id);
    const rowBase = {
      ...tx,
      classification,
      cardProfileId: profile?.id,
      ...(pairedBonus
        ? { bonusPoints: pairedBonus.actualPoints, bonusRowId: pairedBonus.id }
        : {}),
    };

    if (tx.isCanceled) {
      return {
        ...rowBase,
        analysisStatus: "canceled" as const,
        effectiveIncluded: false,
      };
    }

    const isMarriottish =
      classification.isLikelyMarriott ||
      classification.status === "needs_review";

    // A grade code no supported card defines has no known accrual rate, so
    // its expected points are never estimated or counted.
    if (!profile) {
      if (classification.hotelAccrualExclusion || !isMarriottish) {
        return {
          ...rowBase,
          analysisStatus: "not_marriott" as const,
          effectiveIncluded: false,
          unsupportedGrade: true,
        };
      }
      return {
        ...rowBase,
        classification: {
          ...classification,
          reason: `${classification.reason} 명세서 등급 ${tx.pointType}은 지원하지 않는 카드 등급이라 예상 적립을 계산하지 않습니다.`,
        },
        analysisStatus: "needs_review" as const,
        effectiveIncluded: false,
        unsupportedGrade: true,
      };
    }

    // For the row's card profile, the statement's Marriott special-accrual
    // grades are stronger transaction evidence than merchant-name matching.
    // Keep the raw classification intact so an unmapped merchant can still be
    // identified as an alias candidate without misrepresenting a DB match.
    const gradeConfirmedMarriott =
      tx.pointType === profile.domesticGrade ||
      tx.pointType === profile.overseasGrade;
    if (gradeConfirmedMarriott) {
      return {
        ...rowBase,
        analysisStatus: "ok_l5" as const,
        effectiveIncluded: false,
        gradeConfirmedMarriott: true,
      };
    }

    // A top-up line (C4) is counted with its base payment, never on its own.
    if (profile.bonusGrade && tx.pointType === profile.bonusGrade) {
      return {
        ...rowBase,
        analysisStatus: "not_marriott" as const,
        effectiveIncluded: false,
        accrualRole: "bonus" as const,
        ...(bonusBaseRowId ? { bonusBaseRowId } : {}),
      };
    }

    if (classification.hotelAccrualExclusion || !isMarriottish) {
      return {
        ...rowBase,
        analysisStatus: "not_marriott" as const,
        effectiveIncluded: false,
      };
    }

    // 더 클래식 uses C1 in both regions, so an unknown region falls back to
    // the merchant column; 더 베스트 keeps treating it as overseas.
    const region =
      classification.region ??
      (profile.domesticFallbackGrade === profile.overseasFallbackGrade
        ? tx.merchantSource
        : undefined);
    const isDomestic = region === "domestic";

    const expectedPointType = expectedPointTypeForRegion(profile, isDomestic);
    const fallbackPointType = fallbackPointTypeForRegion(profile, isDomestic);
    const expectedPoints = expectedMarriottPoints(tx.eligibleAmount, profile);
    const difference =
      expectedPoints - tx.actualPoints - (pairedBonus?.actualPoints ?? 0);
    const ambiguousBonus = pairing.ambiguousBaseIds.has(tx.id);
    const reasonNotes = [
      isDomestic || profile !== theBestProfile
        ? `${profile === theBestProfile ? "" : `${profile.shortLabel} `}${isDomestic ? "국내" : "해외"} Marriott 결제는 ${expectedPointType}(1,000원당 ${profile.marriottPointsPer1000}P) 적립이 정상입니다.`
        : "",
      ambiguousBonus
        ? `같은 날짜·가맹점의 ${profile.bonusGrade} 추가적립 행과 금액이 달라 함께 계산하지 못했습니다.`
        : "",
    ].filter(Boolean);
    const base = {
      ...rowBase,
      classification:
        reasonNotes.length > 0
          ? {
              ...classification,
              reason: [classification.reason, ...reasonNotes].join(" "),
            }
          : classification,
      expectedPointType,
      expectedPoints,
      difference,
      ...(ambiguousBonus ? { bonusAmountMismatch: true } : {}),
    };

    const isConfident =
      classification.isLikelyMarriott &&
      (classification.confidence === "certain" ||
        classification.confidence === "high");

    // The confirmed missing-accrual patterns fall back to the card's base
    // grade: 더 베스트 domestic L1 -> L4 and overseas L2 -> L5, 더 클래식
    // C1 -> C2/C3. An unpaired top-up line on the same payment leaves the
    // actual points uncertain, so that payment stays in review.
    if (
      isConfident &&
      difference > 0 &&
      tx.pointType === fallbackPointType &&
      !ambiguousBonus
    ) {
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
    // A known points purchase or a top-up bonus line must not be promoted
    // through the unmatched-hotel rescue path, even if stale or programmatic
    // feedback requests inclusion.
    if (isHotelAccrualLocked(result)) {
      return {
        ...result,
        effectiveIncluded: false,
        userFeedback: undefined,
        userDesignatedMarriott: undefined,
        expectedPointType: undefined,
        expectedPoints: undefined,
        difference: undefined,
      };
    }
    const feedback = feedbackById[result.id];
    if (!feedback) {
      return result.userFeedback === undefined
        ? result
        : { ...result, userFeedback: undefined, effectiveIncluded: result.analysisStatus === "missing_suspected" };
    }

    // An unsupported grade has no known accrual rate to estimate from. A
    // Marriott-like row may still join the inquiry as a check request without
    // points; an unmatched one is never designated.
    if (result.unsupportedGrade) {
      return {
        ...result,
        userFeedback: feedback,
        effectiveIncluded:
          result.analysisStatus === "needs_review" && feedback === "include",
      };
    }

    // The user manually marked an unmatched transaction as a Marriott hotel.
    if (result.analysisStatus === "not_marriott") {
      if (feedback !== "include") {
        return { ...result, userFeedback: feedback, effectiveIncluded: false };
      }
      const profile = cardProfileById(result.cardProfileId) ?? activeCardProfile;
      const expectedPoints = expectedMarriottPoints(result.eligibleAmount, profile);
      const difference =
        expectedPoints - result.actualPoints - (result.bonusPoints ?? 0);
      return {
        ...result,
        userFeedback: feedback,
        userDesignatedMarriott: true,
        expectedPointType: expectedPointTypeForDesignation(profile, result),
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
  /** Rows per card profile, chosen from each row's statement grade. */
  cardProfileCounts: Record<CardProfile["id"], number>;
  /** Rows whose grade code no supported card defines. */
  unsupportedGradeCount: number;
}

export function summarizeResults(results: AnalysisResult[]): AnalysisSummary {
  const included = results.filter((r) => r.effectiveIncluded);
  return {
    totalCount: results.length,
    marriottCount: results.filter(
      (r) =>
        r.accrualRole !== "bonus" &&
        (r.classification.isLikelyMarriott || r.gradeConfirmedMarriott)
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
    cardProfileCounts: {
      the_best: results.filter((r) => r.cardProfileId === "the_best").length,
      the_classic: results.filter((r) => r.cardProfileId === "the_classic").length,
    },
    unsupportedGradeCount: results.filter((r) => r.unsupportedGrade).length,
  };
}
