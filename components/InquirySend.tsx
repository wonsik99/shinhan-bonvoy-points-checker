"use client";

import { useState } from "react";

interface InquirySendProps {
  message: string;
  /** Ensures the message is on the clipboard (page-level copy handler). */
  onEnsureCopied: () => void | Promise<void>;
}

/**
 * 문의 "보내기" 채널 — 이 앱은 서버가 없으므로 보내기는 전부 사용자의 기기
 * 밖 채널(전화, 신한카드 앱/홈페이지, OS 공유 시트)로 연결하는 방식이다.
 * 네트워크 요청은 발생하지 않아 CSP(connect-src 'self')와 프라이버시
 * 스토리를 그대로 유지한다.
 */
export default function InquirySend({
  message,
  onEnsureCopied,
}: InquirySendProps) {
  const [shared, setShared] = useState(false);
  const [shareFallback, setShareFallback] = useState(false);

  if (!message) return null;

  const ensureCopied = () => {
    // Best-effort: channel buttons put the text on the clipboard first so the
    // user lands in the destination ready to paste.
    void onEnsureCopied();
  };

  const handleShare = () => {
    // 복사는 await하지 않고 시작만 해둔다 — Safari는 await 뒤에 호출된
    // navigator.share를 사용자 제스처 밖으로 보고 거부할 수 있다.
    void onEnsureCopied();
    if (typeof navigator === "undefined" || !navigator.share) {
      // 공유 시트가 없는 브라우저 — 복사만으로도 다음 단계가 가능하다.
      setShareFallback(true);
      return;
    }
    navigator
      .share({ title: "신한카드 문의 문구", text: message })
      .then(() => setShared(true))
      .catch(() => {
        // 사용자가 공유 시트를 닫은 경우 — 복사는 이미 되어 있다.
      });
  };

  const channelCard =
    "flex min-h-16 w-full items-center gap-4 rounded-[14px] border border-hairline bg-white px-4 py-3 text-left transition hover:border-ember";

  return (
    <section aria-label="문의 보내기 채널" className="mt-4">
      <div className="rounded-[18px] border border-hairline bg-white p-5">
        <h2 className="text-sm font-semibold text-ink">
          어디로 보낼까요?
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          버튼을 누르면 문구가 자동으로 복사된 뒤 해당 채널로 연결됩니다. 이
          과정에서 파일이나 거래 정보가 전송되지는 않습니다.
        </p>

        <div className="mt-4 space-y-2.5">
          <a
            href="https://www.shinhancard.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={ensureCopied}
            className={channelCard}
          >
            <span aria-hidden className="text-xl">💬</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">
                신한카드 앱 · 홈페이지 1:1 문의
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-muted">
                로그인 → 고객센터 → 1:1 문의에 복사한 문구를 붙여넣으세요.
              </span>
            </span>
            <span aria-hidden className="text-sm text-ember">↗</span>
          </a>

          <a href="tel:15447000" onClick={ensureCopied} className={channelCard}>
            <span aria-hidden className="text-xl">📞</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">
                고객센터 1544-7000 전화
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-muted">
                상담원에게 문구의 거래 내역을 그대로 읽어주시면 됩니다.
              </span>
            </span>
            <span aria-hidden className="text-sm text-ember">↗</span>
          </a>

          <button type="button" onClick={handleShare} className={channelCard}>
            <span aria-hidden className="text-xl">📤</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">
                {shared
                  ? "공유 완료 — 다시 공유하기"
                  : shareFallback
                    ? "이 브라우저는 공유 미지원 — 문구를 복사했어요"
                    : "다른 앱으로 공유"}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-muted">
                메모·메일·메신저 앱으로 문구를 보내 보관하거나 전달합니다.
              </span>
            </span>
            <span aria-hidden className="text-sm text-ember">↗</span>
          </button>
        </div>

        <p className="mt-4 border-t border-hairline pt-4 text-xs leading-5 text-muted">
          접수하면 답변은 보통 며칠 안에 옵니다. 답변을 받으면 다음 달 적립
          상세내역으로 반영 여부를 다시 확인해보세요.
        </p>
      </div>
    </section>
  );
}
