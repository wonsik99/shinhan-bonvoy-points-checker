import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shinhan-bonvoy-points-checker.vercel.app"),
  title: "Bonvoy L4/L5 Checker — 신한 메리어트 본보이 특별적립 확인",
  description:
    "신한카드 포인트 적립 상세내역 엑셀을 업로드하면, 국내 메리어트 호텔 결제의 L4와 해외 메리어트 호텔 결제의 L5 특별적립 여부를 확인해드립니다. 파일은 서버에 저장되지 않고 브라우저 안에서만 분석됩니다.",
  openGraph: {
    title: "Bonvoy L4/L5 Checker — 신한 메리어트 본보이 특별적립 확인",
    description:
      "국내 메리어트 호텔 결제는 L4, 해외 메리어트 호텔 결제는 L5로 특별적립되었는지 확인하세요. 파일은 브라우저 안에서만 분석됩니다.",
    url: "https://shinhan-bonvoy-points-checker.vercel.app",
    siteName: "Bonvoy L4/L5 Checker",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bonvoy L4/L5 Checker — 신한 메리어트 본보이 특별적립 확인",
    description:
      "국내 L4 / 해외 L5 특별적립 여부를 30초 만에 확인하세요.",
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
