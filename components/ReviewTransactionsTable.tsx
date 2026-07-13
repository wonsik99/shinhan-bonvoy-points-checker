"use client";

import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { formatKrw, formatNumber } from "@/lib/format";

interface ReviewTransactionsTableProps {
  rows: AnalysisResult[];
  onFeedback: (row: AnalysisResult, action: UserFeedbackAction) => void;
}

const FEEDBACK_BUTTONS: {
  action: UserFeedbackAction;
  label: string;
}[] = [
  { action: "include", label: "문의에 포함" },
  { action: "exclude", label: "문의에서 제외" },
  { action: "unsure", label: "모르겠음" },
];

function ReviewFeedbackButtons({
  row,
  onFeedback,
}: {
  row: AnalysisResult;
  onFeedback: ReviewTransactionsTableProps["onFeedback"];
}) {
  return (
    <div
      role="group"
      aria-label={row.merchantName + " 거래 문의 반영"}
      className="mt-4 grid grid-cols-3 gap-2"
    >
      {FEEDBACK_BUTTONS.map(({ action, label }) => {
        const active = row.userFeedback === action;

        return (
          <button
            key={action}
            type="button"
            onClick={() => onFeedback(row, action)}
            aria-pressed={active}
            className={`min-h-11 min-w-0 rounded-full border px-2 py-2 text-xs font-medium leading-tight transition sm:text-sm ${
              active
                ? "border-ember bg-ember text-white"
                : "border-line bg-white text-ink-soft hover:border-ember hover:text-ember"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewTransactionsTable({
  rows,
  onFeedback,
}: ReviewTransactionsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[18px] border border-hairline bg-white px-5 py-6 text-sm text-muted">
        추가로 확인이 필요한 거래가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const difference = row.difference ?? 0;

        return (
          <article
            key={row.id}
            className="rounded-[18px] border border-ink bg-white p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-ink px-3 py-1.5 text-xs font-semibold text-ink">
                확인 필요
              </span>
              <span className="text-xs text-muted">
                메리어트인지 확실하지 않아요
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-ink">
                  {row.merchantName}
                </h3>
                <p className="mt-1 break-words text-xs leading-5 tabular-nums text-muted">
                  {row.transactionDate ?? "-"} · {formatKrw(row.originalAmount)} · 실제 {row.pointType || "-"} {formatNumber(row.actualPoints)}P
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                포함 시 {difference > 0 ? `+${formatNumber(difference)}P` : "변동 없음"}
              </p>
            </div>

            <p className="mt-3 rounded-lg bg-canvas px-3 py-2.5 text-xs leading-5 text-ink-soft">
              <span className="font-semibold">판별 근거 — </span>
              {row.classification.reason}
            </p>

            <ReviewFeedbackButtons row={row} onFeedback={onFeedback} />
          </article>
        );
      })}
    </div>
  );
}
