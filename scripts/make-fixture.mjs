// Generates a local-only sample Shinhan point-accrual Excel file for manual testing.
// Mirrors the real export layout: two header rows, then two rows per transaction,
// with overseas hotel names in 해외가맹점명 and the channel in 가맹점명.
// Output lands in docs/_local/ which is gitignored — never commit real or fake statements.
import * as XLSX from "xlsx";
import * as fs from "node:fs";

XLSX.set_fs(fs);

const HEADER_A = ["", "거래일자", "영업상품코드", "매출전표번호", "가맹점번호", "해외가맹점번호", "원매출금액", "포인트종류상세", "취소전표여부"];
const HEADER_B = ["", "매입일자", "할부개월", "카드번호", "가맹점명", "해외가맹점명", "포인트적립대상금액", "포인트적립금액", "집계작업일자"];

const CARD = "1234-5678-9012-3456";

// [seq, txDate, postDate, domesticName, overseasName, amount, pointType, points, canceled]
const transactions = [
  // Certain Marriott, credited L2/L1 → missing suspected
  [1, 46123, 46126, "VISA해외사용일시불", "COURTYARD BY MARRIOTT", 234068, "L2", 702, "N"],
  [2, 46108, 46110, "VISA해외사용일시불", "FAIRFIELD INN ANN ARBO", 209755, "L2", 629, "N"],
  [3, 46096, 46098, "VISA해외사용일시불", "FAIRFIELD INN & SUITES", 180000, "L1", 180, "N"],
  [4, 46086, 46088, "VISA해외사용일시불", "FAIRFIELD BELLE VERNON", 150000, "L2", 450, "N"],
  [5, 46074, 46076, "VISA해외사용일시불", "TOWNEPLACE SUITES GENE", 792371, "L2", 2377, "N"],
  // Known merchant rules, credited L2 → missing suspected
  [6, 46116, 46118, "VISA해외사용일시불", "POSTCARD CABINS THE TH", 209755, "L2", 629, "N"],
  [7, 46111, 46113, "VISA해외사용일시불", "TIAD", 320000, "L2", 960, "N"],
  [8, 46105, 46107, "VISA해외사용일시불", "HOTEL CLEVELAND", 275500, "L2", 826, "N"],
  // Properly credited L5 → ok
  [9, 46080, 46082, "VISA해외사용일시불", "JW MARRIOTT SEOUL", 500000, "L5", 2500, "N"],
  // Ambiguous → needs review
  [10, 46061, 46063, "VISA해외사용일시불", "HOTEL 55 CHICAGO", 209755, "L2", 629, "N"],
  // Not Marriott (overseas + domestic)
  [11, 46057, 46059, "VISA해외사용일시불", "ZIPPY AUTO WASH - ELLSWO", 15000, "L1", 15, "N"],
  [12, 46055, 46056, "네이버페이", "", 6500, "L1", 6, "N"],
  // Canceled Marriott transaction → excluded
  [13, 46036, 46038, "VISA해외사용일시불", "SHERATON GRAND INCHEON", 410000, "L2", 1230, "Y"],
  // Domestic Marriott: L1-credited → missing suspected (L4 = 5P/1,000원); L4 → ok
  [14, 46150, 46152, "코트야드메리어트서울남대문", "", 300000, "L1", 300, "N"],
  [15, 46160, 46162, "웨스틴조선서울", "", 200000, "L4", 1000, "N"],
  // False negative: a real Marriott (Luxury Collection) with no brand/hotel
  // keyword → classified not_marriott. User can flag it in the full table.
  [16, 46165, 46167, "VISA해외사용일시불", "MYSTIQUE SANTORINI", 600000, "L2", 1800, "N"],
];

const rows = [HEADER_A, HEADER_B];
for (const [seq, txDate, postDate, domestic, overseas, amount, pointType, points, canceled] of transactions) {
  rows.push([String(seq), txDate, "52001", `0072IV${String(seq).padStart(6, "0")}`, "001234567", overseas ? "6812345" : "", amount, pointType, canceled]);
  rows.push(["", postDate, "0", CARD, domestic, overseas, amount, points, 46170]);
}

const sheet = XLSX.utils.aoa_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

fs.mkdirSync("docs/_local", { recursive: true });
XLSX.writeFile(workbook, "docs/_local/sample.xlsx");
console.log("Wrote docs/_local/sample.xlsx with", transactions.length, "transactions (interleaved layout)");
