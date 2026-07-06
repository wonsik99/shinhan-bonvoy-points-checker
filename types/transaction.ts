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
  raw: Record<string, unknown>;
}

export interface MerchantClassification {
  isLikelyMarriott: boolean;
  confidence: Confidence;
  status: RuleStatus;
  normalizedName?: string;
  matchedPattern?: string;
  reason: string;
  /**
   * Domestic (Korean-named) Marriott merchants accrue as L4 (특별적립),
   * overseas ones as L5 — the analysis expects a different grade per region.
   */
  region?: "domestic" | "overseas";
}

export interface AnalysisResult extends NormalizedTransaction {
  classification: MerchantClassification;
  analysisStatus: AnalysisStatus;
  expectedPointType?: "L5" | "L4";
  expectedPoints?: number;
  difference?: number;
  userFeedback?: UserFeedbackAction;
  effectiveIncluded: boolean;
}

export interface MerchantRule {
  pattern: string;
  normalizedName: string;
  brandGroup: "marriott" | "marriott_candidate";
  confidence: Confidence;
  status: RuleStatus;
  reason: string;
}
