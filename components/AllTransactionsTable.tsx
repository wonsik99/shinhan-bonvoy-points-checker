"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/badges";

interface AllTransactionsTableProps {
  results: AnalysisResult[];
  onFlagMarriott: (row: AnalysisResult) => void;
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
}: {
  row: AnalysisResult;
  onFlagMarriott: AllTransactionsTableProps["onFlagMarriott"];
}) {
  const flagged = row.userDesignatedMarriott === true;

  return (
    <button
      type="button"
      onClick={() => onFlagMarriott(row)}
      aria-pressed={flagged}
      aria-label={
        row.merchantName +
        (flagged ? " 거래의 메리어트 표시 해제" : " 거래를 메리어트로 표시")
      }
      className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-4 text-xs font-medium transition ${
        flagged
          ? "border-ember bg-ember text-white"
          : "border-ember bg-white text-ember hover:bg-ember-soft"
      }`}
    >
      {flagged ? "메리어트로 표시됨" : "메리어트로 표시"}
    </button>
  );
}

export default function AllTransactionsTable({
  results,
  onFlagMarriott,
}: AllTransactionsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const candidates = results.filter(
    (row) => row.analysisStatus === "not_marriott"
  );

  if (candidates.length === 0) {
    return (
      <div className="rounded-[18px] border border-hairline bg-white px-5 py-4">
        <p className="text-sm font-semibold text-ink">
          여기 없는 호텔 결제가 있나요?
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          추가로 확인할 미분류 거래가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-hover"
        aria-expanded={expanded}
        aria-controls="all-transactions-content"
        aria-label={`미분류 거래 ${formatNumber(candidates.length)}건 ${expanded ? "접기" : "펼치기"}`}
      >
        <span>
          <span className="block text-sm font-semibold text-ink">
            여기 없는 호텔 결제가 있나요?
          </span>
          <span className="mt-1 block text-xs leading-5 text-muted">
            앱이 메리어트로 분류하지 못한 거래 {formatNumber(candidates.length)}건만
            확인해보세요
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-ember">
          {expanded ? "접기" : "찾아보기"}
        </span>
      </button>

      {expanded && (
        <div id="all-transactions-content" className="divide-y divide-hairline border-t border-hairline">
          {candidates.map((row) => {
            const flaggable = isManuallyFlaggable(row);
            const flagged = row.userDesignatedMarriott === true;
            const difference = row.difference ?? 0;

            return (
              <article key={row.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-medium text-ink">
                        {row.merchantName}
                      </h3>
                      <StatusBadge status={row.analysisStatus} />
                    </div>
                    <p className="mt-1 break-words text-xs leading-5 tabular-nums text-muted">
                      {row.transactionDate ?? "-"} · {formatKrw(row.originalAmount)} · {row.pointType || "-"} {formatNumber(row.actualPoints)}P
                    </p>
                    {flagged && difference > 0 && (
                      <p className="mt-1 text-xs font-semibold tabular-nums text-ember">
                        문의에 예상 +{formatNumber(difference)}P 반영됨
                      </p>
                    )}
                  </div>
                  {flaggable && (
                    <MarriottFlagButton
                      row={row}
                      onFlagMarriott={onFlagMarriott}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
