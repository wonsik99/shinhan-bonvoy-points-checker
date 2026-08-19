"use client";

import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import FileUpload from "@/components/FileUpload";
import FileSessionBar from "@/components/FileSessionBar";
import SummaryCards from "@/components/SummaryCards";
import MissingTransactionsTable from "@/components/MissingTransactionsTable";
import OkAccrualTransactions from "@/components/OkAccrualTransactions";
import ReviewTransactionsTable from "@/components/ReviewTransactionsTable";
import AllTransactionsTable from "@/components/AllTransactionsTable";
import InquiryMessage from "@/components/InquiryMessage";
import InquirySend from "@/components/InquirySend";
import Disclaimer from "@/components/Disclaimer";
import {
  GuidedProgress,
  MobileProgress,
  type GuidedStep,
} from "@/components/GuidedProgress";
import { formatNumber } from "@/lib/format";

export default function Home() {
  const {
    currentStep,
    fileName,
    isParsing,
    error,
    errorDiagnostic,
    columnWarning,
    copied,
    sendState,
    results,
    summary,
    missingRows,
    reviewRows,
    okRows,
    inquiryMessage,
    hasResults,
    collectionEnabled,
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
  } = useAnalysisSession();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1060px] items-center gap-3 px-5 sm:px-8">
          <span className="text-[17px] font-semibold tracking-[-0.03em]">
            bonvoy checker
          </span>
          <span className="hidden text-xs text-muted sm:inline">
            신한 메리어트 특별적립 검사
          </span>
        </div>
        <MobileProgress currentStep={currentStep} />
      </header>

      <div className="mx-auto flex w-full max-w-[1060px] flex-1 items-start gap-11 px-5 pb-10 pt-7 sm:px-8 md:pt-9">
        <GuidedProgress
          currentStep={currentStep}
          hasResults={hasResults}
          onStepChange={moveToStep}
        />

        <main className="min-w-0 flex-1 md:max-w-[720px]">
          {currentStep === 1 && (
            <section aria-labelledby="upload-step-title">
              <h1
                id="upload-step-title"
                className="text-[30px] leading-[1.2] font-semibold tracking-[-0.04em] sm:text-[36px]"
              >
                엑셀 파일 하나면
                <br />시작할 수 있어요
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-ink-soft sm:text-base">
                신한카드 ‘포인트 적립 상세내역’을 올리면 메리어트 결제의
                특별적립 누락 의심 항목을 확인해드립니다.
              </p>
              <p className="mt-3 rounded-lg bg-ember-soft px-3 py-2 text-xs leading-5 text-ember-deep">
                현재는 메리어트 본보이™ 더 베스트 신한카드만 지원합니다. 더
                클래식 카드는 적립 기준이 달라 결과가 맞지 않을 수 있어요.
              </p>

              <div className="mt-6">
                <FileUpload
                  fileName={fileName}
                  isParsing={isParsing}
                  error={error}
                  errorDiagnostic={errorDiagnostic}
                  onFile={handleFile}
                  onReset={handleReset}
                />
              </div>

              <details open className="mt-4 overflow-hidden rounded-[18px] border border-hairline bg-white">
                <summary className="flex min-h-14 cursor-pointer items-center px-5 py-4 text-sm font-semibold text-ink">
                  엑셀 파일은 어디서 받나요?
                </summary>
                <div className="border-t border-hairline px-5 py-4 text-sm leading-6 text-ink-soft">
                  <ol className="list-decimal space-y-1.5 pl-5">
                    <li>
                      신한카드 고객센터 {" "}
                      <a href="tel:15447000" className="font-semibold text-ember">
                        1544-7000
                      </a>
                      에 전화합니다.
                    </li>
                    <li>
                      “메리어트 본보이 카드 <b>포인트 적립 상세내역</b>을
                      엑셀로 보내주세요”라고 요청합니다.
                    </li>
                    <li>이메일로 받은 .xlsx 파일을 여기에 올립니다.</li>
                  </ol>
                  <p className="mt-2 text-xs text-muted">
                    앱과 홈페이지에서는 제공되지 않는 자료입니다.
                  </p>
                </div>
              </details>
            </section>
          )}

          {currentStep === 2 && hasResults && (
            <div className="space-y-7">
              <FileSessionBar fileName={fileName} onReset={handleReset} />

              <section aria-label="분석 요약">
                <SummaryCards summary={summary} />
              </section>

              {columnWarning && (
                <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  {columnWarning}
                </div>
              )}

              <section aria-label="확인 필요 거래">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-ink">
                    먼저 직접 확인해주세요
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    확인 필요 거래는 사용자가 선택한 경우에만 문의에 반영됩니다.
                  </p>
                </div>
                <ReviewTransactionsTable
                  rows={reviewRows}
                  onFeedback={handleFeedback}
                />
              </section>

              <section aria-label="적립 누락 의심 거래">
                <MissingTransactionsTable
                  rows={missingRows}
                  onFeedback={handleFeedback}
                />
              </section>

              <section aria-label="정상 적립 거래">
                <OkAccrualTransactions
                  rows={okRows}
                  earnedPoints={summary.okAccruedPoints}
                  collectionEnabled={collectionEnabled}
                  onToggleAliasFeedback={(row) => handleFeedback(row, "include")}
                />
              </section>

              <section aria-label="전체 거래">
                <AllTransactionsTable
                  results={results}
                  onFlagMarriott={(row) => handleFeedback(row, "include")}
                />
              </section>

              {collectionEnabled && judgmentCount > 0 && !alreadySent && (
                <p
                  role="note"
                  className="rounded-xl border border-hairline bg-white px-4 py-3 text-xs leading-5 text-muted"
                >
                  서비스 개선 제보 목록 {judgmentCount}건 · 마지막 단계에서
                  직접 보내기 전까지 전송되지 않아요
                </p>
              )}
            </div>
          )}

          {currentStep === 3 && hasResults && (
            <div>
              <FileSessionBar fileName={fileName} onReset={handleReset} />
              <section aria-label="신한카드 문의 문구" className="mt-3">
                <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                  문의 보내기
                </p>
                <h1 className="mt-1 text-[30px] leading-[1.2] font-semibold tracking-[-0.04em] sm:text-[36px]">
                  {!inquiryMessage ? (
                    "문의에 담을 항목이 없어요"
                  ) : copied ? (
                    <>
                      복사 완료.
                      <br />이제 붙여넣기만 하면 돼요
                    </>
                  ) : (
                    "문구가 준비됐어요"
                  )}
                </h1>
                <p className="mt-3 mb-5 text-[15px] leading-6 text-ink-soft sm:text-base">
                  {inquiryMessage ? (
                    <>
                      {formatNumber(summary.includedCount)}건 · 예상 +
                      {formatNumber(summary.totalExpectedAdditionalPoints)}P가
                      문구에 담겼어요. 실제 적립 여부는 카드사 기준에 따라
                      달라질 수 있습니다.
                    </>
                  ) : (
                    "2단계에서 누락 의심 거래를 유지하거나 확인 필요 거래를 문의에 포함하면 문구가 만들어집니다."
                  )}
                </p>
                <InquiryMessage
                  message={inquiryMessage}
                  copied={copied}
                  onCopy={copyInquiryMessage}
                />
              </section>

              {collectionEnabled && judgmentCount > 0 && (
                <section aria-label="판단 제보" className="mt-4">
                  <div className="rounded-[18px] border border-ember/40 bg-white p-5">
                    <p className="text-xs font-semibold tracking-[0.08em] text-ember uppercase">
                      서비스 돕기
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                      {automaticAliasFeedbackCount > 0 ? (
                        <>
                          DB 미등록 L4/L5 가맹점명 {" "}
                          <b>{automaticAliasFeedbackCount}건</b>은 제보 목록에
                          자동으로 포함됐습니다. {" "}
                        </>
                      ) : null}
                      제보 목록의 총 <b>{judgmentCount}건</b>을 익명으로
                      보내주시면 가맹점 판별 개선에 도움이 됩니다. 아래 버튼을
                      누르기 전에는 아무것도 전송되지 않습니다.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      가맹점명·적립 등급·앱 판정·사용자 판단·임시 익명 ID만
                      전송되고, 업로드 파일·금액 상세·카드번호는 전송되지
                      않습니다.
                    </p>
                    <button
                      type="button"
                      onClick={handleSubmitJudgments}
                      disabled={sendState === "sending" || alreadySent}
                      className={`mt-4 min-h-11 rounded-full px-5 text-sm font-semibold text-white transition disabled:opacity-75 ${
                        alreadySent ? "bg-emerald-700" : "bg-ember"
                      }`}
                    >
                      {sendState === "sending"
                        ? "보내는 중…"
                        : alreadySent
                          ? "도와주셔서 감사합니다"
                          : sendState === "sent"
                            ? `변경사항 다시 보내기 (${judgmentCount}건)`
                          : sendState === "failed"
                              ? `전송 실패 · 다시 시도 (${judgmentCount}건)`
                              : `서비스 개선 정보 보내기 (${judgmentCount}건)`}
                    </button>
                    {sendState === "failed" && (
                      <p className="mt-2 text-xs text-ember">
                        전송에 실패했습니다. 잠시 후 다시 시도해주세요.
                      </p>
                    )}
                  </div>
                </section>
              )}

              <InquirySend
                message={inquiryMessage}
                onEnsureCopied={copyInquiryMessage}
              />

              <div className="mt-8">
                <Disclaimer />
              </div>
            </div>
          )}

          <div className="h-8" />
        </main>
      </div>

      <div className="sticky bottom-0 z-50 border-t border-black/10 bg-canvas/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1060px] items-center gap-3 px-5 py-3 sm:px-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => moveToStep((currentStep - 1) as GuidedStep)}
              className="min-h-11 shrink-0 rounded-full border border-ember bg-white px-5 text-sm font-semibold text-ember"
            >
              이전
            </button>
          )}
          <p className="ml-auto text-right text-xs leading-5 tabular-nums text-ink-soft sm:text-sm">
            {footerStatus}
          </p>
          <button
            type="button"
            onClick={goNext}
            disabled={nextDisabled}
            className="min-h-11 min-w-32 shrink-0 rounded-full bg-ember px-5 text-sm font-semibold text-white transition hover:bg-ember-deep disabled:cursor-not-allowed disabled:bg-disabled"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
