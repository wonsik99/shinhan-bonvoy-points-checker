/**
 * Shinhan Marriott Bonvoy card accrual profiles.
 *
 * Statement grade codes (포인트종류상세), per 1,000 KRW of eligible amount,
 * rounded: round(amount / 1000 × pointsPer1000).
 *
 * 메리어트 본보이™ 더 베스트 신한카드 (L grades):
 * - L1: 기본 적립 (1P)
 * - L2: 해외 매출 적립 (3P)
 * - L3: 특별 적립 업종 — 항공/택시/카페 등 (3P)
 * - L4: 국내 메리어트 결제 적립 (5P)
 * - L5: 해외 메리어트 결제 적립 (5P)
 *
 * 메리어트 본보이™ 더 클래식 신한카드 (C grades, confirmed by a cardholder):
 * - C1: 일반 적립, domestic and overseas alike (1P)
 * - C2: 국내 메리어트 결제 적립 (4P)
 * - C3: 해외 메리어트 결제 적립 (4P)
 * - C4: 전월 200만 원 이상 이용 시 추가 적립 on C1 purchases (0.5P);
 *   special accrual never stacks with it.
 */
export interface CardProfile {
  id: "the_best" | "the_classic";
  label: string;
  shortLabel: string;
  /** Statement grade prefix that identifies this card's rows. */
  gradePrefix: "L" | "C";
  /** Marriott-hotel special accrual points per 1,000 KRW. */
  marriottPointsPer1000: number;
  /** Statement grade for domestic Marriott special accrual. */
  domesticGrade: string;
  /** Statement grade for overseas Marriott special accrual. */
  overseasGrade: string;
  /** Grade seen when a domestic Marriott payment fell back to base accrual. */
  domesticFallbackGrade: string;
  /** Grade seen when an overseas Marriott payment fell back to its base accrual. */
  overseasFallbackGrade: string;
  /** Separate statement line that tops up a base-accrual payment. */
  bonusGrade?: string;
  /** Every statement grade this profile defines. */
  knownGrades: readonly string[];
}

export const theBestProfile: CardProfile = {
  id: "the_best",
  label: "메리어트 본보이™ 더 베스트 신한카드",
  shortLabel: "더 베스트",
  gradePrefix: "L",
  marriottPointsPer1000: 5,
  domesticGrade: "L4",
  overseasGrade: "L5",
  domesticFallbackGrade: "L1",
  overseasFallbackGrade: "L2",
  knownGrades: ["L1", "L2", "L3", "L4", "L5"],
};

export const theClassicProfile: CardProfile = {
  id: "the_classic",
  label: "메리어트 본보이™ 더 클래식 신한카드",
  shortLabel: "더 클래식",
  gradePrefix: "C",
  marriottPointsPer1000: 4,
  domesticGrade: "C2",
  overseasGrade: "C3",
  domesticFallbackGrade: "C1",
  overseasFallbackGrade: "C1",
  bonusGrade: "C4",
  knownGrades: ["C1", "C2", "C3", "C4"],
};

export const cardProfiles: readonly CardProfile[] = [
  theBestProfile,
  theClassicProfile,
];

/**
 * Default profile for rows without a recognizable grade code (blank cells or
 * free text), preserving the original The Best behavior for those rows.
 */
export const activeCardProfile: CardProfile = theBestProfile;

const GRADE_CODE = /^[A-Z]\d+$/;

/**
 * Picks the card profile from the row's own statement grade, so one export
 * holding both cards is analyzed row by row. Returns undefined for a code no
 * supported card defines (e.g. C5, X1): its accrual rate is unknown.
 */
export function cardProfileForGrade(grade: string): CardProfile | undefined {
  if (!GRADE_CODE.test(grade)) {
    return activeCardProfile;
  }
  return cardProfiles.find((profile) => profile.knownGrades.includes(grade));
}

export function cardProfileById(
  id: CardProfile["id"] | undefined
): CardProfile | undefined {
  return cardProfiles.find((profile) => profile.id === id);
}
