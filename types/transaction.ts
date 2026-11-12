export type Confidence = "certain" | "high" | "medium" | "low" | "none";

export type AnalysisStatus =
  | "ok_l5"
  | "missing_suspected"
  | "needs_review"
  | "not_marriott"
  | "canceled";

export type UserFeedbackAction = "include" | "exclude" | "unsure";

export type RuleStatus = "active" | "needs_review" | "rejected";

export interface NormalizedTransaction {
  id: string;
  rowIndex: number;
  transactionDate?: string;
  postingDate?: string;
  merchantName: string;
  originalAmount: number;
  eligibleAmount: number;
  pointType: string;
  actualPoints: number;
  isCanceled: boolean;
  aggregationDate?: string;
  cardNumberMasked?: string;
  /** 매출전표번호, used only to pair a payment's base and bonus accrual lines. */
  slipNumber?: string;
  /** Whether the merchant name came from the overseas-merchant column. */
  merchantSource?: "domestic" | "overseas";
  raw: Record<string, unknown>;
}

export interface MerchantClassification {
  isLikelyMarriott: boolean;
  confidence: Confidence;
  status: RuleStatus;
  normalizedName?: string;
  matchedPattern?: string;
  reason: string;
  /** A reviewed non-hotel purchase, excluded from hotel accrual calculations. */
  hotelAccrualExclusion?: "points_purchase";
  /**
   * Domestic (Korean-named) Marriott merchants accrue as L4 (특별적립),
   * overseas ones as L5 — the analysis expects a different grade per region.
   */
  region?: "domestic" | "overseas";
}

export interface AnalysisResult extends NormalizedTransaction {
  classification: MerchantClassification;
  analysisStatus: AnalysisStatus;
  expectedPointType?: "L5" | "L4" | "C2" | "C3";
  expectedPoints?: number;
  difference?: number;
  userFeedback?: UserFeedbackAction;
  effectiveIncluded: boolean;
  /**
   * True when the statement itself carries this card profile's Marriott
   * special-accrual grade (currently L4 or L5). This is transaction evidence,
   * independent of whether the merchant-name rule database recognized it.
   */
  gradeConfirmedMarriott?: boolean;
  /**
   * True when the user manually flagged an otherwise-unmatched (not_marriott)
   * transaction as a Marriott property — the false-negative rescue path.
   */
  userDesignatedMarriott?: boolean;
  /** Card profile chosen from the row's statement grade. */
  cardProfileId?: "the_best" | "the_classic";
  /** The statement grade is a code no supported card profile defines. */
  unsupportedGrade?: boolean;
  /**
   * "bonus" marks a separate top-up accrual line (더 클래식 C4) that belongs
   * to a base-accrual payment and is never a hotel payment of its own.
   */
  accrualRole?: "bonus";
  /** Points from the paired bonus line, counted with this payment's points. */
  bonusPoints?: number;
  /** Row id of the paired bonus line (on the base row). */
  bonusRowId?: string;
  /** Row id of the base payment this bonus line tops up (on the bonus row). */
  bonusBaseRowId?: string;
  /**
   * A same-day bonus line for this payment has a different amount, so the
   * payment's credited points are uncertain and it stays in review.
   */
  bonusAmountMismatch?: boolean;
}

export interface MerchantRule {
  pattern: string;
  normalizedName: string;
  brandGroup: "marriott" | "marriott_candidate";
  confidence: Confidence;
  status: RuleStatus;
  reason: string;
}
