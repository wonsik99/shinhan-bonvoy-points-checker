import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeTransactions, summarizeResults } from "@/lib/analyzeTransactions";
import { normalizeRows } from "@/lib/normalizeTransaction";
import type { AnalysisResult } from "@/types/transaction";

// Replays reported statements kept only in the gitignored local folder.
// The committed harness holds no report data; it skips when the file is absent.
const REPLAY_PATH = "docs/_local/classic-feedback-replay-2026-10.json";

interface ReplayTransaction {
  slip: string;
  date: string;
  card: string;
  domesticName: string;
  overseasName: string;
  amount: number;
  grade: string;
  points: number;
  pairWithIndex: number | null;
  expect: {
    status: AnalysisResult["analysisStatus"];
    expectedPointType: AnalysisResult["expectedPointType"] | null;
    expectedPoints?: number;
    bonusPoints?: number | null;
    difference: number | null;
    note: string;
  };
}

interface ReplayFile {
  name: string;
  transactions: ReplayTransaction[];
  expectSummary: {
    totalCount: number;
    okCount: number;
    missingSuspectedCount: number;
    needsReviewCount: number;
    totalExpectedAdditionalPoints: number;
    cardProfileCounts: { the_best: number; the_classic: number };
  };
}

const replay: { files: ReplayFile[] } | null = existsSync(REPLAY_PATH)
  ? JSON.parse(readFileSync(REPLAY_PATH, "utf8"))
  : null;

function statementRows(file: ReplayFile): Record<string, unknown>[] {
  return file.transactions.map((row) => ({
    거래일자: row.date,
    매출전표번호: row.slip,
    카드번호: row.card,
    가맹점명: row.domesticName,
    해외가맹점명: row.overseasName,
    원매출금액: row.amount,
    포인트적립대상금액: row.amount,
    포인트종류상세: row.grade,
    포인트적립금액: row.points,
    취소전표여부: "N",
  }));
}

describe.skipIf(replay === null)("local replay of reported mixed-card statements", () => {
  for (const file of replay?.files ?? []) {
    describe(file.name, () => {
      const { transactions } = normalizeRows(statementRows(file));
      const results = analyzeTransactions(transactions);

      file.transactions.forEach((row, index) => {
        const label = `${index + 1}. ${row.overseasName || row.domesticName} ${row.grade}`;
        it(`${label} → ${row.expect.status} (${row.expect.note})`, () => {
          const result = results[index];
          expect(result.analysisStatus).toBe(row.expect.status);
          expect(result.cardProfileId).toBe(
            row.grade.startsWith("C") ? "the_classic" : "the_best"
          );
          if (row.expect.expectedPointType) {
            expect(result).toMatchObject({
              expectedPointType: row.expect.expectedPointType,
              expectedPoints: row.expect.expectedPoints,
              difference: row.expect.difference,
            });
          }
          if (row.expect.bonusPoints) {
            expect(result.bonusPoints).toBe(row.expect.bonusPoints);
          }
          if (row.pairWithIndex !== null) {
            expect(result).toMatchObject({
              accrualRole: "bonus",
              bonusBaseRowId: results[row.pairWithIndex].id,
              effectiveIncluded: false,
            });
          }
        });
      });

      it("matches the expected summary", () => {
        const summary = summarizeResults(results);
        expect({
          totalCount: summary.totalCount,
          okCount: summary.okL5Count,
          missingSuspectedCount: summary.missingSuspectedCount,
          needsReviewCount: summary.needsReviewCount,
          totalExpectedAdditionalPoints: summary.totalExpectedAdditionalPoints,
          cardProfileCounts: summary.cardProfileCounts,
        }).toEqual(file.expectSummary);
      });
    });
  }
});
