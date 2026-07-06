"use client";

import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";
import { ConfidenceBadge } from "@/components/badges";

interface ReviewTransactionsTableProps {
  rows: AnalysisResult[];
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
}

const FEEDBACK_BUTTONS: {
  action: UserFeedbackAction;
  label: string;
  activeClass: string;
}[] = [
  {
    action: "include",
    label: "✅ 포함",
    activeClass: "border-emerald-400 bg-emerald-50 text-emerald-700",
  },
  {
    action: "exclude",
    label: "❌ 제외",
    activeClass: "border-red-400 bg-red-50 text-red-700",
  },
  {
    action: "unsure",
    label: "모르겠음",
    activeClass: "border-neutral-400 bg-neutral-100 text-neutral-700",
  },
];

export default function ReviewTransactionsTable({
  rows,
  onFeedback,
}: ReviewTransactionsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-500">
        추가로 확인이 필요한 거래가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        아래 항목은 Marriott 계열일 수 있지만 자동으로 확정하기 어렵습니다. 알고
        있는 호텔이면 포함 버튼을 눌러 예상 누락 포인트에 반영할 수 있습니다.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
              <th className="px-4 py-3 font-medium">거래일</th>
              <th className="px-4 py-3 font-medium">가맹점명</th>
              <th className="px-4 py-3 text-right font-medium">금액</th>
              <th className="px-4 py-3 font-medium">실제 등급</th>
              <th className="px-4 py-3 text-right font-medium">
                포함 시 예상 차이
              </th>
              <th className="px-4 py-3 font-medium">신뢰도</th>
              <th className="px-4 py-3 font-medium">이유</th>
              <th className="px-4 py-3 font-medium">판단</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-neutral-100 last:border-b-0"
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
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-amber-700">
                  {(row.difference ?? 0) > 0
                    ? `+${formatNumber(row.difference ?? 0)}P`
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBadge confidence={row.classification.confidence} />
                </td>
                <td className="max-w-56 px-4 py-3 text-xs text-neutral-500">
                  {row.classification.reason}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex gap-1.5">
                    {FEEDBACK_BUTTONS.map(({ action, label, activeClass }) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => onFeedback(row, action)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                          row.userFeedback === action
                            ? activeClass
                            : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
