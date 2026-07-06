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

  if (matrix.length === 0) {
    throw new Error("엑셀 파일에 데이터가 없습니다.");
  }

  const records = extractRecords(matrix);
  if (records.length === 0) {
    throw new Error("엑셀 파일에 데이터가 없습니다.");
  }

  const { transactions, missingColumns } = normalizeRows(records);

  if (transactions.length === 0) {
    throw new Error("분석할 수 있는 거래 내역을 찾지 못했습니다.");
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
