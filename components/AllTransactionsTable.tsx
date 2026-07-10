"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/badges";

interface AllTransactionsTableProps {
  results: AnalysisResult[];
  onFlagMarriott: (row: AnalysisResult) => void;
}

interface MarriottFlagButtonProps {
  row: AnalysisResult;
  onFlagMarriott: (row: AnalysisResult) => void;
  fullWidth?: boolean;
}

function isManuallyFlaggable(row: AnalysisResult) {
  return (
    row.analysisStatus === "not_marriott" ||
    row.userDesignatedMarriott === true
  );
}

function MarriottFlagButton({
  row,
  onFlagMarriott,
  fullWidth = false,
}: MarriottFlagButtonProps) {
  const flagged = row.userDesignatedMarriott === true;
  const className =
    (fullWidth ? "inline-flex w-full justify-center" : "inline-flex") +
    " items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
    (flagged
      ? "border-blue-400 bg-blue-50 text-blue-700"
      : "border-neutral-300 text-neutral-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700");

  return (
    <button
      type="button"
      onClick={() => onFlagMarriott(row)}
      aria-pressed={flagged}
      aria-label={
        row.merchantName +
        (flagged ? " 거래의 메리어트 표시 해제" : " 거래를 메리어트로 표시")
      }
      className={className}
    >
      {flagged ? "메리어트로 표시됨" : "메리어트로 표시"}
    </button>
  );
}

function AllTransactionCard({
  row,
  onFlagMarriott,
}: Omit<AllTransactionsTableProps, "results"> & { row: AnalysisResult }) {
  const flaggable = isManuallyFlaggable(row);
  const flagged = row.userDesignatedMarriott === true;
  const difference = row.difference ?? 0;

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-sm font-semibold text-neutral-900">
          {row.merchantName}
        </h3>
        <span className="shrink-0">
          <StatusBadge status={row.analysisStatus} />
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
          <dt className="text-xs text-neutral-500">적립 등급</dt>
          <dd className="mt-1 tabular-nums text-neutral-800">
            {row.pointType || "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">실제 포인트</dt>
          <dd className="mt-1 tabular-nums text-neutral-800">
            {formatNumber(row.actualPoints)}P
          </dd>
        </div>
        {flagged && (
          <div className="col-span-2">
            <dt className="text-xs text-neutral-500">문의 문구 반영</dt>
            <dd className="mt-1 font-medium tabular-nums text-blue-700">
              {difference > 0
                ? "예상 +" + formatNumber(difference) + "P 반영됨"
                : "메리어트로 표시됨"}
            </dd>
          </div>
        )}
      </dl>

      {flaggable && (
        <div className="mt-3">
          <MarriottFlagButton
            row={row}
            onFlagMarriott={onFlagMarriott}
            fullWidth
          />
        </div>
      )}
    </article>
  );
}

export default function AllTransactionsTable({
  results,
  onFlagMarriott,
}: AllTransactionsTableProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        aria-expanded={expanded}
        aria-controls="all-transactions-content"
      >
        <span
          className={
            expanded
              ? "inline-block rotate-90 transition-transform"
              : "inline-block transition-transform"
          }
          aria-hidden
        >
          ▶
        </span>
        전체 거래 {formatNumber(results.length)}건 {expanded ? "접기" : "펼치기"}
      </button>

      {expanded && (
        <div id="all-transactions-content">
          <div className="space-y-3 lg:hidden">
            {results.map((row) => (
              <AllTransactionCard
                key={row.id}
                row={row}
                onFlagMarriott={onFlagMarriott}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm lg:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-3 font-medium">거래일</th>
                  <th className="px-4 py-3 font-medium">가맹점명</th>
                  <th className="px-4 py-3 text-right font-medium">금액</th>
                  <th className="px-4 py-3 font-medium">등급</th>
                  <th className="px-4 py-3 text-right font-medium">
                    적립 포인트
                  </th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">메리어트 표시</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => {
                  const flaggable = isManuallyFlaggable(row);
                  const flagged = row.userDesignatedMarriott === true;

                  return (
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
                        {flagged && (row.difference ?? 0) > 0 && (
                          <p className="text-xs font-medium text-blue-700">
                            예상 +{formatNumber(row.difference ?? 0)}P 반영됨
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
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={row.analysisStatus} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {flaggable ? (
                          <MarriottFlagButton
                            row={row}
                            onFlagMarriott={onFlagMarriott}
                          />
                        ) : (
                          <span className="text-xs text-neutral-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
