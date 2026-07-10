import * as XLSX from "xlsx";
import type { NormalizedTransaction } from "@/types/transaction";
import { cleanHeaderLabel, normalizeRows } from "@/lib/normalizeTransaction";

export interface ParseResult {
  transactions: NormalizedTransaction[];
  sheetName: string;
  totalRows: number;
  /** Korean warning when analysis-critical columns could not be mapped. */
  columnWarning?: string;
}

const CRITICAL_COLUMN_LABELS: Record<string, string> = {
  transactionDate: "거래일자",
  originalAmount: "이용금액(원매출금액)",
  pointType: "포인트종류",
  actualPoints: "적립포인트",
  canceled: "취소여부",
};

const MERCHANT_HEADER_LABELS = ["가맹점명", "이용가맹점명", "이용가맹점"];
const DATE_HEADER_LABELS = ["거래일자", "거래일", "이용일자", "이용일"];

/**
 * Parse failure that carries a privacy-safe diagnostic: only header-looking
 * rows (digit-masked), never amounts, merchant names, or card numbers.
 * Users can paste it into a GitHub issue to report unsupported layouts.
 */
export class ShinhanParseError extends Error {
  diagnostic: string;

  constructor(message: string, diagnostic: string) {
    super(message);
    this.name = "ShinhanParseError";
    this.diagnostic = diagnostic;
  }
}

const HEADER_HINTS = [
  "거래일",
  "매입일",
  "이용일",
  "가맹점",
  "포인트",
  "금액",
  "취소",
  "카드번호",
  "집계",
  "할부",
];

/** Builds a report string from header-like rows only, with all digits masked. */
export function buildDiagnostic(
  matrix: unknown[][],
  fileName: string,
  errorMessage: string
): string {
  const headerRows: string[] = [];
  const scanLimit = Math.min(matrix.length, 10);
  for (let i = 0; i < scanLimit; i++) {
    const cells = matrix[i].map((c) => String(c ?? "").trim());
    const hintCount = cells.filter((c) =>
      HEADER_HINTS.some((hint) => c.includes(hint))
    ).length;
    if (hintCount >= 2) {
      const masked = cells
        .map((c) => c.replace(/\d+/g, "**").slice(0, 30))
        .join(" | ");
      headerRows.push(`${i + 1}행: ${masked}`);
    }
  }

  const extension = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "(없음)";

  return [
    "[Bonvoy L5 Checker 파싱 실패 제보]",
    `에러: ${errorMessage}`,
    `파일 형식: ${extension} / 전체 행 수: ${matrix.length}`,
    headerRows.length > 0
      ? `헤더로 보이는 행 (숫자는 **로 마스킹됨):\n${headerRows.join("\n")}`
      : "헤더로 보이는 행을 찾지 못했습니다.",
    "※ 금액, 가맹점명, 카드번호 등 거래 데이터는 포함되지 않습니다.",
  ].join("\n");
}

function rowHasLabel(row: unknown[], labels: string[]): boolean {
  return row.some((cell) => labels.includes(cleanHeaderLabel(String(cell ?? ""))));
}

function isEmptyRow(row: unknown[]): boolean {
  return row.every((cell) => String(cell ?? "").trim() === "");
}

/** Assigns each non-empty header label its cell value from the data row. */
function assignByHeader(
  record: Record<string, unknown>,
  header: unknown[],
  row: unknown[]
): void {
  for (let c = 0; c < header.length; c++) {
    const label = String(header[c] ?? "").trim();
    if (label) {
      record[label] = row[c] ?? "";
    }
  }
}

/**
 * Converts the raw cell matrix into one flat record per transaction.
 *
 * Real Shinhan "포인트 적립 상세내역" exports use an interleaved layout:
 * two header rows (거래일자/원매출금액/포인트종류상세… over 매입일자/가맹점명/포인트적립금액…)
 * followed by two rows per transaction. Simple one-row-per-transaction sheets
 * are also supported, including ones with title rows above the header.
 */
export function extractRecords(matrix: unknown[][]): Record<string, unknown>[] {
  const scanLimit = Math.min(matrix.length, 10);

  for (let i = 0; i < scanLimit; i++) {
    const row = matrix[i];
    const hasMerchant = rowHasLabel(row, MERCHANT_HEADER_LABELS);
    const hasDate = rowHasLabel(row, DATE_HEADER_LABELS);

    if (hasMerchant && hasDate) {
      // Flat layout: this row is the single header.
      const records: Record<string, unknown>[] = [];
      for (let r = i + 1; r < matrix.length; r++) {
        if (isEmptyRow(matrix[r])) continue;
        const record: Record<string, unknown> = {};
        assignByHeader(record, row, matrix[r]);
        records.push(record);
      }
      return records;
    }

    if (hasDate && i + 1 < matrix.length) {
      const nextRow = matrix[i + 1];
      if (rowHasLabel(nextRow, MERCHANT_HEADER_LABELS)) {
        // Interleaved layout: rows i and i+1 are paired headers; each
        // transaction then occupies two consecutive rows in the same order.
        const records: Record<string, unknown>[] = [];
        for (let r = i + 2; r < matrix.length; r += 2) {
          const rowA = matrix[r];
          const rowB = matrix[r + 1] ?? [];
          if (isEmptyRow(rowA) && isEmptyRow(rowB)) continue;
          const record: Record<string, unknown> = {};
          assignByHeader(record, row, rowA);
          assignByHeader(record, nextRow, rowB);
          records.push(record);
        }
        return records;
      }
    }
  }

  // Unknown layout: treat the first row as a header so normalizeRows can
  // produce its friendly missing-column error.
  const [header, ...rest] = matrix;
  if (!header) return [];
  return rest
    .filter((r) => !isEmptyRow(r))
    .map((r) => {
      const record: Record<string, unknown> = {};
      assignByHeader(record, header, r);
      return record;
    });
}

/**
 * Parses a Shinhan point-accrual Excel file entirely in the browser.
 * The file never leaves the client; only the parsed rows are returned.
 */
export async function parseShinhanExcel(file: File): Promise<ParseResult> {
  let workbook: XLSX.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    throw new Error(
      "엑셀 파일을 읽을 수 없습니다. 신한카드에서 다운로드한 .xlsx 또는 .xls 파일인지 확인해주세요."
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("엑셀 파일에 시트가 없습니다.");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  const fail = (message: string): never => {
    throw new ShinhanParseError(message, buildDiagnostic(matrix, file.name, message));
  };

  if (matrix.length === 0) {
    fail("엑셀 파일에 데이터가 없습니다.");
  }

  const records = extractRecords(matrix);
  if (records.length === 0) {
    fail("엑셀 파일에 데이터가 없습니다.");
  }

  let normalized;
  try {
    normalized = normalizeRows(records);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "컬럼을 해석하지 못했습니다.");
  }
  const { transactions, missingColumns } = normalized;

  if (transactions.length === 0) {
    fail("분석할 수 있는 거래 내역을 찾지 못했습니다.");
  }

  // With no point-type AND no accrued-points column, the core check (was this
  // credited at L4/L5?) is impossible — this is almost always the wrong export
  // (e.g. 카드 이용내역 instead of 포인트 적립 상세내역). Reject clearly rather
  // than showing a page of zero-amount rows.
  if (
    missingColumns.includes("pointType") &&
    missingColumns.includes("actualPoints")
  ) {
    fail(
      "이 엑셀에는 포인트 적립 정보(포인트종류·적립포인트)가 없어 분석할 수 없습니다. " +
        "신한카드 '포인트 적립 상세내역' 파일이 맞는지 확인해주세요. " +
        "('카드 이용내역' 등 다른 명세서에는 이 정보가 없습니다. " +
        "적립 상세내역은 고객센터 1544-7000으로 발급받을 수 있습니다.)"
    );
  }

  const missingCritical = missingColumns
    .filter((field) => field in CRITICAL_COLUMN_LABELS)
    .map((field) => CRITICAL_COLUMN_LABELS[field]);

  const columnWarning =
    missingCritical.length > 0
      ? `엑셀에서 다음 컬럼을 찾지 못했습니다: ${missingCritical.join(", ")}. ` +
        "신한카드 '포인트 적립 상세내역' 파일이 맞는지 확인해주세요. 분석 결과가 부정확할 수 있습니다."
      : undefined;

  return {
    transactions,
    sheetName,
    totalRows: records.length,
    columnWarning,
  };
}
