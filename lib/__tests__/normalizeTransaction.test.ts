import { describe, expect, it } from "vitest";
import {
  buildColumnMap,
  isCanceledValue,
  normalizeDate,
  normalizePointType,
  normalizeRows,
  parseMoney,
} from "@/lib/normalizeTransaction";

describe("parseMoney", () => {
  it("accepts plain numbers", () => {
    expect(parseMoney(209755)).toBe(209755);
  });

  it("accepts comma strings and currency symbols", () => {
    expect(parseMoney("209,755")).toBe(209755);
    expect(parseMoney("₩1,234,567")).toBe(1234567);
    expect(parseMoney("209,755원")).toBe(209755);
  });

  it("handles accounting negatives and minus signs", () => {
    expect(parseMoney("(1,234)")).toBe(-1234);
    expect(parseMoney("-500")).toBe(-500);
  });

  it("returns 0 for unparseable values", () => {
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("abc")).toBe(0);
    expect(parseMoney(null)).toBe(0);
  });
});

describe("normalizeDate", () => {
  it("keeps display strings", () => {
    expect(normalizeDate("2026-04-17")).toBe("2026-04-17");
  });

  it("converts compact YYYYMMDD strings", () => {
    expect(normalizeDate("20260417")).toBe("2026-04-17");
  });

  it("converts Excel serial dates", () => {
    // 46129 = 2026-04-17
    expect(normalizeDate(46129)).toBe("2026-04-17");
  });

  it("returns undefined for empty values", () => {
    expect(normalizeDate("")).toBeUndefined();
    expect(normalizeDate(null)).toBeUndefined();
  });
});

describe("normalizePointType", () => {
  it("extracts L-grades from longer labels", () => {
    expect(normalizePointType("마이신한포인트 L2")).toBe("L2");
    expect(normalizePointType("L5")).toBe("L5");
    expect(normalizePointType("l5 적립")).toBe("L5");
  });

  it("passes through unknown labels", () => {
    expect(normalizePointType("기본적립")).toBe("기본적립");
  });
});

describe("isCanceledValue", () => {
  it("detects Korean and Y/N cancellation markers", () => {
    expect(isCanceledValue("Y")).toBe(true);
    expect(isCanceledValue("취소")).toBe(true);
    expect(isCanceledValue("전표취소")).toBe(true);
    expect(isCanceledValue("N")).toBe(false);
    expect(isCanceledValue("")).toBe(false);
    expect(isCanceledValue(undefined)).toBe(false);
  });
});

describe("buildColumnMap", () => {
  it("maps Shinhan headers with whitespace and invisible characters", () => {
    const map = buildColumnMap([
      " 거래일자 ",
      "가맹점명​",
      "원매출금액",
      "포인트적립대상금액",
      "포인트종류상세",
      "적립포인트",
      "취소전표여부",
    ]);
    expect(map.transactionDate).toBe(" 거래일자 ");
    expect(map.merchantName).toBe("가맹점명​");
    expect(map.originalAmount).toBe("원매출금액");
    expect(map.eligibleAmount).toBe("포인트적립대상금액");
    expect(map.pointType).toBe("포인트종류상세");
    expect(map.actualPoints).toBe("적립포인트");
    expect(map.canceled).toBe("취소전표여부");
  });

  it("falls back to alias variants", () => {
    const map = buildColumnMap(["거래일", "이용가맹점명", "이용금액", "포인트"]);
    expect(map.transactionDate).toBe("거래일");
    expect(map.merchantName).toBe("이용가맹점명");
    expect(map.originalAmount).toBe("이용금액");
    expect(map.actualPoints).toBe("포인트");
  });
});

describe("normalizeRows", () => {
  const row = {
    거래일자: "20260417",
    가맹점명: "POSTCARD CABINS THE TH",
    원매출금액: "209,755",
    포인트적립대상금액: "209,755",
    포인트종류상세: "L2",
    적립포인트: "629",
    취소전표여부: "N",
    카드번호: "1234-5678-9012-3456",
  };

  it("normalizes a Shinhan row end to end", () => {
    const { transactions } = normalizeRows([row]);
    expect(transactions).toHaveLength(1);
    const tx = transactions[0];
    expect(tx.transactionDate).toBe("2026-04-17");
    expect(tx.merchantName).toBe("POSTCARD CABINS THE TH");
    expect(tx.originalAmount).toBe(209755);
    expect(tx.eligibleAmount).toBe(209755);
    expect(tx.pointType).toBe("L2");
    expect(tx.actualPoints).toBe(629);
    expect(tx.isCanceled).toBe(false);
    expect(tx.cardNumberMasked).toBe("****-****-****-3456");
    expect(tx.cardNumberMasked).not.toContain("1234-5678");
  });

  it("falls back to originalAmount when eligible amount column is absent", () => {
    const withoutEligible: Record<string, unknown> = { ...row };
    delete withoutEligible["포인트적립대상금액"];
    const { transactions } = normalizeRows([withoutEligible]);
    expect(transactions[0].eligibleAmount).toBe(209755);
  });

  it("skips blank filler rows", () => {
    const { transactions } = normalizeRows([
      row,
      { 거래일자: "", 가맹점명: "", 원매출금액: "", 적립포인트: "" },
    ]);
    expect(transactions).toHaveLength(1);
  });

  it("throws a friendly error when merchant column is missing", () => {
    expect(() => normalizeRows([{ 아무거나: "값" }])).toThrow(
      /가맹점명 컬럼을 찾을 수 없습니다/
    );
  });

  it("keeps row ids stable across re-parses", () => {
    const a = normalizeRows([row]).transactions[0].id;
    const b = normalizeRows([row]).transactions[0].id;
    expect(a).toBe(b);
  });
});
