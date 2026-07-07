"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";
import { parseShinhanExcel, ShinhanParseError } from "@/lib/parseShinhanExcel";
import {
  analyzeTransactions,
  applyFeedback,
  summarizeResults,
} from "@/lib/analyzeTransactions";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { isFeedbackPersistenceEnabled, submitJudgments } from "@/lib/feedback";
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
  const [errorDiagnostic, setErrorDiagnostic] = useState<string | null>(null);
  const [columnWarning, setColumnWarning] = useState<string | null>(null);
  const [sendState, setSendState] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");
  const [sentSnapshot, setSentSnapshot] = useState<string | null>(null);

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
  const collectionEnabled = isFeedbackPersistenceEnabled();

  // Stable fingerprint of the user's judgments so we can tell whether the
  // current set has already been sent (and re-enable the button if it changes).
  const judgmentSnapshot = useMemo(
    () =>
      Object.keys(feedbackById)
        .sort()
        .map((id) => `${id}:${feedbackById[id]}`)
        .join("|"),
    [feedbackById]
  );
  const judgmentCount = Object.keys(feedbackById).length;
  const alreadySent = sendState === "sent" && sentSnapshot === judgmentSnapshot;

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    setErrorDiagnostic(null);
    try {
      const { transactions, columnWarning: warning } =
        await parseShinhanExcel(file);
      setBaseResults(analyzeTransactions(transactions));
      setFeedbackById({});
      setFileName(file.name);
      setColumnWarning(warning ?? null);
      setSendState("idle");
      setSentSnapshot(null);
    } catch (e) {
      setBaseResults([]);
      setFeedbackById({});
      setFileName(null);
      setColumnWarning(null);
      setError(
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다."
      );
      setErrorDiagnostic(e instanceof ShinhanParseError ? e.diagnostic : null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setBaseResults([]);
    setFeedbackById({});
    setFileName(null);
    setError(null);
    setErrorDiagnostic(null);
    setColumnWarning(null);
    setSendState("idle");
    setSentSnapshot(null);
  };

  // Feedback buttons only update local state (totals + inquiry message).
  // Nothing is sent to the collector until the user presses the explicit
  // "help others" button below, so indecisive clicking never leaves a trail.
  const handleFeedback = (row: AnalysisResult, action: UserFeedbackAction) => {
    setFeedbackById((prev) => {
      const next = { ...prev };
      if (next[row.id] === action) {
        delete next[row.id];
      } else {
        next[row.id] = action;
      }
      return next;
    });
  };

  const handleSubmitJudgments = async () => {
    if (judgmentCount === 0 || sendState === "sending") {
      return;
    }
    const items = results
      .filter((r) => feedbackById[r.id])
      .map((r) => ({ result: r, action: feedbackById[r.id] }));
    setSendState("sending");
    const ok = await submitJudgments(items);
    if (ok) {
      setSentSnapshot(judgmentSnapshot);
      setSendState("sent");
    } else {
      setSendState("failed");
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
        errorDiagnostic={errorDiagnostic}
        onFile={handleFile}
        onReset={handleReset}
      />

      {!hasResults && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
          <p className="font-medium text-neutral-800">
            💡 엑셀 파일은 어디서 받나요?
          </p>
          <p className="mt-1">
            신한카드 고객센터{" "}
            <a href="tel:15447000" className="font-semibold text-blue-700">
              1544-7000
            </a>
            에 전화해서 &ldquo;메리어트 본보이 카드{" "}
            <b>포인트 적립 상세내역</b>을 엑셀 파일로 보내달라&rdquo;고
            요청하면 이메일로 받을 수 있습니다. 앱/홈페이지에서는 제공되지
            않는 자료입니다.
          </p>
        </div>
      )}

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

          <section aria-label="적립 누락 의심 거래">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              🔴 적립 누락 의심{" "}
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

          {collectionEnabled && judgmentCount > 0 && (
            <section aria-label="판단 제보">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                <p className="text-sm text-neutral-700">
                  확인해주신 판단 <b>{judgmentCount}건</b>을 익명으로
                  보내주시면, 애매한 가맹점을 더 정확히 판별하는 데 쓰여 다른
                  사용자에게 도움이 됩니다. 가맹점명과 판정 결과만 전송되고,
                  업로드 파일·금액 상세·카드번호는 전송되지 않습니다.
                </p>
                <button
                  type="button"
                  onClick={handleSubmitJudgments}
                  disabled={sendState === "sending" || alreadySent}
                  className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-80 ${
                    alreadySent
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-700 text-white hover:bg-blue-800"
                  }`}
                >
                  {sendState === "sending"
                    ? "보내는 중…"
                    : alreadySent
                      ? "✓ 도와주셔서 감사합니다"
                      : sendState === "sent"
                        ? `변경사항 다시 보내기 (${judgmentCount}건)`
                        : sendState === "failed"
                          ? `전송 실패 · 다시 시도 (${judgmentCount}건)`
                          : `내 판단으로 서비스 돕기 (${judgmentCount}건)`}
                </button>
                {sendState === "failed" && (
                  <p className="mt-1.5 text-xs text-red-600">
                    전송에 실패했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                )}
              </div>
            </section>
          )}

          <section aria-label="전체 거래">
            <AllTransactionsTable results={results} />
          </section>
        </div>
      )}

      {collectionEnabled && (
        <p className="mt-10 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-500">
          &lsquo;내 판단으로 서비스 돕기&rsquo;나 파싱 실패 제보 버튼을 누를
          때만 가맹점명·판정 결과 등 익명 정보가 전송됩니다. 업로드한 파일, 금액
          상세, 카드번호는 전송되지 않습니다.
        </p>
      )}

      <div className="mt-12">
        <Disclaimer />
      </div>
    </main>
  );
}
