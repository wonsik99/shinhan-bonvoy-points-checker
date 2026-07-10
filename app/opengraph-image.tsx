import { ImageResponse } from "next/og";

export const alt =
  "Bonvoy L4/L5 Checker — 신한 메리어트 본보이 특별적립 확인";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f1d3d 0%, #1e3a8a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, color: "#93c5fd" }}>
          🏨 신한 메리어트 본보이 카드
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            marginTop: 20,
            letterSpacing: "0",
          }}
        >
          Bonvoy L4/L5 Checker
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 38,
            marginTop: 28,
            color: "#e2e8f0",
            lineHeight: 1.4,
          }}
        >
          국내 L4 / 해외 L5 특별적립 여부를 30초 만에 확인
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 48,
            fontSize: 28,
            color: "#6ee7b7",
          }}
        >
          🔒 파일은 서버에 저장되지 않고 브라우저 안에서만 분석됩니다
        </div>
      </div>
    ),
    size
  );
}
