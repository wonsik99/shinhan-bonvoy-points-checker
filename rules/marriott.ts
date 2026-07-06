import type { MerchantRule } from "@/types/transaction";

export const marriottKeywords = [
  "MARRIOTT",
  "COURTYARD",
  "FAIRFIELD",
  "TOWNEPLACE",
  "RESIDENCE INN",
  "SPRINGHILL",
  "SHERATON",
  "WESTIN",
  "JW MARRIOTT",
  "AUTOGRAPH",
  "ALOFT",
  "AC HOTEL",
  "MOXY",
  "ELEMENT",
  "FOUR POINTS",
  "RITZ",
  "ST REGIS",
  "ST. REGIS",
  "W HOTEL",
  "LE MERIDIEN",
  "TRIBUTE",
  "EDITION",
  "GAYLORD",
  "POSTCARD CABINS",
  "TIAD",
];

export const knownMerchantRules: MerchantRule[] = [
  {
    pattern: "TIAD",
    normalizedName: "TIAD, Autograph Collection",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "TIAD is a known Autograph Collection hotel.",
  },
  {
    pattern: "POSTCARD CABINS",
    normalizedName: "Postcard Cabins / Outdoor Collection by Marriott Bonvoy",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "Postcard Cabins is associated with Marriott Bonvoy Outdoor Collection.",
  },
  {
    pattern: "HOTEL CLEVELAND",
    normalizedName: "Hotel Cleveland, Autograph Collection",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "Known Marriott Autograph Collection property.",
  },
  {
    pattern: "HOTEL 55 CHICAGO",
    normalizedName: "Hotel 55 Chicago",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason: "Hotel-like merchant with prior user suspicion; needs confirmation.",
  },
];

export const hotelLikeKeywords = [
  "HOTEL",
  "INN",
  "SUITES",
  "LODGE",
  "RESORT",
  "CABINS",
];

/**
 * Korean brand keywords for DOMESTIC Marriott-family merchants.
 * Domestic acquiring shows Korean merchant names (e.g. 코트야드메리어트서울남대문)
 * and typically accrues as L4 (특별적립), not L5 — analysis treats these as a
 * separate domestic path with a conservative expected rate.
 */
export const koreanMarriottKeywords = [
  "메리어트",
  "매리어트",
  "코트야드",
  "페어필드",
  "타운플레이스",
  "레지던스인",
  "스프링힐",
  "쉐라톤",
  "셰라톤",
  "웨스틴",
  "알로프트",
  "목시",
  "포포인츠",
  "리츠칼튼",
  "리츠 칼튼",
  "세인트레지스",
  "르메르디앙",
  "르 메르디앙",
  "오토그래프",
  "트리뷰트",
  "에디션",
];

/** Known domestic Marriott-family properties whose names carry no brand keyword. */
export const koreanKnownMerchantRules: MerchantRule[] = [
  {
    pattern: "조선팰리스",
    normalizedName: "조선 팰리스 서울 강남, 럭셔리 컬렉션",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "조선 팰리스는 Marriott 럭셔리 컬렉션 호텔입니다.",
  },
  {
    pattern: "그래비티",
    normalizedName: "그래비티 서울 판교, 오토그래프 컬렉션",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "그래비티 서울 판교는 Marriott 오토그래프 컬렉션 호텔입니다.",
  },
  {
    pattern: "라이즈",
    normalizedName: "라이즈, 오토그래프 컬렉션 (홍대)",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "라이즈(RYSE)는 Marriott 오토그래프 컬렉션 호텔이지만, 상호가 짧아 다른 가맹점과 겹칠 수 있어 확인이 필요합니다.",
  },
];
