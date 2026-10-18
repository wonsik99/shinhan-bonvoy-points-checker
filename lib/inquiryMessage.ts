import type { AnalysisResult } from "@/types/transaction";
import { formatNumber } from "@/lib/format";
import { actualGradeLabel, actualPointsTotal } from "@/lib/analyzeTransactions";
import {
  activeCardProfile,
  cardProfileById,
  cardProfiles,
  type CardProfile,
} from "@/rules/cardProfiles";

function profileOf(row: AnalysisResult): CardProfile {
  return cardProfileById(row.cardProfileId) ?? activeCardProfile;
}

function inquiryLine(row: AnalysisResult): string {
  const date = row.transactionDate ?? row.postingDate ?? "날짜 미상";
  const amount = `${formatNumber(row.originalAmount)}원`;
  const actual =
    row.bonusPoints !== undefined
      ? `${actualGradeLabel(row)}(${formatNumber(actualPointsTotal(row))}P)`
      : row.pointType || "등급 미상";
  const expected = row.expectedPointType ?? "L5";
  const diff = `${formatNumber(Math.max(0, row.difference ?? 0))}P`;
  return `- ${date} / ${row.merchantName} / ${amount} / 실제 ${actual} → ${expected} 예상 / 차이 ${diff}`;
}

/** An unsupported grade has no estimate, so the line only asks for a check. */
function checkRequestLine(row: AnalysisResult): string {
  const date = row.transactionDate ?? row.postingDate ?? "날짜 미상";
  const amount = `${formatNumber(row.originalAmount)}원`;
  return `- ${date} / ${row.merchantName} / ${amount} / 실제 ${row.pointType || "등급 미상"} → 특별적립 대상 여부 확인 요청`;
}

function gradeGuide(profile: CardProfile): string {
  return `해외 ${profile.overseasGrade}, 국내 ${profile.domesticGrade}`;
}

/**
 * Builds the copyable Shinhan inquiry message from the currently included
 * rows (missing_suspected plus user-included review rows). Rows are grouped
 * by card when one export holds both cards' grades; included rows with an
 * unsupported grade are listed as check requests without points.
 */
export function buildInquiryMessage(includedRows: AnalysisResult[]): string {
  if (includedRows.length === 0) {
    return "";
  }

  const checkRows = includedRows.filter((row) => row.unsupportedGrade);
  const cardRows = includedRows.filter((row) => !row.unsupportedGrade);
  if (cardRows.length === 0) {
    return [
      "안녕하세요. 신한 메리어트 본보이 카드 포인트 적립 관련 문의드립니다.",
      "",
      "포인트 적립 상세내역을 확인해보니, 메리어트 계열 호텔 결제 건으로 보이는 일부 거래의 적립 등급을 확인하기 어렵습니다.",
      "",
      "아래 거래들이 특별적립 대상인지 확인 부탁드립니다.",
      "",
      ...checkRows.map(checkRequestLine),
      "",
      "해당 거래들의 적립 등급과 포인트 재산정 가능 여부 확인 부탁드립니다.",
    ].join("\n");
  }

  const groups = cardProfiles
    .map((profile) => ({
      profile,
      rows: cardRows.filter((row) => profileOf(row) === profile),
    }))
    .filter((group) => group.rows.length > 0);
  const [onlyGroup] = groups;
  const guide =
    groups.length === 1
      ? onlyGroup.profile === activeCardProfile
        ? gradeGuide(onlyGroup.profile)
        : `${onlyGroup.profile.shortLabel}: ${gradeGuide(onlyGroup.profile)}`
      : groups
          .map(({ profile }) => `${profile.shortLabel}: ${gradeGuide(profile).replace(", ", "·")}`)
          .join(" / ");
  const lines =
    groups.length === 1
      ? onlyGroup.rows.map(inquiryLine)
      : groups.flatMap(({ profile, rows }, index) => [
          ...(index > 0 ? [""] : []),
          `[${profile.label}]`,
          ...rows.map(inquiryLine),
        ]);

  const checkLines =
    checkRows.length > 0
      ? ["", "[적립 등급 확인 요청]", ...checkRows.map(checkRequestLine)]
      : [];

  const totalDifference = cardRows.reduce(
    (sum, row) => sum + Math.max(0, row.difference ?? 0),
    0
  );

  return [
    "안녕하세요. 신한 메리어트 본보이 카드 포인트 적립 관련 문의드립니다.",
    "",
    `포인트 적립 상세내역을 확인해보니, 메리어트 계열 호텔 결제 건으로 보이는 일부 거래가 정상 특별적립 등급(${guide})이 아닌 등급으로 적립된 것으로 확인됩니다.`,
    "",
    "아래 거래들이 특별적립 대상인지 재확인 부탁드립니다.",
    "",
    ...lines,
    ...checkLines,
    "",
    `현재 내역 기준으로는 총 ${formatNumber(totalDifference)}포인트가 덜 적립된 것으로 보입니다.`,
    ...(checkRows.length > 0
      ? [`(적립 등급을 확인하지 못한 ${formatNumber(checkRows.length)}건은 포인트 차이에서 제외했습니다.)`]
      : []),
    "",
    "해당 거래들의 적립 등급과 포인트 재산정 가능 여부 확인 부탁드립니다.",
  ].join("\n");
}
