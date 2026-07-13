import type { AnalysisSummary } from "@/lib/analyzeTransactions";
import { formatNumber } from "@/lib/format";

interface SummaryCardsProps {
  summary: AnalysisSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">
        분석 결과
      </p>
      <div className="mt-1" aria-live="polite">
        <div>
          <p className="text-xs font-medium text-muted">
            예상 추가 포인트
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-[42px] sm:leading-[1.12]">
            <span className="tabular-nums text-ember">
              {formatNumber(summary.totalExpectedAdditionalPoints)}P
            </span>
            가
            <br />덜 적립된 것 같아요
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-ink-soft sm:text-base">
          메리어트 계열로 보이는 결제 {formatNumber(summary.marriottCount)}건
          중 {formatNumber(summary.missingSuspectedCount)}건은 누락이 의심되고, {" "}
          {formatNumber(summary.needsReviewCount)}건은 직접 확인이 필요해요.
        </p>
      </div>

      {/* 행동이 필요한 두 수치는 독립 카드, 참고 수치 셋은 구분선 스트립. */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-ember/35 bg-ember-soft px-4 py-3">
          <p className="text-xs text-ember-deep">적립 누락 의심</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ember">
            {formatNumber(summary.missingSuspectedCount)}건
          </p>
        </div>
        <div className="rounded-xl border border-ink/35 bg-white px-4 py-3">
          <p className="text-xs text-muted">확인 필요</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {formatNumber(summary.needsReviewCount)}건
          </p>
        </div>
        <div className="col-span-2 grid grid-cols-3 divide-x divide-hairline rounded-xl border border-hairline bg-white py-3">
          <div className="min-w-0 px-4">
            <p className="truncate text-xs text-muted">전체 거래</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink-soft">
              {formatNumber(summary.totalCount)}건
            </p>
          </div>
          <div className="min-w-0 px-4">
            <p className="truncate text-xs text-muted">Marriott 추정</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink-soft">
              {formatNumber(summary.marriottCount)}건
            </p>
          </div>
          <div className="min-w-0 px-4">
            <p className="truncate text-xs text-muted">정상 적립</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink-soft">
              {formatNumber(summary.okL5Count)}건
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
