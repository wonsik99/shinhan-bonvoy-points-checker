"use client";

import { useEffect, useRef, useState } from "react";

interface InquiryMessageProps {
  message: string;
  copied?: boolean;
  onCopy?: () => void | Promise<void>;
}

export default function InquiryMessage({
  message,
  copied,
  onCopy,
}: InquiryMessageProps) {
  const [localCopied, setLocalCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCopied = copied ?? localCopied;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!message) {
    return (
      <p className="rounded-[18px] border border-hairline bg-white px-5 py-6 text-sm leading-6 text-muted">
        누락 의심 거래가 있거나 확인 필요 거래를 포함하면 문의 문구가 여기에
        생성됩니다.
      </p>
    );
  }

  const copy = async () => {
    if (onCopy) {
      await onCopy();
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      setLocalCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setLocalCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable; the message remains selectable.
    }
  };

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-white">
      <div className="flex flex-col gap-3 border-b border-hairline px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          아래 문구를 복사해서 신한카드 고객센터나 앱 문의에 붙여넣으세요.
        </p>
        <button
          type="button"
          onClick={copy}
          className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold text-white transition ${
            isCopied ? "bg-emerald-700" : "bg-ember hover:bg-ember-deep"
          }`}
        >
          {isCopied ? "복사 완료" : "문구 복사"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-7 text-ink-soft">
        {message}
      </pre>
    </div>
  );
}
