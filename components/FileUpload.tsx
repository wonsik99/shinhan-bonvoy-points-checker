"use client";

import { useRef, useState } from "react";
import {
  isFeedbackPersistenceEnabled,
  submitParseErrorReport,
} from "@/lib/feedback";

interface FileUploadProps {
  fileName: string | null;
  isParsing: boolean;
  error: string | null;
  /** Privacy-safe report text (headers only, digits masked) for unsupported layouts. */
  errorDiagnostic?: string | null;
  onFile: (file: File) => void;
  onReset: () => void;
}

type ReportState = "idle" | "sending" | "sent" | "failed";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];

export default function FileUpload({
  fileName,
  isParsing,
  error,
  errorDiagnostic,
  onFile,
  onReset,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedDiagnostic, setCopiedDiagnostic] = useState<string | null>(null);
  const [report, setReport] = useState<{
    diagnostic: string | null;
    state: ReportState;
  }>({ diagnostic: null, state: "idle" });

  const diagnosticCopied = copiedDiagnostic === errorDiagnostic;
  const reportState =
    report.diagnostic === errorDiagnostic ? report.state : "idle";
  const canSendReport = isFeedbackPersistenceEnabled();

  const copyDiagnostic = async () => {
    if (!errorDiagnostic) return;
    try {
      await navigator.clipboard.writeText(errorDiagnostic);
      setCopiedDiagnostic(errorDiagnostic);
      setTimeout(
        () =>
          setCopiedDiagnostic((current) =>
            current === errorDiagnostic ? null : current
          ),
        2000
      );
    } catch {
      // Clipboard unavailable — the text remains visible for manual selection.
    }
  };

  const sendReport = async () => {
    if (!errorDiagnostic || reportState === "sending" || reportState === "sent") {
      return;
    }
    setReport({ diagnostic: errorDiagnostic, state: "sending" });
    const ok = await submitParseErrorReport(errorDiagnostic);
    setReport({
      diagnostic: errorDiagnostic,
      state: ok ? "sent" : "failed",
    });
  };

  const handleFile = (file: File | undefined) => {
    setLocalError(null);
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setLocalError("xlsx 또는 xls 형식의 엑셀 파일만 업로드할 수 있습니다.");
      return;
    }
    onFile(file);
  };

  const displayError = localError ?? error;
  const displayDiagnostic = localError ? null : errorDiagnostic;

  if (fileName && !displayError) {
    return (
      <div className="rounded-[18px] border border-hairline bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="break-words font-semibold text-ink">{fileName}</p>
            <p className="mt-1 text-sm text-muted" role="status">
              {isParsing ? "브라우저 안에서 분석 중…" : "분석이 완료되었습니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              onReset();
            }}
            className="min-h-11 rounded-full border border-line px-5 text-sm font-medium text-ink-soft transition hover:border-ember hover:text-ember"
          >
            다른 파일 업로드
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="엑셀 파일 업로드"
        aria-busy={isParsing}
        onClick={() => !isParsing && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!isParsing && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isParsing) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!isParsing) handleFile(event.dataTransfer.files[0]);
        }}
        className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed bg-white px-6 py-10 text-center transition ${
          isDragging || isParsing
            ? "border-ember bg-ember-faint"
            : "border-line-strong hover:border-ember hover:bg-ember-faint"
        }`}
      >
        <p className="text-lg font-semibold text-ink">
          {isParsing
            ? "브라우저 안에서 분석 중…"
            : "여기에 파일을 끌어다 놓으세요"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {isParsing
            ? "파일과 거래 내용은 서버로 전송되지 않습니다."
            : "또는 눌러서 선택 · .xlsx, .xls"}
        </p>
        {isParsing && (
          <div className="mt-5 h-1 w-52 overflow-hidden rounded-full bg-hairline" role="status">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-ember" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          handleFile(file);
        }}
      />

      {displayError && (
        <div role="alert" className="mt-3 rounded-[18px] border border-ember bg-white px-5 py-4 text-sm text-ink-soft">
          <p className="font-semibold text-ember">
            파일을 분석하지 못했습니다.
          </p>
          <p className="mt-1 leading-6">{displayError}</p>
          {displayDiagnostic && (
            <div className="mt-4 border-t border-hairline pt-4">
              <p className="leading-6">
                신한카드 엑셀인데도 실패했다면 파일 형식이 아직 지원되지 않을
                수 있어요. 아래의 <b>개인정보가 제거된 진단 정보</b>만 제보할 수
                있습니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {canSendReport && (
                  <button
                    type="button"
                    onClick={sendReport}
                    disabled={reportState === "sending" || reportState === "sent"}
                    className={`min-h-11 rounded-full px-4 text-xs font-semibold text-white transition disabled:opacity-70 ${
                      reportState === "sent" ? "bg-emerald-700" : "bg-ember"
                    }`}
                  >
                    {reportState === "sent"
                      ? "제보 완료 ✓ 감사합니다!"
                      : reportState === "sending"
                        ? "보내는 중…"
                        : "원클릭 제보 보내기"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyDiagnostic}
                  className="min-h-11 rounded-full border border-line px-4 text-xs font-semibold text-ink-soft"
                >
                  {diagnosticCopied ? "복사됨 ✓" : "진단 정보 복사"}
                </button>
              </div>
              {reportState === "failed" && (
                <p className="mt-2 text-xs text-ember">
                  전송에 실패했습니다. 진단 정보를 복사해서 남겨주세요.
                </p>
              )}
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                {displayDiagnostic}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
