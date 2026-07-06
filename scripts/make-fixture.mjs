// Generates a local-only sample Shinhan point-accrual Excel file for manual testing.
// Output lands in docs/_local/ which is gitignored — never commit real or fake statements.
import * as XLSX from "xlsx";
import * as fs from "node:fs";

XLSX.set_fs(fs);

const rows = [
  // Certain Marriott, credited L2 → missing suspected
  ["2026-04-17", "2026-04-18", "COURTYARD BY MARRIOTT", 234068, 234068, "L2", 702, "N", "2026-04-19", "1234-5678-9012-3456"],
  ["2026-04-02", "2026-04-03", "FAIRFIELD INN ANN ARBO", 209755, 209755, "L2", 629, "N", "2026-04-04", "1234-5678-9012-3456"],
  ["2026-03-21", "2026-03-22", "FAIRFIELD INN & SUITES", 180000, 180000, "L1", 180, "N", "2026-03-23", "1234-5678-9012-3456"],
  ["2026-03-11", "2026-03-12", "FAIRFIELD BELLE VERNON", 150000, 150000, "L2", 450, "N", "2026-03-13", "1234-5678-9012-3456"],
  ["2026-02-27", "2026-02-28", "TOWNEPLACE SUITES GENE", 792371, 792371, "L2", 2377, "N", "2026-03-01", "1234-5678-9012-3456"],
  // Known merchant rules, credited L2 → missing suspected
  ["2026-04-10", "2026-04-11", "POSTCARD CABINS THE TH", 209755, 209755, "L2", 629, "N", "2026-04-12", "1234-5678-9012-3456"],
  ["2026-04-05", "2026-04-06", "TIAD", 320000, 320000, "L2", 960, "N", "2026-04-07", "1234-5678-9012-3456"],
  ["2026-03-30", "2026-03-31", "HOTEL CLEVELAND", 275500, 275500, "L2", 826, "N", "2026-04-01", "1234-5678-9012-3456"],
  // Properly credited L5 → ok
  ["2026-03-05", "2026-03-06", "JW MARRIOTT SEOUL", 500000, 500000, "L5", 2500, "N", "2026-03-07", "1234-5678-9012-3456"],
  // Ambiguous → needs review
  ["2026-02-14", "2026-02-15", "HOTEL 55 CHICAGO", 209755, 209755, "L2", 629, "N", "2026-02-16", "1234-5678-9012-3456"],
  // Not Marriott
  ["2026-02-10", "2026-02-11", "ZIPPY AUTO WASH - ELLSWO", 15000, 15000, "L1", 15, "N", "2026-02-12", "1234-5678-9012-3456"],
  ["2026-02-08", "2026-02-09", "스타벅스 강남점", 6500, 6500, "L1", 6, "N", "2026-02-10", "1234-5678-9012-3456"],
  // Canceled Marriott transaction → excluded
  ["2026-01-20", "2026-01-21", "SHERATON GRAND INCHEON", 410000, 410000, "L2", 1230, "Y", "2026-01-22", "1234-5678-9012-3456"],
];

const headers = [
  "거래일자",
  "매입일자",
  "가맹점명",
  "원매출금액",
  "포인트적립대상금액",
  "포인트종류상세",
  "적립포인트",
  "취소전표여부",
  "집계작업일자",
  "카드번호",
];

const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet, "포인트적립상세");

fs.mkdirSync("docs/_local", { recursive: true });
XLSX.writeFile(workbook, "docs/_local/sample.xlsx");
console.log("Wrote docs/_local/sample.xlsx with", rows.length, "rows");
