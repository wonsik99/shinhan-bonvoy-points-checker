"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/badges";

interface AllTransactionsTableProps {
  results: AnalysisResult[];
}

export default function AllTransactionsTable({
  results,
}: AllTransactionsTableProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        aria-expanded={expanded}
      >
        <span
          className={`inline-block transition-transform ${expanded ? "rotate-90" : ""}`}
          aria-hidden
        >
          ▶
        </span>
        전체 거래 {formatNumber(results.length)}건 {expanded ? "접기" : "펼치기"}
      </button>
      {expanded && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
                <th className="px-4 py-3 font-medium">거래일</th>
                <th className="px-4 py-3 font-medium">가맹점명</th>
                <th className="px-4 py-3 text-right font-medium">금액</th>
                <th className="px-4 py-3 font-medium">등급</th>
                <th className="px-4 py-3 text-right font-medium">적립 포인트</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">
                    {row.transactionDate ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {row.merchantName}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
