"use client";

import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";

interface MissingTransactionsTableProps {
  rows: AnalysisResult[];
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
}

function MissingFeedbackButton({
  row,
  onFeedback,
}: {
  row: AnalysisResult;
  onFeedback: MissingTransactionsTableProps["onFeedback"];
}) {
  const excluded = row.userFeedback === "exclude";

  return (
    <button
      type="button"
      onClick={() => onFeedback(row, "exclude")}
      aria-pressed={excluded}
      aria-label={
        row.merchantName +
        (excluded ? " 거래를 문의에 다시 포함" : " 거래를 문의에서 제외")
      }
      className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-3.5 text-xs font-medium transition ${
        excluded
          ? "border-ember bg-canvas text-ember"
          : "border-line bg-white text-ink-soft hover:border-ember hover:text-ember"
      }`}
    >
      {excluded ? "다시 포함" : "제외"}
    </button>
  );
}

export default function MissingTransactionsTable({
  rows,
  onFeedback,
}: MissingTransactionsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[18px] border border-hairline bg-white px-5 py-6 text-sm text-muted">
        특별적립 누락이 의심되는 거래가 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-white">
      <div className="flex flex-wrap items-center gap-2 px-5 py-3.5">
        <span className="rounded-full bg-ember px-3 py-1.5 text-xs font-semibold text-white">
          누락 의심 {formatNumber(rows.length)}건
        </span>
        <span className="text-xs text-muted">
          기본으로 문의에 포함돼요
        </span>
      </div>

      <div className="divide-y divide-hairline">
        {rows.map((row) => {
          const excluded = row.userFeedback === "exclude";

          return (
            <article
              key={row.id}
              className={`px-5 py-3 transition-opacity ${
                excluded ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {row.merchantName}
                </h3>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-ember">
                  +{formatNumber(row.difference ?? 0)}P
                </p>
                <MissingFeedbackButton row={row} onFeedback={onFeedback} />
              </div>
              <p className="mt-0.5 break-words text-xs leading-5 tabular-nums text-muted">
                {row.transactionDate ?? "-"} · {formatKrw(row.originalAmount)} · 실제 {row.pointType || "-"} → 예상 {row.expectedPointType ?? "-"}
              </p>
              <details className="mt-1 text-xs text-muted">
                <summary className="min-h-9 cursor-pointer py-2 font-medium text-ink-soft">
                  판별 근거 보기
                </summary>
                <p className="pb-1 leading-5">{row.classification.reason}</p>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
