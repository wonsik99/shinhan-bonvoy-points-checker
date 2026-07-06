"use client";

import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";
import { ConfidenceBadge } from "@/components/badges";

interface MissingTransactionsTableProps {
  rows: AnalysisResult[];
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
}

export default function MissingTransactionsTable({
  rows,
  onFeedback,
}: MissingTransactionsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-500">
        L5 누락이 의심되는 거래가 없습니다. 🎉
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
            <th className="px-4 py-3 font-medium">거래일</th>
            <th className="px-4 py-3 font-medium">가맹점명</th>
            <th className="px-4 py-3 text-right font-medium">금액</th>
            <th className="px-4 py-3 font-medium">실제 등급</th>
            <th className="px-4 py-3 text-right font-medium">실제 포인트</th>
            <th className="px-4 py-3 text-right font-medium">L5 예상</th>
            <th className="px-4 py-3 text-right font-medium">차이</th>
            <th className="px-4 py-3 font-medium">신뢰도</th>
            <th className="px-4 py-3 font-medium">이유</th>
            <th className="px-4 py-3 font-medium">피드백</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const excluded = row.userFeedback === "exclude";
            return (
              <tr
                key={row.id}
                className={`border-b border-neutral-100 last:border-b-0 ${
                  excluded ? "opacity-50" : ""
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">
                  {row.transactionDate ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">
                    {row.merchantName}
                  </p>
                  {row.classification.normalizedName && (
                    <p className="text-xs text-neutral-500">
                      {row.classification.normalizedName}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {formatKrw(row.originalAmount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.pointType || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {formatNumber(row.actualPoints)}P
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {formatNumber(row.expectedPoints ?? 0)}P
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-red-700">
                  +{formatNumber(row.difference ?? 0)}P
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBadge confidence={row.classification.confidence} />
                </td>
                <td className="max-w-56 px-4 py-3 text-xs text-neutral-500">
                  {row.classification.reason}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {excluded ? (
                    <button
                      type="button"
                      onClick={() => onFeedback(row, "include")}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
                    >
                      다시 포함
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onFeedback(row, "exclude")}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      ❌ 제외
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
