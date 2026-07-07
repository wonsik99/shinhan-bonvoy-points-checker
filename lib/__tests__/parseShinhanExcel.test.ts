import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  buildDiagnostic,
  extractRecords,
  parseShinhanExcel,
} from "@/lib/parseShinhanExcel";
import { normalizeRows } from "@/lib/normalizeTransaction";
import { analyzeTransactions } from "@/lib/analyzeTransactions";

function makeFile(aoa: unknown[][]): File {
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new File([buf], "test.xlsx");
}

/** Mirrors the real Shinhan 포인트 적립 상세내역 export: two header rows, two rows per transaction. */
const INTERLEAVED_MATRIX: unknown[][] = [
  ["", "거래일자", "영업상품코드", "매출전표번호", "가맹점번호", "해외가맹점번호", "원매출금액", "포인트종류상세", "취소전표여부"],
  ["", "매입일자", "할부개월", "카드번호", "가맹점명", "해외가맹점명", "포인트적립대상금액", "포인트적립금액", "집계작업일자"],
  ["1", 46123, "52001", "0072IV000001", "001", "681", 234068, "L2", "N"],
  ["", 46126, "0", "1234-5678-9012-3456", "VISA해외사용일시불", "HOTEL CLEVELAND", 234068, 702, 46141],
  ["2", 46127, "51001", "0069JUT280001", "011", "", 39600, "L1", "N"],
  ["", 46128, "0", "1234-5678-9012-3456", "네이버페이", "", 39600, 40, 46170],
  ["3", 46130, "52001", "0072IV000002", "001", "631", 500000, "L5", "N"],
  ["", 46133, "0", "1234-5678-9012-3456", "VISA해외사용일시불", "COURTYARD BY MARRIOTT", 500000, 2500, 46170],
];

describe("extractRecords — interleaved Shinhan layout", () => {
  it("pairs two rows into one record keyed by both header rows", () => {
    const records = extractRecords(INTERLEAVED_MATRIX);
    expect(records).toHaveLength(3);
    expect(records[0]["거래일자"]).toBe(46123);
    expect(records[0]["매입일자"]).toBe(46126);
    expect(records[0]["가맹점명"]).toBe("VISA해외사용일시불");
    expect(records[0]["해외가맹점명"]).toBe("HOTEL CLEVELAND");
    expect(records[0]["원매출금액"]).toBe(234068);
    expect(records[0]["포인트적립금액"]).toBe(702);
    expect(records[0]["포인트종류상세"]).toBe("L2");
    expect(records[0]["취소전표여부"]).toBe("N");
  });

  it("flows into normalizeRows with overseas merchant name preferred", () => {
    const { transactions } = normalizeRows(extractRecords(INTERLEAVED_MATRIX));
    expect(transactions).toHaveLength(3);

    const [cleveland, naver, courtyard] = transactions;
    expect(cleveland.merchantName).toBe("HOTEL CLEVELAND");
    expect(cleveland.transactionDate).toBe("2026-04-11");
    expect(cleveland.originalAmount).toBe(234068);
    expect(cleveland.actualPoints).toBe(702);
    expect(cleveland.pointType).toBe("L2");
    expect(cleveland.cardNumberMasked).toBe("****-****-****-3456");

    expect(naver.merchantName).toBe("네이버페이");
    expect(courtyard.merchantName).toBe("COURTYARD BY MARRIOTT");
    expect(courtyard.pointType).toBe("L5");
  });

  it("analyzes interleaved rows end to end", () => {
    const results = analyzeTransactions(
      normalizeRows(extractRecords(INTERLEAVED_MATRIX)).transactions
    );
    expect(results[0].analysisStatus).toBe("missing_suspected"); // Cleveland L2
    expect(results[0].expectedPoints).toBe(1170);
    expect(results[0].difference).toBe(468);
    expect(results[1].analysisStatus).toBe("not_marriott"); // 네이버페이
    expect(results[2].analysisStatus).toBe("ok_l5"); // Courtyard L5
  });
});

describe("extractRecords — flat layout", () => {
  it("uses a single header row when it contains both date and merchant", () => {
    const records = extractRecords([
      ["거래일자", "가맹점명", "원매출금액", "포인트종류상세", "적립포인트", "취소전표여부"],
      ["2026-04-17", "TIAD", 320000, "L2", 960, "N"],
    ]);
    expect(records).toHaveLength(1);
    expect(records[0]["가맹점명"]).toBe("TIAD");
  });

  it("skips title rows above the header", () => {
    const records = extractRecords([
      ["포인트 적립 상세내역", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      ["거래일자", "가맹점명", "원매출금액", "포인트종류상세", "적립포인트", "취소전표여부"],
      ["2026-04-17", "TIAD", 320000, "L2", 960, "N"],
    ]);
    expect(records).toHaveLength(1);
    expect(records[0]["가맹점명"]).toBe("TIAD");
  });

  it("returns first-row-as-header records for unknown layouts", () => {
    const records = extractRecords([
      ["아무거나", "값"],
      ["a", "b"],
    ]);
    expect(records).toHaveLength(1);
    expect(() => normalizeRows(records)).toThrow(/가맹점명 컬럼을 찾을 수 없습니다/);
  });
});

describe("parseShinhanExcel wrong-file handling", () => {
  it("rejects a Shinhan file that has merchants but no point columns (e.g. 카드 이용내역)", async () => {
    const file = makeFile([
      ["거래일", "카드구분", "가맹점명", "금액", "취소상태"],
      ["2026.07.03", "신용", "COURTYARD BY MARRIOTT", "150000", ""],
      ["2026.06.23", "신용", "FAIRFIELD INN & SUITES", "200000", ""],
    ]);
    await expect(parseShinhanExcel(file)).rejects.toThrow(
      /포인트 적립 정보/
    );
  });

  it("rejects an unrelated file with the generic merchant-column message, not usage-history wording", async () => {
    const file = makeFile([
      ["항목", "값"],
      ["a", "b"],
    ]);
    await expect(parseShinhanExcel(file)).rejects.toThrow(
      /가맹점명 컬럼을 찾을 수 없습니다/
    );
    await expect(parseShinhanExcel(file)).rejects.not.toThrow(/이용내역/);
  });

  it("still parses a valid point-accrual file", async () => {
    const file = makeFile([
      ["거래일자", "가맹점명", "원매출금액", "포인트종류상세", "적립포인트", "취소전표여부"],
      ["2026-04-17", "TIAD", "320000", "L2", "960", "N"],
    ]);
    const result = await parseShinhanExcel(file);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].pointType).toBe("L2");
    expect(result.columnWarning).toBeUndefined();
  });
});

describe("buildDiagnostic", () => {
  it("includes header-like rows with digits masked and excludes data rows", () => {
    const diagnostic = buildDiagnostic(
      INTERLEAVED_MATRIX,
      "적립내역_홍길동.xlsx",
      "테스트 에러"
    );
    expect(diagnostic).toContain("거래일자");
    expect(diagnostic).toContain("가맹점명");
    expect(diagnostic).toContain(".xlsx");
    expect(diagnostic).toContain("테스트 에러");
    // Transaction data must never leak into the report
    expect(diagnostic).not.toContain("HOTEL CLEVELAND");
    expect(diagnostic).not.toContain("234068");
    expect(diagnostic).not.toContain("1234-5678");
    expect(diagnostic).not.toContain("네이버페이");
  });

  it("says so when no header rows are found", () => {
    const diagnostic = buildDiagnostic([["a", "b"]], "x.xls", "에러");
    expect(diagnostic).toContain("헤더로 보이는 행을 찾지 못했습니다");
  });
});
