import * as XLSX from "xlsx";
import type { NormalizedTransaction } from "@/types/transaction";
import { normalizeRows } from "@/lib/normalizeTransaction";

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
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    throw new Error("엑셀 파일에 데이터가 없습니다.");
  }

  const { transactions, missingColumns } = normalizeRows(rows);

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

  return { transactions, sheetName, totalRows: rows.length, columnWarning };
}
