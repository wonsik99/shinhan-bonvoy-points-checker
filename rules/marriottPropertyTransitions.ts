export interface MarriottPropertyTransition {
  propertyCode: string;
  officialName: string;
  aliases: readonly string[];
  excludedAliases?: readonly string[];
  /** Inclusive last Marriott operating day, only when explicitly sourced. */
  lastMarriottOperatingDate?: string;
  reason: string;
  reviewedAt: string;
  evidenceUrls: readonly string[];
}

/**
 * Current affiliation conflicts, not deletions of historical property records.
 * Unknown transition dates deliberately remain unknown; a crawl date is not an
 * affiliation end date. These rules never activate a new hotel or alias.
 */
export const marriottPropertyTransitions: readonly MarriottPropertyTransition[] = [
  {
    propertyCode: "MIAWS",
    officialName: "W South Beach",
    aliases: ["W SOUTH BEACH", "W HOTEL SOUTH BEACH"],
    lastMarriottOperatingDate: "2026-08-19",
    reason: "소유주 공식 안내에 Marriott의 마지막 운영일이 2026-08-19로 명시되어 있습니다.",
    reviewedAt: "2026-10-03",
    evidenceUrls: ["https://2201collins.org/"],
  },
  {
    propertyCode: "ATLBH",
    officialName: "Residence Inn by Marriott Atlanta Buckhead",
    aliases: [
      "RESIDENCE INN BY MARRIOTT ATLANTA BUCKHEAD",
      "RESIDENCE INN ATLANTA BUCKHEAD",
    ],
    // ATLLP is a different property. Its identifying old alias must survive.
    excludedAliases: ["LENOX PARK"],
    reason: "기존 ATLBH 주소의 현재 운영사 공식 사이트는 Fusion Buckhead 아파트로 안내합니다. 같은 호텔명을 사용하는 ATLLP와 구분 및 Marriott 제휴 전환일 확인이 필요합니다.",
    reviewedAt: "2026-10-03",
    evidenceUrls: [
      "https://www.fusionbuckheadapts.com/",
      "https://www.marriott.com/hotels/travel/atlbh-residence-inn-atlanta-buckhead/",
    ],
  },
  {
    propertyCode: "DAYLM",
    officialName: "Fairfield by Marriott Inn & Suites Lima",
    aliases: [
      "FAIRFIELD BY MARRIOTT INN & SUITES LIMA",
      "FAIRFIELD INN & SUITES LIMA",
    ],
    reason: "기존 호텔과 주소·전화가 일치하는 현재 Choice 공식 페이지는 Comfort Inn & Suites Lima Northwest로 안내합니다. Marriott 제휴 전환일 확인이 필요합니다.",
    reviewedAt: "2026-10-03",
    evidenceUrls: [
      "https://www.choicehotels.com/ohio/lima/comfort-inn-hotels/oh957",
      "https://www.marriott.com/hotels/travel/daylm-fairfield-inn-and-suites-lima/",
    ],
  },
  {
    propertyCode: "JANCY",
    officialName: "Courtyard by Marriott Jackson Ridgeland",
    aliases: ["COURTYARD BY MARRIOTT JACKSON RIDGELAND", "COURTYARD JACKSON RIDGELAND"],
    reason: "기존 호텔 주소의 현재 Choice 공식 페이지는 Comfort Inn Jackson North - Ridgeland로 안내합니다. 전화번호는 달라졌으며 Marriott 제휴 전환일 확인이 필요합니다.",
    reviewedAt: "2026-10-03",
    evidenceUrls: [
      "https://www.choicehotels.com/en-uk/mississippi/jackson/comfort-inn-hotels/ms502",
      "https://www.marriott.com/en-us/hotels/jancy-courtyard-jackson-ridgeland/events/",
    ],
  },
  {
    propertyCode: "OKCCA",
    officialName: "Courtyard by Marriott Oklahoma City Airport",
    aliases: ["COURTYARD BY MARRIOTT OKLAHOMA CITY AIRPORT", "COURTYARD OKLAHOMA CITY AIRPORT"],
    reason: "기존 호텔과 주소·전화가 일치하는 현재 Best Western 공식 페이지는 SureStay Plus by Best Western Oklahoma City Airport로 안내합니다. Marriott 제휴 전환일 확인이 필요합니다.",
    reviewedAt: "2026-10-03",
    evidenceUrls: [
      "https://www.bestwestern.com/en_US/book/hotels-in-oklahoma-city/surestay-plus-by-best-western-oklahoma-city-airport/propertyCode.54330.html",
      "https://www.hotel-development.marriott.com/resourcefiles/fdd-document/2023-courtyard-fdd-3-31-2023.pdf",
    ],
  },
];
