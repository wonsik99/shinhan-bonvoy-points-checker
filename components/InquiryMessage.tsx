"use client";

import { useEffect, useRef, useState } from "react";

interface InquiryMessageProps {
  message: string;
}

export default function InquiryMessage({ message }: InquiryMessageProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!message) {
    return (
      <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-500">
        누락 의심 거래가 있거나 확인 필요 거래를 포함하면 문의 문구가 여기에
        생성됩니다.
      </p>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions/http); user can still select the text.
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
        <p className="text-sm text-neutral-500">
          아래 문구를 복사해서 신한카드 고객센터/앱 문의에 붙여넣으세요.
        </p>
        <button
          type="button"
          onClick={copy}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
        >
          {copied ? "복사됨 ✓" : "문구 복사"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-neutral-800">
        {message}
      </pre>
    </div>
  );
}
