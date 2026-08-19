interface FileSessionBarProps {
  fileName: string | null;
  onReset: () => void;
}

export default function FileSessionBar({
  fileName,
  onReset,
}: FileSessionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-ink">{fileName}</p>
        <p className="mt-0.5 text-xs text-muted" role="status">
          분석이 완료되었습니다.
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="min-h-11 rounded-full border border-line bg-white px-4 text-xs font-medium text-ink-soft"
      >
        다른 파일 업로드
      </button>
    </div>
  );
}
