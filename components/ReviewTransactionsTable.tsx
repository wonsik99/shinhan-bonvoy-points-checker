"use client";

import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";
import { ConfidenceBadge } from "@/components/badges";

interface ReviewTransactionsTableProps {
  rows: AnalysisResult[];
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
}

interface ReviewFeedbackButtonsProps {
  row: AnalysisResult;
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
  mobile?: boolean;
}

const FEEDBACK_BUTTONS: {
  action: UserFeedbackAction;
  label: string;
  activeClass: string;
}[] = [
  {
    action: "include",
    label: "문의에 포함",
    activeClass: "border-emerald-400 bg-emerald-50 text-emerald-700",
  },
  {
    action: "exclude",
    label: "문의에서 제외",
    activeClass: "border-red-400 bg-red-50 text-red-700",
  },
  {
    action: "unsure",
    label: "모르겠음",
    activeClass: "border-neutral-400 bg-neutral-100 text-neutral-700",
  },
];

function ReviewFeedbackButtons({
  row,
  onFeedback,
  mobile = false,
}: ReviewFeedbackButtonsProps) {
  return (
    <div
      role="group"
      aria-label={row.merchantName + " 거래 문의 반영"}
      className={mobile ? "grid grid-cols-3 gap-2" : "flex gap-1.5"}
    >
      {FEEDBACK_BUTTONS.map(({ action, label, activeClass }) => {
        const active = row.userFeedback === action;
        const className =
          "rounded-lg border text-xs font-medium transition " +
          (mobile
            ? "min-h-10 min-w-0 whitespace-normal px-2 py-2 leading-tight "
            : "whitespace-nowrap px-2.5 py-1.5 ") +
          (active
            ? activeClass
            : "border-neutral-300 text-neutral-600 hover:bg-neutral-100");

        return (
          <button
            key={action}
            type="button"
            onClick={() => onFeedback(row, action)}
            aria-pressed={active}
            className={className}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ReviewTransactionCard({
  row,
  onFeedback,
}: Omit<ReviewTransactionsTableProps, "rows"> & { row: AnalysisResult }) {
  const difference = row.difference ?? 0;

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-neutral-900">
            {row.merchantName}
          </h3>
          {row.classification.normalizedName && (
            <p className="mt-1 break-words text-xs text-neutral-500">
              {row.classification.normalizedName}
            </p>
          )}
        </div>
        <span className="shrink-0">
          <ConfidenceBadge confidence={row.classification.confidence} />
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-neutral-100 py-3 text-sm">
        <div>
          <dt className="text-xs text-neutral-500">거래일</dt>
          <dd className="mt-1 tabular-nums text-neutral-800">
            {row.transactionDate ?? "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">결제 금액</dt>
          <dd className="mt-1 tabular-nums text-neutral-800">
            {formatKrw(row.originalAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">실제 적립</dt>
          <dd className="mt-1 tabular-nums text-neutral-800">
            {row.pointType || "-"} / {formatNumber(row.actualPoints)}P
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">포함 시 예상 차이</dt>
          <dd className="mt-1 font-semibold tabular-nums text-amber-700">
            {difference > 0 ? "+" + formatNumber(difference) + "P" : "-"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 break-words text-xs leading-relaxed text-neutral-500">
        <span className="font-medium text-neutral-700">판별 근거: </span>
        {row.classification.reason}
      </p>
      <div className="mt-3">
        <ReviewFeedbackButtons row={row} onFeedback={onFeedback} mobile />
      </div>
    </article>
  );
}

export default function ReviewTransactionsTable({
  rows,
  onFeedback,
}: ReviewTransactionsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-500">
        추가로 확인이 필요한 거래가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        아래 항목은 Marriott 계열일 수 있지만 자동으로 확정하기 어렵습니다.
        메리어트 호텔 결제임을 알고 있으면 &lsquo;문의에 포함&rsquo;을 눌러 예상
        누락 포인트에 반영하세요.
      </p>

      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <ReviewTransactionCard
            key={row.id}
            row={row}
            onFeedback={onFeedback}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm lg:block">
        <table className="w-full min-w-[960px] text-sm">
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
              <th className="px-4 py-3 font-medium">문의 반영</th>
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
                    ? "+" + formatNumber(row.difference ?? 0) + "P"
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBadge confidence={row.classification.confidence} />
                </td>
                <td className="max-w-56 px-4 py-3 text-xs text-neutral-500">
                  {row.classification.reason}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <ReviewFeedbackButtons row={row} onFeedback={onFeedback} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
