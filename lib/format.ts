import type { AnalysisStatus, Confidence } from "@/types/transaction";

export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString("ko-KR")}P`;
}

export function formatSignedPoints(points: number): string {
  const sign = points > 0 ? "+" : "";
  return `${sign}${points.toLocaleString("ko-KR")}P`;
}

export const confidenceLabels: Record<Confidence, string> = {
  certain: "확실",
  high: "높음",
  medium: "중간",
  low: "낮음",
  none: "해당 없음",
};

export const statusLabels: Record<AnalysisStatus, string> = {
  ok_l5: "정상 적립",
  missing_suspected: "적립 누락 의심",
  needs_review: "확인 필요",
  not_marriott: "일반 거래",
  canceled: "취소 거래",
};

/**
 * Masks a card number, keeping only the last 4 digits visible.
 * Non-digit separators are dropped; short values are fully masked.
 */
export function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return "****";
  }
  return `****-****-****-${digits.slice(-4)}`;
}
