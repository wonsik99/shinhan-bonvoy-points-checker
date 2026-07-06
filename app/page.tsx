"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { parseShinhanExcel } from "@/lib/parseShinhanExcel";
import {
  analyzeTransactions,
  applyFeedback,
  summarizeResults,
} from "@/lib/analyzeTransactions";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { submitFeedback } from "@/lib/feedback";
import FileUpload from "@/components/FileUpload";
import SummaryCards from "@/components/SummaryCards";
import MissingTransactionsTable from "@/components/MissingTransactionsTable";
import ReviewTransactionsTable from "@/components/ReviewTransactionsTable";
import AllTransactionsTable from "@/components/AllTransactionsTable";
import InquiryMessage from "@/components/InquiryMessage";
import Disclaimer from "@/components/Disclaimer";

export default function Home() {
  const [baseResults, setBaseResults] = useState<AnalysisResult[]>([]);
  const [feedbackById, setFeedbackById] = useState<
    Record<string, UserFeedbackAction>
  >({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnWarning, setColumnWarning] = useState<string | null>(null);

  const results = useMemo(
    () => applyFeedback(baseResults, feedbackById),
    [baseResults, feedbackById]
  );
  const summary = useMemo(() => summarizeResults(results), [results]);
  const missingRows = useMemo(
    () => results.filter((r) => r.analysisStatus === "missing_suspected"),
    [results]
  );
  const reviewRows = useMemo(
    () => results.filter((r) => r.analysisStatus === "needs_review"),
    [results]
  );
  const inquiryMessage = useMemo(
    () => buildInquiryMessage(results.filter((r) => r.effectiveIncluded)),
    [results]
  );

  const hasResults = baseResults.length > 0;

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const { transactions, columnWarning: warning } =
        await parseShinhanExcel(file);
      setBaseResults(analyzeTransactions(transactions));
      setFeedbackById({});
      setFileName(file.name);
      setColumnWarning(warning ?? null);
    } catch (e) {
      setBaseResults([]);
      setFeedbackById({});
      setFileName(null);
      setColumnWarning(null);
      setError(
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setBaseResults([]);
    setFeedbackById({});
    setFileName(null);
    setError(null);
    setColumnWarning(null);
  };

  const handleFeedback = (row: AnalysisResult, action: UserFeedbackAction) => {
    const isRetraction = feedbackById[row.id] === action;
    setFeedbackById((prev) => {
      const next = { ...prev };
      if (next[row.id] === action) {
        delete next[row.id];
      } else {
        next[row.id] = action;
      }
      return next;
    });
    // A second click on the same button retracts local feedback; recording it
    // would count the undo as another affirmative vote in the aggregate.
    if (!isRetraction) {
      submitFeedback(row, action);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🏨
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Bonvoy L5 Checker
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-neutral-600">
          신한카드 포인트 적립 상세내역 엑셀을 업로드하면, 메리어트 계열 호텔
          결제가 L5로 제대로 적립되었는지 확인해드립니다.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
          <span aria-hidden>🔒</span>
          파일은 서버에 저장되지 않고 브라우저 안에서만 분석됩니다.
        </p>
      </header>

      <FileUpload
        fileName={fileName}
        isParsing={isParsing}
        error={error}
        onFile={handleFile}
        onReset={handleReset}
      />

      {columnWarning && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ {columnWarning}
        </div>
      )}

      {hasResults && (
        <div className="mt-10 space-y-10">
          <section aria-label="분석 요약">
            <SummaryCards summary={summary} />
          </section>

          <section aria-label="L5 누락 의심 거래">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              🔴 L5 누락 의심{" "}
              <span className="text-neutral-400">
                {summary.missingSuspectedCount}건
              </span>
            </h2>
            <MissingTransactionsTable
              rows={missingRows}
              onFeedback={handleFeedback}
            />
          </section>

          <section aria-label="확인 필요 거래">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              🟡 확인 필요{" "}
              <span className="text-neutral-400">
                {summary.needsReviewCount}건
              </span>
            </h2>
            <ReviewTransactionsTable
              rows={reviewRows}
              onFeedback={handleFeedback}
            />
          </section>

          <section aria-label="신한카드 문의 문구">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              ✉️ 신한카드 문의 문구
            </h2>
            <InquiryMessage message={inquiryMessage} />
          </section>

          <section aria-label="전체 거래">
            <AllTransactionsTable results={results} />
          </section>
        </div>
      )}

      <div className="mt-12">
        <Disclaimer />
      </div>
    </main>
  );
}
