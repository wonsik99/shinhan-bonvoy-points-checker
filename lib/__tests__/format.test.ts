import { describe, expect, it } from "vitest";
import {
  confidenceLabels,
  formatKrw,
  formatNumber,
  formatPoints,
  formatSignedPoints,
  maskCardNumber,
  statusLabels,
} from "@/lib/format";

describe("number formatting", () => {
  it("formats Korean currency, numbers, and points", () => {
    expect(formatKrw(1234567)).toBe("1,234,567원");
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatPoints(1234567)).toBe("1,234,567P");
    expect(formatKrw(-1234)).toBe("-1,234원");
  });

  it("adds a plus sign only to positive point differences", () => {
    expect(formatSignedPoints(120)).toBe("+120P");
    expect(formatSignedPoints(0)).toBe("0P");
    expect(formatSignedPoints(-120)).toBe("-120P");
  });
});

describe("maskCardNumber", () => {
  it("drops separators, masks every prefix digit, and keeps only the last four", () => {
    expect(maskCardNumber("1234-5678-9012-3456")).toBe(
      "****-****-****-3456"
    );
    expect(maskCardNumber("1234567890123456")).toBe("****-****-****-3456");
    expect(maskCardNumber("12ab3")).toBe("****");
    expect(maskCardNumber("")).toBe("****");
  });
});

describe("display labels", () => {
  it("keeps every confidence and analysis status label stable", () => {
    expect(confidenceLabels).toEqual({
      certain: "확실",
      high: "높음",
      medium: "중간",
      low: "낮음",
      none: "해당 없음",
    });
    expect(statusLabels).toEqual({
      ok_l5: "정상 적립",
      missing_suspected: "적립 누락 의심",
      needs_review: "확인 필요",
      not_marriott: "일반 거래",
      canceled: "취소 거래",
    });
  });
});
