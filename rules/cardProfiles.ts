/**
 * Shinhan Marriott Bonvoy card accrual profiles.
 *
 * Statement grade codes (포인트종류상세), per the card's accrual tiers:
 * - L1: 기본 적립 (1P / 1,000원)
 * - L2: 해외 매출 적립 (3P / 1,000원)
 * - L3: 특별 적립 업종 — 항공/택시/카페 등 (3P / 1,000원)
 * - L4: 국내 메리어트 결제 적립 (5P / 1,000원)
 * - L5: 해외 메리어트 결제 적립 (5P / 1,000원)
 *
 * Points are Marriott Bonvoy points, credited per 1,000 KRW of eligible
 * amount, rounded: round(amount / 1000 × pointsPer1000).
 */
export interface CardProfile {
  id: "the_best" | "the_classic";
  label: string;
  /** Marriott-hotel special accrual points per 1,000 KRW. */
  marriottPointsPer1000: number;
  /** Statement grade for domestic Marriott special accrual. */
  domesticGrade: string;
  /** Statement grade for overseas Marriott special accrual. */
  overseasGrade: string;
  /** Grade seen when a domestic Marriott payment fell back to base accrual. */
  domesticFallbackGrade: string;
  /** Grade seen when an overseas Marriott payment fell back to overseas accrual. */
  overseasFallbackGrade: string;
}

export const theBestProfile: CardProfile = {
  id: "the_best",
  label: "메리어트 본보이™ 더 베스트 신한카드",
  marriottPointsPer1000: 5,
  domesticGrade: "L4",
  overseasGrade: "L5",
  domesticFallbackGrade: "L1",
  overseasFallbackGrade: "L2",
};

/**
 * 더 클래식 (미지원): 메리어트 적립이 4P/1,000원으로 더 베스트와 다르다.
 * 클래식 명세서의 등급 코드 체계가 확인되면 프로필을 추가하고 카드 선택
 * UI를 붙이는 것으로 확장한다.
 */
export const activeCardProfile: CardProfile = theBestProfile;
