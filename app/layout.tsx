import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shinhan-bonvoy-l5-checker.vercel.app"),
  title: "Bonvoy L5 Checker — 신한 메리어트 본보이 적립 누락 검사기",
  description:
    "신한카드 포인트 적립 상세내역 엑셀을 업로드하면, 메리어트 계열 호텔 결제가 제대로 적립되었는지 확인해드립니다. 파일은 서버에 저장되지 않고 브라우저 안에서만 분석됩니다.",
  openGraph: {
    title: "Bonvoy L5 Checker — 신한 메리어트 본보이 적립 누락 검사기",
    description:
      "메리어트 계열 호텔 결제가 L5/L4로 제대로 적립되었는지 30초 만에 확인하세요. 파일은 브라우저 안에서만 분석됩니다.",
    url: "https://shinhan-bonvoy-l5-checker.vercel.app",
    siteName: "Bonvoy L5 Checker",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bonvoy L5 Checker — 신한 메리어트 본보이 적립 누락 검사기",
    description:
      "메리어트 계열 호텔 결제가 L5/L4로 제대로 적립되었는지 30초 만에 확인하세요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
