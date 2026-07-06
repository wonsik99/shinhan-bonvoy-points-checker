import type { AnalysisSummary } from "@/lib/analyzeTransactions";
import { formatNumber } from "@/lib/format";

interface SummaryCardsProps {
  summary: AnalysisSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: "전체 거래", value: `${formatNumber(summary.totalCount)}건` },
    {
      label: "Marriott 계열 추정",
      value: `${formatNumber(summary.marriottCount)}건`,
    },
    {
      label: "정상 L5",
      value: `${formatNumber(summary.okL5Count)}건`,
      tone: "text-emerald-700",
    },
    {
      label: "L5 누락 의심",
      value: `${formatNumber(summary.missingSuspectedCount)}건`,
      tone: "text-red-700",
    },
    {
      label: "확인 필요",
      value: `${formatNumber(summary.needsReviewCount)}건`,
      tone: "text-amber-700",
    },
    {
      label: "예상 추가 포인트",
      value: `${formatNumber(summary.totalExpectedAdditionalPoints)}P`,
      tone: "text-blue-700",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 shadow-sm ${
            card.highlight
              ? "border-blue-200 bg-blue-50"
              : "border-neutral-200 bg-white"
          }`}
        >
          <p className="text-xs font-medium text-neutral-500">{card.label}</p>
          <p
            className={`mt-1.5 text-xl font-bold tabular-nums tracking-tight ${
              card.tone ?? "text-neutral-900"
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
