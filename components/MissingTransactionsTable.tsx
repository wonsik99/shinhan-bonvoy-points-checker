"use client";

import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";
import { ConfidenceBadge } from "@/components/badges";

interface MissingTransactionsTableProps {
  rows: AnalysisResult[];
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
}

interface MissingFeedbackButtonProps {
  row: AnalysisResult;
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
  fullWidth?: boolean;
}

function MissingFeedbackButton({
  row,
  onFeedback,
  fullWidth = false,
}: MissingFeedbackButtonProps) {
  const excluded = row.userFeedback === "exclude";
  const className =
    (fullWidth ? "inline-flex w-full justify-center" : "inline-flex") +
    " items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
    (excluded
      ? "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
      : "border-neutral-300 text-neutral-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700");

  return (
    <button
      type="button"
      onClick={() => onFeedback(row, excluded ? "include" : "exclude")}
      aria-label={
        row.merchantName +
        (excluded ? " 거래를 문의에 다시 포함" : " 거래를 문의에서 제외")
      }
      className={className}
    >
      {excluded ? "문의에 다시 포함" : "문의에서 제외"}
    </button>
  );
}

function MissingTransactionCard({
  row,
  onFeedback,
}: Omit<MissingTransactionsTableProps, "rows"> & { row: AnalysisResult }) {
  const excluded = row.userFeedback === "exclude";
  const cardClassName = excluded
    ? "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm opacity-60"
    : "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm";

  return (
    <article className={cardClassName}>
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
          <dt className="text-xs text-neutral-500">정상 예상</dt>
          <dd className="mt-1 tabular-nums text-neutral-800">
            {row.expectedPointType ?? "-"} /{" "}
            {formatNumber(row.expectedPoints ?? 0)}P
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-neutral-500">예상 차이</dt>
          <dd className="mt-1 font-semibold tabular-nums text-red-700">
            +{formatNumber(row.difference ?? 0)}P
          </dd>
        </div>
      </dl>

      <p className="mt-3 break-words text-xs leading-relaxed text-neutral-500">
        <span className="font-medium text-neutral-700">판별 근거: </span>
        {row.classification.reason}
      </p>
      <div className="mt-3">
        <MissingFeedbackButton
          row={row}
          onFeedback={onFeedback}
          fullWidth
        />
      </div>
    </article>
  );
}

export default function MissingTransactionsTable({
  rows,
  onFeedback,
}: MissingTransactionsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-500">
        특별적립 누락이 의심되는 거래가 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <MissingTransactionCard
            key={row.id}
            row={row}
            onFeedback={onFeedback}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm lg:block">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
              <th className="px-4 py-3 font-medium">거래일</th>
              <th className="px-4 py-3 font-medium">가맹점명</th>
              <th className="px-4 py-3 text-right font-medium">금액</th>
              <th className="px-4 py-3 font-medium">실제 등급</th>
              <th className="px-4 py-3 text-right font-medium">실제 포인트</th>
              <th className="px-4 py-3 text-right font-medium">정상 예상</th>
              <th className="px-4 py-3 text-right font-medium">차이</th>
              <th className="px-4 py-3 font-medium">신뢰도</th>
              <th className="px-4 py-3 font-medium">이유</th>
              <th className="px-4 py-3 font-medium">문의 반영</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const excluded = row.userFeedback === "exclude";
              const rowClassName = excluded
                ? "border-b border-neutral-100 opacity-50 last:border-b-0"
                : "border-b border-neutral-100 last:border-b-0";

              return (
                <tr key={row.id} className={rowClassName}>
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
                    <span className="ml-1 text-xs text-neutral-400">
                      ({row.expectedPointType ?? "-"})
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-red-700">
                    +{formatNumber(row.difference ?? 0)}P
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBadge
                      confidence={row.classification.confidence}
                    />
                  </td>
                  <td className="max-w-56 px-4 py-3 text-xs text-neutral-500">
                    {row.classification.reason}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MissingFeedbackButton
                      row={row}
                      onFeedback={onFeedback}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
