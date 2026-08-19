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
import { formatNumber } from "@/lib/format";
import {
  buildAutomaticAliasFeedback,
  isAutomaticAliasFeedbackCandidate,
  isFeedbackPersistenceEnabled,
  submitJudgments,
} from "@/lib/feedback";
import type { GuidedStep } from "@/components/GuidedProgress";

const initialSession = {
  currentStep: 1 as GuidedStep,
  baseResults: [] as AnalysisResult[],
  feedbackById: {} as Record<string, UserFeedbackAction>,
  fileName: null as string | null,
  isParsing: false,
  error: null as string | null,
  errorDiagnostic: null as string | null,
  columnWarning: null as string | null,
  copied: false,
  sendState: "idle" as "idle" | "sending" | "sent" | "failed",
  sentSnapshot: null as string | null,
};

function scrollToTop(smooth: boolean) {
  window.requestAnimationFrame(() =>
    window.scrollTo(smooth ? { top: 0, behavior: "smooth" } : { top: 0 })
  );
}

export function useAnalysisSession() {
  const [session, setSession] = useState(initialSession);
  const collectionEnabled = isFeedbackPersistenceEnabled();

  const results = useMemo(
    () => applyFeedback(session.baseResults, session.feedbackById),
    [session.baseResults, session.feedbackById]
  );
  const summary = useMemo(() => summarizeResults(results), [results]);
  const missingRows = useMemo(
    () => results.filter((row) => row.analysisStatus === "missing_suspected"),
    [results]
  );
  const reviewRows = useMemo(
    () => results.filter((row) => row.analysisStatus === "needs_review"),
    [results]
  );
  const okRows = useMemo(
    () => results.filter((row) => row.analysisStatus === "ok_l5"),
    [results]
  );
  const inquiryMessage = useMemo(
    () => buildInquiryMessage(results.filter((row) => row.effectiveIncluded)),
    [results]
  );

  const hasResults = session.baseResults.length > 0;
  const pendingReviewCount = reviewRows.filter((row) => !row.userFeedback).length;
  const judgmentSnapshot = Object.keys(session.feedbackById)
    .sort()
    .map((id) => `${id}:${session.feedbackById[id]}`)
    .join("|");
  const judgmentCount = Object.keys(session.feedbackById).length;
  const automaticAliasFeedbackCount = results.filter(
    (result) =>
      isAutomaticAliasFeedbackCandidate(result) &&
      result.userFeedback === "include"
  ).length;
  const alreadySent =
    session.sendState === "sent" && session.sentSnapshot === judgmentSnapshot;
  const nextDisabled =
    (session.currentStep === 1 && !hasResults) ||
    (session.currentStep === 3 && !inquiryMessage);
  const nextLabel =
    session.currentStep === 1
      ? hasResults
        ? "결과 보기"
        : "파일을 올리면 계속돼요"
      : session.currentStep === 2
        ? "문의 문구 만들기"
        : session.copied
          ? "문구 다시 복사"
          : "문구 복사";
  const footerStatus =
    session.currentStep === 1
      ? "1544-7000에서 파일을 받을 수 있어요"
      : `문의 반영 ${formatNumber(summary.includedCount)}건 · +${formatNumber(summary.totalExpectedAdditionalPoints)}P${
          pendingReviewCount > 0 ? ` · 미판정 ${pendingReviewCount}건` : ""
        }`;

  const moveToStep = (step: GuidedStep) => {
    if (step > 1 && !hasResults) return;
    setSession((current) => ({ ...current, currentStep: step }));
    scrollToTop(true);
  };

  const handleFile = async (file: File) => {
    setSession((current) => ({
      ...current,
      isParsing: true,
      error: null,
      errorDiagnostic: null,
      copied: false,
    }));
    try {
      const { transactions, columnWarning } = await parseShinhanExcel(file);
      const baseResults = analyzeTransactions(transactions);
      setSession((current) => ({
        ...current,
        isParsing: false,
        baseResults,
        feedbackById: collectionEnabled
          ? buildAutomaticAliasFeedback(baseResults)
          : {},
        fileName: file.name,
        columnWarning: columnWarning ?? null,
        sendState: "idle",
        sentSnapshot: null,
        currentStep: 2,
        error: null,
        errorDiagnostic: null,
      }));
      scrollToTop(false);
    } catch (caught) {
      setSession((current) => ({
        ...current,
        isParsing: false,
        baseResults: [],
        feedbackById: {},
        fileName: null,
        columnWarning: null,
        currentStep: 1,
        error:
          caught instanceof Error
            ? caught.message
            : "알 수 없는 오류가 발생했습니다.",
        errorDiagnostic:
          caught instanceof ShinhanParseError ? caught.diagnostic : null,
      }));
    }
  };

  const handleReset = () => {
    setSession(initialSession);
    scrollToTop(false);
  };

  const handleFeedback = (row: AnalysisResult, action: UserFeedbackAction) => {
    setSession((current) => {
      const feedbackById = { ...current.feedbackById };
      if (feedbackById[row.id] === action) delete feedbackById[row.id];
      else feedbackById[row.id] = action;
      return { ...current, copied: false, feedbackById };
    });
  };

  const handleSubmitJudgments = async () => {
    if (judgmentCount === 0 || session.sendState === "sending") return;
    const items = results
      .filter((result) => session.feedbackById[result.id])
      .map((result) => ({
        result,
        action: session.feedbackById[result.id],
      }));
    const snapshot = judgmentSnapshot;
    setSession((current) => ({ ...current, sendState: "sending" }));
    const ok = await submitJudgments(items);
    setSession((current) =>
      ok
        ? { ...current, sendState: "sent", sentSnapshot: snapshot }
        : { ...current, sendState: "failed" }
    );
  };

  const copyInquiryMessage = async () => {
    if (!inquiryMessage) return;
    try {
      await navigator.clipboard.writeText(inquiryMessage);
      setSession((current) => ({ ...current, copied: true }));
    } catch {
      // The message remains visible for manual selection.
    }
  };

  const goNext = () => {
    if (session.currentStep === 1 && hasResults) moveToStep(2);
    else if (session.currentStep === 2) moveToStep(3);
    else if (session.currentStep === 3) void copyInquiryMessage();
  };

  return {
    ...session,
    results,
    summary,
    missingRows,
    reviewRows,
    okRows,
    inquiryMessage,
    hasResults,
    collectionEnabled,
    pendingReviewCount,
    judgmentCount,
    automaticAliasFeedbackCount,
    alreadySent,
    nextDisabled,
    nextLabel,
    footerStatus,
    moveToStep,
    handleFile,
    handleReset,
    handleFeedback,
    handleSubmitJudgments,
    copyInquiryMessage,
    goNext,
  };
}
