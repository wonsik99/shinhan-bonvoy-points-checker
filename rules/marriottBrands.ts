export type MarriottBrandCategory =
  | "luxury"
  | "premium"
  | "select"
  | "longer_stays"
  | "collections";

export interface MarriottBrandEntry {
  officialName: string;
  category: MarriottBrandCategory;
  keywords: readonly string[];
}

export const marriottBrandCatalog = [
  {
    officialName: "The Ritz-Carlton",
    category: "luxury",
    keywords: ["RITZ-CARLTON", "RITZ CARLTON", "RITZ"],
  },
  {
    officialName: "St. Regis",
    category: "luxury",
    keywords: ["ST REGIS", "ST. REGIS"],
  },
  {
    officialName: "JW Marriott",
    category: "luxury",
    keywords: ["JW MARRIOTT"],
  },
  {
    officialName: "The Ritz-Carlton Reserve",
    category: "luxury",
    keywords: ["RITZ-CARLTON RESERVE", "RITZ CARLTON RESERVE"],
  },
  {
    officialName: "The Luxury Collection",
    category: "luxury",
    keywords: ["LUXURY COLLECTION", "THE LUXURY COLLECTION"],
  },
  {
    officialName: "W Hotels",
    category: "luxury",
    keywords: ["W HOTEL", "W HOTELS"],
  },
  {
    officialName: "EDITION",
    category: "luxury",
    keywords: ["EDITION", "EDITION HOTELS"],
  },
  {
    officialName: "Marriott Hotels",
    category: "premium",
    keywords: ["MARRIOTT", "MARRIOTT HOTELS"],
  },
  {
    officialName: "Sheraton",
    category: "premium",
    keywords: ["SHERATON"],
  },
  {
    officialName: "The Marriott Vacation Clubs",
    category: "premium",
    keywords: ["MARRIOTT VACATION CLUB", "MARRIOTT VACATION CLUBS", "MAVC"],
  },
  {
    officialName: "Delta Hotels by Marriott",
    category: "premium",
    keywords: [
      "DELTA HOTEL",
      "DELTA HOTELS",
      "DELTA HOTEL BY MARRIOTT",
      "DELTA HOTELS BY MARRIOTT",
    ],
  },
  {
    officialName: "Westin",
    category: "premium",
    keywords: ["WESTIN"],
  },
  {
    officialName: "Le Méridien",
    category: "premium",
    keywords: ["LE MERIDIEN"],
  },
  {
    officialName: "Renaissance Hotels",
    category: "premium",
    keywords: ["RENAISSANCE", "RENAISSANCE HOTEL", "RENAISSANCE HOTELS"],
  },
  {
    officialName: "Gaylord Hotels",
    category: "premium",
    keywords: ["GAYLORD", "GAYLORD HOTEL", "GAYLORD HOTELS"],
  },
  {
    officialName: "Courtyard",
    category: "select",
    keywords: ["COURTYARD", "COURTYARD BY MARRIOTT"],
  },
  {
    officialName: "Four Points",
    category: "select",
    keywords: ["FOUR POINTS", "FOUR POINTS BY SHERATON"],
  },
  {
    officialName: "SpringHill Suites",
    category: "select",
    keywords: ["SPRINGHILL", "SPRINGHILL SUITES"],
  },
  {
    officialName: "Fairfield by Marriott",
    category: "select",
    keywords: ["FAIRFIELD", "FAIRFIELD BY MARRIOTT", "FAIRFIELD INN"],
  },
  {
    officialName: "AC Hotels",
    category: "select",
    keywords: ["AC HOTEL", "AC HOTELS", "AC HOTELS BY MARRIOTT"],
  },
  {
    officialName: "citizenM",
    category: "select",
    keywords: ["CITIZENM", "CITIZEN M"],
  },
  {
    officialName: "Aloft Hotels",
    category: "select",
    keywords: ["ALOFT", "ALOFT HOTEL", "ALOFT HOTELS"],
  },
  {
    officialName: "Moxy Hotels",
    category: "select",
    keywords: ["MOXY", "MOXY HOTEL", "MOXY HOTELS"],
  },
  {
    officialName: "Protea Hotels",
    category: "select",
    keywords: ["PROTEA", "PROTEA HOTEL", "PROTEA HOTELS"],
  },
  {
    officialName: "City Express",
    category: "select",
    keywords: ["CITY EXPRESS", "CITY EXPRESS BY MARRIOTT"],
  },
  {
    officialName: "Four Points Flex by Sheraton",
    category: "select",
    keywords: ["FOUR POINTS FLEX", "FOUR POINTS FLEX BY SHERATON"],
  },
  {
    officialName: "Series by Marriott",
    category: "select",
    keywords: ["SERIES BY MARRIOTT"],
  },
  {
    officialName: "Residence Inn",
    category: "longer_stays",
    keywords: ["RESIDENCE INN"],
  },
  {
    officialName: "TownePlace Suites",
    category: "longer_stays",
    keywords: ["TOWNEPLACE", "TOWNEPLACE SUITES"],
  },
  {
    officialName: "Element Hotels",
    category: "longer_stays",
    keywords: ["ELEMENT", "ELEMENT HOTEL", "ELEMENT HOTELS"],
  },
  {
    officialName: "StudioRes",
    category: "longer_stays",
    keywords: ["STUDIORES", "STUDIO RES"],
  },
  {
    officialName: "Homes & Villas by Marriott Bonvoy",
    category: "longer_stays",
    keywords: [
      "HOMES & VILLAS",
      "HOMES AND VILLAS",
      "HOMES & VILLAS BY MARRIOTT",
      "HOMES AND VILLAS BY MARRIOTT",
    ],
  },
  {
    officialName: "Apartments by Marriott Bonvoy",
    category: "longer_stays",
    keywords: ["APARTMENTS BY MARRIOTT", "APARTMENTS BY MARRIOTT BONVOY"],
  },
  {
    officialName: "Marriott Executive Apartments",
    category: "longer_stays",
    keywords: [
      "MARRIOTT EXECUTIVE APARTMENTS",
      "EXECUTIVE APARTMENTS BY MARRIOTT",
    ],
  },
  {
    officialName: "Autograph Collection",
    category: "collections",
    keywords: ["AUTOGRAPH", "AUTOGRAPH COLLECTION"],
  },
  {
    officialName: "Design Hotels",
    category: "collections",
    keywords: ["DESIGN HOTEL", "DESIGN HOTELS"],
  },
  {
    officialName: "Tribute Portfolio",
    category: "collections",
    keywords: ["TRIBUTE", "TRIBUTE PORTFOLIO"],
  },
  {
    officialName: "MGM Collection with Marriott Bonvoy",
    category: "collections",
    keywords: ["MGM COLLECTION", "MGM COLLECTION WITH MARRIOTT BONVOY"],
  },
  {
    officialName: "Outdoor Collection by Marriott Bonvoy",
    category: "collections",
    keywords: [
      "OUTDOOR COLLECTION",
      "OUTDOOR COLLECTION BY MARRIOTT",
      "POSTCARD CABINS",
    ],
  },
] as const satisfies readonly MarriottBrandEntry[];

export const marriottKeywords = Array.from(
  new Set(marriottBrandCatalog.flatMap((brand) => brand.keywords))
);

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
 * and typically accrues as L4 (특별적립), not L5 - analysis treats these as a
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
  "AC호텔",
  "에이씨호텔",
  "리츠칼튼",
  "리츠 칼튼",
  "세인트레지스",
  "르메르디앙",
  "르 메르디앙",
  "메르디앙",
  "오토그래프",
  "트리뷰트",
  "럭셔리컬렉션",
  "럭셔리 컬렉션",
  "디자인호텔스",
  "디자인 호텔스",
];
