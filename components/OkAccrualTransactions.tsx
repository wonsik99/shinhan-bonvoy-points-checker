"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";

interface OkAccrualTransactionsProps {
  /** Marriott payments that already received the special accrual (ok_l5). */
  rows: AnalysisResult[];
  /** Total points already credited on these rows (summary.okAccruedPoints). */
  earnedPoints: number;
}

/**
 * Collapsed-by-default list of correctly-accrued Marriott payments. It needs
 * no user action — it exists for reassurance and completeness: showing what the
 * card credited correctly makes the missing/review flags more trustworthy and
 * balances the "덜 적립된 것 같아요" headline with the points already earned.
 */
export default function OkAccrualTransactions({
  rows,
  earnedPoints,
}: OkAccrualTransactionsProps) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-hover"
        aria-expanded={expanded}
        aria-controls="ok-accrual-content"
        aria-label={`정상 적립 ${formatNumber(rows.length)}건 ${expanded ? "접기" : "펼치기"}`}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
            />
            <span className="text-sm font-semibold text-ink">
              정상 적립 {formatNumber(rows.length)}건
            </span>
          </span>
          <span className="mt-1 block text-xs leading-5 text-muted">
            이미 +{formatNumber(earnedPoints)}P가 정상 적립됐어요 · 추가 조치
            필요 없음
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-ember">
          {expanded ? "접기" : "보기"}
        </span>
      </button>

      {expanded && (
        <div
          id="ok-accrual-content"
          className="divide-y divide-hairline border-t border-hairline"
        >
          {rows.map((row) => (
            <article
              key={row.id}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-medium text-ink">
                  {row.merchantName}
                </h3>
                <p className="mt-1 break-words text-xs leading-5 tabular-nums text-muted">
                  {row.transactionDate ?? "-"} · {formatKrw(row.originalAmount)} ·{" "}
                  {row.pointType || "-"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">
                +{formatNumber(row.actualPoints)}P
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
