import type { AnalysisResult } from "@/types/transaction";
import { formatNumber } from "@/lib/format";

/**
 * Builds the copyable Shinhan inquiry message from the currently included
 * rows (missing_suspected plus user-included review rows).
 */
export function buildInquiryMessage(includedRows: AnalysisResult[]): string {
  if (includedRows.length === 0) {
    return "";
  }

  const lines = includedRows.map((row) => {
    const date = row.transactionDate ?? row.postingDate ?? "날짜 미상";
    const amount = `${formatNumber(row.originalAmount)}원`;
    const actual = row.pointType || "등급 미상";
    const expected = row.expectedPointType ?? "L5";
    const diff = `${formatNumber(Math.max(0, row.difference ?? 0))}P`;
    return `- ${date} / ${row.merchantName} / ${amount} / 실제 ${actual} → ${expected} 예상 / 차이 ${diff}`;
  });

  const totalDifference = includedRows.reduce(
    (sum, row) => sum + Math.max(0, row.difference ?? 0),
    0
  );

  return [
    "안녕하세요. 신한 메리어트 본보이 카드 포인트 적립 관련 문의드립니다.",
    "",
    "포인트 적립 상세내역을 확인해보니, 메리어트 계열 호텔 결제 건으로 보이는 일부 거래가 정상 특별적립 등급(해외 L5, 국내 L4)이 아닌 등급으로 적립된 것으로 확인됩니다.",
    "",
    "아래 거래들이 특별적립 대상인지 재확인 부탁드립니다.",
    "",
    ...lines,
    "",
    `현재 내역 기준으로는 총 ${formatNumber(totalDifference)}포인트가 덜 적립된 것으로 보입니다.`,
    "",
    "해당 거래들의 적립 등급과 포인트 재산정 가능 여부 확인 부탁드립니다.",
  ].join("\n");
}
