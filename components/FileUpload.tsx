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
    if (!file) {
      return;
    }
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
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg">
              📄
            </span>
            <div>
              <p className="font-medium text-neutral-900">{fileName}</p>
              <p className="text-sm text-neutral-500">
                {isParsing ? "분석 중…" : "분석이 완료되었습니다."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = "";
              }
              onReset();
            }}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
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
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-300 bg-white hover:border-blue-400 hover:bg-blue-50/40"
        }`}
      >
        <span className="text-3xl" aria-hidden>
          📊
        </span>
        <div>
          <p className="font-medium text-neutral-900">
            신한카드 포인트 적립 상세내역 엑셀 파일을 여기에 끌어다 놓으세요
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            또는 클릭해서 파일 선택 (.xlsx, .xls)
          </p>
        </div>
        {isParsing && (
          <p className="text-sm font-medium text-blue-600">분석 중…</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear so selecting the same file again (e.g. retry after a parse
          // error) still fires a change event.
          e.target.value = "";
          handleFile(file);
        }}
      />
      {displayError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">파일을 분석하지 못했습니다.</p>
          <p className="mt-0.5">{displayError}</p>
          {displayDiagnostic && (
            <div className="mt-3 border-t border-red-200 pt-3 text-red-800">
              <p>
                신한카드 엑셀인데도 실패했다면 파일 형식이 저희가 모르는
                변형일 수 있어요. 아래의 <b>개인정보가 제거된 진단 정보</b>
                (컬럼명만, 숫자 마스킹)를 제보해주시면 빠르게 지원을
                추가하겠습니다. 보내지는 내용은 아래에 표시된 것이 전부입니다.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {canSendReport && (
                  <button
                    type="button"
                    onClick={sendReport}
                    disabled={reportState === "sending" || reportState === "sent"}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                      reportState === "sent"
                        ? "bg-emerald-600"
                        : "bg-red-700 hover:bg-red-800"
                    }`}
                  >
                    {reportState === "sent"
                      ? "제보 완료 ✓ 감사합니다!"
                      : reportState === "sending"
                        ? "보내는 중…"
                        : "📨 원클릭 제보 보내기"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyDiagnostic}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    canSendReport
                      ? "border border-red-300 text-red-700 hover:bg-red-100"
                      : "bg-red-700 text-white hover:bg-red-800"
                  }`}
                >
                  {diagnosticCopied ? "복사됨 ✓" : "진단 정보 복사"}
                </button>
              </div>
              {reportState === "failed" && (
                <p className="mt-1.5 text-xs">
                  전송에 실패했습니다. 위의 복사 버튼으로 내용을 복사해서
                  글/댓글로 남겨주세요.
                </p>
              )}
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/60 p-2 font-mono text-[11px] leading-relaxed text-red-900">
                {displayDiagnostic}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
