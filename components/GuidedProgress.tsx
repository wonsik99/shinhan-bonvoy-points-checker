export type GuidedStep = 1 | 2 | 3;

const STEPS: {
  step: GuidedStep;
  title: string;
  description: string;
}[] = [
  { step: 1, title: "파일 준비", description: "적립 상세내역 엑셀 업로드" },
  {
    step: 2,
    title: "결과 확인·판정",
    description: "결과를 보고 문의 항목 조정",
  },
  { step: 3, title: "문의 보내기", description: "문구 복사 후 카드사 접수" },
];

interface GuidedProgressProps {
  currentStep: GuidedStep;
  hasResults: boolean;
  onStepChange: (step: GuidedStep) => void;
}

export function GuidedProgress({
  currentStep,
  hasResults,
  onStepChange,
}: GuidedProgressProps) {
  return (
    <nav aria-label="진행 단계" className="hidden w-60 shrink-0 md:block">
      <ol className="sticky top-24">
        {STEPS.map((item, index) => {
          const complete = item.step < currentStep;
          const current = item.step === currentStep;
          const reachable = item.step === 1 || hasResults;

          return (
            <li key={item.step} className="flex gap-3">
              <div className="flex w-11 shrink-0 flex-col items-center">
                <button
                  type="button"
                  onClick={() => reachable && onStepChange(item.step)}
                  disabled={!reachable}
                  aria-current={current ? "step" : undefined}
                  aria-label={`${item.title} 단계로 이동`}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition disabled:cursor-not-allowed ${
                    current
                      ? "border-ember bg-white text-ember ring-1 ring-ember"
                      : complete
                        ? "border-ember bg-ember text-white"
                        : "border-line bg-white text-muted"
                  }`}
                >
                  {item.step}
                </button>
                {index < STEPS.length - 1 && (
                  <span
                    className={`my-1 h-10 w-0.5 rounded-full ${
                      complete ? "bg-ember" : "bg-hairline"
                    }`}
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 pt-2">
                <p
                  className={`text-sm font-semibold ${
                    current ? "text-ink" : "text-muted"
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {item.description}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-ember">
                  {current ? "진행 중" : complete ? "완료" : ""}
                </p>
              </div>
            </li>
          );
        })}
        <p className="mt-5 text-xs leading-5 text-muted">
          파일은 서버에 저장되지 않고
          <br />
          브라우저 안에서만 분석됩니다.
        </p>
      </ol>
    </nav>
  );
}

export function MobileProgress({
  currentStep,
}: Pick<GuidedProgressProps, "currentStep">) {
  const current = STEPS.find((item) => item.step === currentStep) ?? STEPS[0];

  return (
    <div className="border-t border-black/5 px-5 pb-3 pt-2 md:hidden">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {currentStep}단계 · {current.title}
        </p>
        <p className="text-xs tabular-nums text-muted">
          {currentStep} / 3
        </p>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-hairline">
        <div
          className="h-full rounded-full bg-ember transition-[width] duration-300"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}
