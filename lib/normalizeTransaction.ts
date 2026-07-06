import type { NormalizedTransaction } from "@/types/transaction";
import { maskCardNumber } from "@/lib/format";

type CanonicalField =
  | "transactionDate"
  | "postingDate"
  | "merchantName"
  | "overseasMerchantName"
  | "originalAmount"
  | "eligibleAmount"
  | "pointType"
  | "actualPoints"
  | "canceled"
  | "aggregationDate"
  | "cardNumber";

/**
 * Shinhan statement headers vary between exports. Aliases are matched after
 * stripping whitespace and invisible characters; earlier aliases win.
 */
const COLUMN_ALIASES: Record<CanonicalField, string[]> = {
  transactionDate: ["거래일자", "거래일"],
  postingDate: ["매입일자", "매입일"],
  merchantName: ["가맹점명", "이용가맹점명", "이용가맹점"],
  overseasMerchantName: ["해외가맹점명", "해외이용가맹점명"],
  originalAmount: ["원매출금액", "이용금액", "매출금액"],
  eligibleAmount: ["포인트적립대상금액", "적립대상금액"],
  pointType: ["포인트종류상세", "포인트종류"],
  actualPoints: ["적립포인트", "포인트적립금액", "포인트"],
  canceled: ["취소전표여부", "취소여부"],
  aggregationDate: ["집계작업일자", "집계일자"],
  cardNumber: ["카드번호"],
};

/** Removes zero-width characters, BOM, NBSP, and all whitespace. */
export function cleanHeaderLabel(header: string): string {
  return header.replace(/[\u200B-\u200D\uFEFF\u00A0\s]/g, "");
}

export function buildColumnMap(
  headers: string[]
): Partial<Record<CanonicalField, string>> {
  const cleanedToOriginal = new Map<string, string>();
  for (const header of headers) {
    const cleaned = cleanHeaderLabel(header);
    if (cleaned && !cleanedToOriginal.has(cleaned)) {
      cleanedToOriginal.set(cleaned, header);
    }
  }

  const map: Partial<Record<CanonicalField, string>> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [
    CanonicalField,
    string[],
  ][]) {
    for (const alias of aliases) {
      const original = cleanedToOriginal.get(cleanHeaderLabel(alias));
      if (original !== undefined) {
        map[field] = original;
        break;
      }
    }
  }
  return map;
}

/** Accepts numbers, comma strings, and currency symbols; returns 0 when unparseable. */
export function parseMoney(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== "string") {
    return 0;
  }
  let text = value.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim();
  if (!text) {
    return 0;
  }
  // Accounting negatives: (1,234) → -1234
  let negative = false;
  const parenMatch = text.match(/^\((.+)\)$/);
  if (parenMatch) {
    negative = true;
    text = parenMatch[1];
  }
  text = text.replace(/[₩$￦€£¥]|원|KRW|USD/gi, "").replace(/[,\s]/g, "");
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return negative ? -parsed : parsed;
}

/** Days between the Excel epoch (1899-12-30) and the Unix epoch. */
const EXCEL_EPOCH_OFFSET_DAYS = 25569;

function excelSerialToIsoDate(serial: number): string {
  const ms = Math.round((serial - EXCEL_EPOCH_OFFSET_DAYS) * 86400 * 1000);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return String(serial);
  }
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Preserves the original display string when possible; converts Excel serial
 * numbers and compact YYYYMMDD strings to YYYY-MM-DD. Unclear values pass through.
 */
export function normalizeDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number") {
    // Plausible Excel serial range (1950-01-01 .. 2077-10-14)
    if (value > 18264 && value < 65000) {
      return excelSerialToIsoDate(value);
    }
    // Compact numeric date like 20260417
    const digits = String(Math.trunc(value));
    if (digits.length === 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    }
    return String(value);
  }
  const text = String(value).trim();
  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }
  return text || undefined;
}

/** Extracts an L-grade token (L1/L2/L5 …) from the point type text. */
export function normalizePointType(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).trim();
  const match = text.toUpperCase().match(/L\s*(\d+)/);
  if (match) {
    return `L${match[1]}`;
  }
  return text;
}

const CANCELED_VALUES = new Set(["Y", "YES", "TRUE", "1", "예", "취소", "O"]);

export function isCanceledValue(value: unknown): boolean {
  if (value === true) {
    return true;
  }
  if (value === null || value === undefined) {
    return false;
  }
  const text = String(value).replace(/\s/g, "").toUpperCase();
  if (!text) {
    return false;
  }
  if (CANCELED_VALUES.has(text)) {
    return true;
  }
  return text.includes("취소");
}

/** Small deterministic hash so row ids stay stable across re-parses of the same file. */
function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export interface NormalizeRowsResult {
  transactions: NormalizedTransaction[];
  /** Canonical fields that could not be mapped to any column. */
  missingColumns: CanonicalField[];
}

const REQUIRED_FIELDS: CanonicalField[] = ["merchantName"];

export function normalizeRows(
  rows: Record<string, unknown>[]
): NormalizeRowsResult {
  const headers = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headers.add(key);
    }
  }
  const columnMap = buildColumnMap([...headers]);

  const missingColumns = (
    Object.keys(COLUMN_ALIASES) as CanonicalField[]
  ).filter((field) => columnMap[field] === undefined);

  for (const field of REQUIRED_FIELDS) {
    if (columnMap[field] === undefined) {
      throw new Error(
        "가맹점명 컬럼을 찾을 수 없습니다. 신한카드 포인트 적립 상세내역 엑셀 파일이 맞는지 확인해주세요."
      );
    }
  }

  const get = (row: Record<string, unknown>, field: CanonicalField) => {
    const key = columnMap[field];
    return key === undefined ? undefined : row[key];
  };

  const transactions: NormalizedTransaction[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Overseas payments carry the channel ("VISA해외사용일시불") in 가맹점명 and
    // the actual hotel in 해외가맹점명 — prefer the latter when present.
    const domesticName = String(get(row, "merchantName") ?? "").trim();
    const overseasName = String(get(row, "overseasMerchantName") ?? "").trim();
    const merchantName = overseasName || domesticName;
    const originalAmount = parseMoney(get(row, "originalAmount"));
    const eligibleRaw = get(row, "eligibleAmount");
    const eligibleAmount =
      eligibleRaw === undefined || eligibleRaw === ""
        ? originalAmount
        : parseMoney(eligibleRaw);
    const actualPoints = parseMoney(get(row, "actualPoints"));

    // Skip blank filler rows (e.g. trailing empty lines in the export)
    if (!merchantName && originalAmount === 0 && actualPoints === 0) {
      continue;
    }

    const transactionDate = normalizeDate(get(row, "transactionDate"));
    const pointType = normalizePointType(get(row, "pointType"));
    const cardNumberRaw = get(row, "cardNumber");

    transactions.push({
      id: `row-${i}-${hashString(
        [merchantName, originalAmount, pointType, transactionDate ?? ""].join("|")
      )}`,
      rowIndex: i,
      transactionDate,
      postingDate: normalizeDate(get(row, "postingDate")),
      merchantName,
      originalAmount,
      eligibleAmount,
      pointType,
      actualPoints,
      isCanceled: isCanceledValue(get(row, "canceled")),
      aggregationDate: normalizeDate(get(row, "aggregationDate")),
      cardNumberMasked:
        cardNumberRaw === undefined || cardNumberRaw === null || cardNumberRaw === ""
          ? undefined
          : maskCardNumber(String(cardNumberRaw)),
      raw: row,
    });
  }

  return { transactions, missingColumns };
}
