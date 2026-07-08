import { describe, expect, it } from "vitest";
import { classifyMerchant, normalizeMerchantName } from "@/lib/classifyMerchant";
import {
  americasMarriottProperties,
  asiaPacificMarriottProperties,
  chinaMarriottProperties,
  europeMarriottProperties,
  koreaMarriottProperties,
  marriottBrandCatalog,
  marriottProperties,
  middleEastAfricaMarriottProperties,
  unitedStatesMarriottProperties,
} from "@/rules/marriott";
import type { MarriottProperty } from "@/rules/marriott";

function compactAlias(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toUpperCase()
    .replace(/\s+/g, "");
}

function isAsciiAlias(value: string): boolean {
  return /^[\x00-\x7F]+$/.test(value);
}

const shortAsciiContainsAllowlist = new Set(["LESCAPE"]);

const propertySeedExpectations: Array<{
  countryName: string;
  properties: MarriottProperty[];
  count: number;
  region: "domestic" | "overseas";
}> = [
  {
    countryName: "Korea",
    properties: koreaMarriottProperties,
    count: 41,
    region: "domestic",
  },
  {
    countryName: "Asia-Pacific",
    properties: asiaPacificMarriottProperties,
    count: 768,
    region: "overseas",
  },
  {
    countryName: "Europe",
    properties: europeMarriottProperties,
    count: 1042,
    region: "overseas",
  },
  {
    countryName: "Americas",
    properties: americasMarriottProperties,
    count: 866,
    region: "overseas",
  },
  {
    countryName: "Middle East & Africa",
    properties: middleEastAfricaMarriottProperties,
    count: 333,
    region: "overseas",
  },
  {
    countryName: "China",
    properties: chinaMarriottProperties,
    count: 790,
    region: "overseas",
  },
  {
    countryName: "United States",
    properties: unitedStatesMarriottProperties,
    count: 6308,
    region: "overseas",
  },
];

describe("normalizeMerchantName", () => {
  it("uppercases, trims, and collapses spaces", () => {
    expect(normalizeMerchantName("  fairfield   inn  ")).toBe("FAIRFIELD INN");
  });
});

describe("classifyMerchant", () => {
  it("tracks the 39 official Marriott Bonvoy brand and collection entries", () => {
    expect(marriottBrandCatalog).toHaveLength(39);
    expect(marriottBrandCatalog.map((brand) => brand.officialName)).toEqual([
      "The Ritz-Carlton",
      "St. Regis",
      "JW Marriott",
      "The Ritz-Carlton Reserve",
      "The Luxury Collection",
      "W Hotels",
      "EDITION",
      "Marriott Hotels",
      "Sheraton",
      "The Marriott Vacation Clubs",
      "Delta Hotels by Marriott",
      "Westin",
      "Le Méridien",
      "Renaissance Hotels",
      "Gaylord Hotels",
      "Courtyard",
      "Four Points",
      "SpringHill Suites",
      "Fairfield by Marriott",
      "AC Hotels",
      "citizenM",
      "Aloft Hotels",
      "Moxy Hotels",
      "Protea Hotels",
      "City Express",
      "Four Points Flex by Sheraton",
      "Series by Marriott",
      "Residence Inn",
      "TownePlace Suites",
      "Element Hotels",
      "StudioRes",
      "Homes & Villas by Marriott Bonvoy",
      "Apartments by Marriott Bonvoy",
      "Marriott Executive Apartments",
      "Autograph Collection",
      "Design Hotels",
      "Tribute Portfolio",
      "MGM Collection with Marriott Bonvoy",
      "Outdoor Collection by Marriott Bonvoy",
    ]);
  });

  it.each(marriottBrandCatalog.map((brand) => brand.officialName))(
    "classifies official Marriott brand names as Marriott keywords (%s)",
    (name) => {
      const result = classifyMerchant(name);
      expect(result.isLikelyMarriott).toBe(true);
      expect(result.confidence).toBe("certain");
      expect(result.status).toBe("active");
      expect(result.region).toBe("overseas");
    }
  );

  it.each(propertySeedExpectations)(
    "keeps the $countryName Marriott property seed at $count hotels",
    ({ properties, count }) => {
      expect(properties).toHaveLength(count);
    }
  );

  it("does not register duplicate property aliases after normalization", () => {
    const seen = new Map<string, string>();
    for (const property of marriottProperties) {
      for (const alias of property.aliases) {
        const key = compactAlias(alias.value);
        const owner = seen.get(key);
        expect(
          owner,
          `${alias.value} is duplicated by ${property.id}; already used by ${owner}`
        ).toBeUndefined();
        seen.set(key, property.id);
      }
    }
  });

  it("does not use overly short ASCII contains aliases", () => {
    for (const property of marriottProperties) {
      for (const alias of property.aliases) {
        const match = alias.match ?? "contains";
        if (match !== "contains" || !isAsciiAlias(alias.value)) {
          continue;
        }
        if (shortAsciiContainsAllowlist.has(compactAlias(alias.value))) {
          continue;
        }
        expect(
          compactAlias(alias.value).length,
          `${property.id} has an overly short contains alias: ${alias.value}`
        ).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("does not derive base aliases shared by multiple official names", () => {
    const baseAliasCounts = new Map<string, number>();
    for (const property of propertySeedExpectations.flatMap(
      ({ properties }) => properties
    )) {
      const baseName = property.officialName.split(",")[0]?.trim();
      if (!baseName || baseName === property.officialName) {
        continue;
      }
      const key = compactAlias(baseName);
      baseAliasCounts.set(key, (baseAliasCounts.get(key) ?? 0) + 1);
    }

    for (const property of marriottProperties) {
      const ambiguousBaseAliases = property.aliases
        .map((alias) => alias.value)
        .filter((alias) => (baseAliasCounts.get(compactAlias(alias)) ?? 0) > 1);
      expect(
        ambiguousBaseAliases,
        `${property.id} must not register non-unique derived base aliases`
      ).toEqual([]);
    }
  });

  it.each(propertySeedExpectations)(
    "classifies all seeded $countryName Marriott official names as Marriott-related",
    ({ properties, region }) => {
      for (const property of properties) {
        const result = classifyMerchant(property.officialName);
        expect(
          result.isLikelyMarriott || result.status === "needs_review",
          property.officialName
        ).toBe(true);
        expect(result.region, property.officialName).toBe(region);
      }
    }
  );

  it.each([
    "Yoruya",
    "The Chapter Kyoto",
    "Hotel Koo Otsu Hyakucho",
    "SOIL Nagatoyumoto",
    "THE OSAKA STATION HOTEL",
    "Bvlgari Hotel Tokyo",
  ])("catches Japan property base aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("overseas");
  });

  it.each([
    "W Bangkok",
    "Sheraton Grande Sukhumvit",
    "The Athenee Hotel",
    "Renaissance Phuket",
    "JW Marriott Phuket",
  ])("catches Thailand representative property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("overseas");
  });

  it.each([
    "Genting Hotel Jurong",
    "Legacy Mekong",
    "Hotel Proverbs Taipei",
    "The Farm at San Benito",
    "The Majestic Hotel Kuala Lumpur",
    "Mandapa",
  ])("catches expanded Asia-Pacific property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("overseas");
  });

  it.each([
    "The Rome EDITION",
    "W Rome",
    "Bvlgari Hotel Milano",
    "Bulgari Hotel Roma",
    "Milan Marriott Hotel",
    "Ortea Luxury Palace Rec",
    "Mangia's Sardinia Resort",
    "Grand Universe Lucca",
    "AC Hotel Torino",
    "Inn Naples Airport",
  ])("catches Italy representative property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("overseas");
  });

  it.each([
    "Hotel Imperial",
    "The Dixon",
    "Cotton House Hotel",
    "Hôtel du Couvent",
    "Moxy Paris Val d’Europe",
    "JW Marriott Hotel Berlin",
  ])("catches Europe representative property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("overseas");
  });

  it.each([
    "W Sydney",
    "ITC Mughal",
    "JW Marriott Maldives Resort",
    "Kathmandu Marriott Hotel",
    "Courtyard by Marriott Phnom Penh",
    "Sheraton Samoa Aggie Grey's Hotel",
    "The St. Regis Bora Bora Resort",
    "Fairfield by Marriott Altay Fuhai",
    "TownePlace Suites by Marriott Aberdeen",
    "Residence Inn by Marriott Yuma",
  ])("catches large-country property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("overseas");
  });

  it.each([
    "JW Marriott Hotel Mexico City Polanco",
    "The St. Regis Toronto",
    "Aloft by Marriott San Juan",
    "JW Marriott Marquis Hotel Dubai",
    "The St. Regis Doha",
    "Protea Hotel Cape Town Waterfront Breakwater Lodge",
  ])("catches worldwide expansion representative property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("overseas");
  });

  it.each([
    "COURTYARD BY MARRIOTT",
    "FAIRFIELD INN ANN ARBO",
    "FAIRFIELD INN & SUITES",
    "FAIRFIELD BELLE VERNON",
    "TOWNEPLACE SUITES GENE",
    "RENAISSANCE OKINAWA",
    "DELTA HOTELS BY MARRIOTT",
    "CITIZENM NEW YORK",
    "PROTEA HOTEL CAPE TOWN",
    "CITY EXPRESS CANCUN",
    "STUDIORES FORT MYERS",
    "MGM COLLECTION LAS VEGAS",
    "OUTDOOR COLLECTION BY MARRIOTT",
  ])("classifies %s as certain Marriott", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("certain");
    expect(result.status).toBe("active");
  });

  it.each(["TIAD", "POSTCARD CABINS THE TH", "HOTEL CLEVELAND"])(
    "classifies %s as high-confidence Marriott via known rules",
    (name) => {
      const result = classifyMerchant(name);
      expect(result.isLikelyMarriott).toBe(true);
      expect(result.confidence).toBe("high");
      expect(result.status).toBe("active");
      expect(result.normalizedName).toBeTruthy();
    }
  );

  it("classifies HOTEL 55 CHICAGO as medium needs_review", () => {
    const result = classifyMerchant("HOTEL 55 CHICAGO");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("medium");
    expect(result.status).toBe("needs_review");
  });

  it("classifies ZIPPY AUTO WASH - ELLSWO as not Marriott", () => {
    const result = classifyMerchant("ZIPPY AUTO WASH - ELLSWO");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });

  it("sends unknown hotel-like merchants to low-confidence review", () => {
    const result = classifyMerchant("GRAND SUNRISE HOTEL BUSAN");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("low");
    expect(result.status).toBe("needs_review");
  });

  it("does not treat INN inside another word as hotel-like", () => {
    const result = classifyMerchant("DINNER HOUSE SEOUL");
    expect(result.confidence).toBe("none");
  });

  it.each([
    ["FRITZ BURGER CO", "RITZ"],
    ["EXPEDITION SUPPLY", "EDITION"],
    ["ELEMENTARY BOOKS", "ELEMENT"],
  ])("does not match brand keywords inside longer words (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });

  it("does not treat VIEW HOTEL as W HOTEL; falls back to hotel-like review", () => {
    const result = classifyMerchant("VIEW HOTEL SEOUL");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("low");
    expect(result.status).toBe("needs_review");
  });

  it("still matches brand keywords at word boundaries", () => {
    expect(classifyMerchant("THE RITZ-CARLTON SEOUL").confidence).toBe("certain");
    expect(classifyMerchant("ST. REGIS NEW YORK").confidence).toBe("certain");
    expect(classifyMerchant("W HOTEL HOLLYWOOD").confidence).toBe("certain");
  });

  it.each([
    "코트야드메리어트서울남대문",
    "제이더블유메리어트호텔",
    "웨스틴조선서울",
    "알로프트서울명동",
    "(주)목시서울인사동",
  ])("classifies domestic Korean Marriott merchants (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("certain");
    expect(result.region).toBe("domestic");
  });

  it("classifies 조선팰리스 via domestic known rules", () => {
    const result = classifyMerchant("조선팰리스서울강남");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
  });

  it("marks overseas English matches as overseas region", () => {
    expect(classifyMerchant("COURTYARD BY MARRIOTT").region).toBe("overseas");
  });

  it("does not flag ordinary Korean merchants", () => {
    expect(classifyMerchant("스타벅스 강남점").confidence).toBe("none");
    expect(classifyMerchant("네이버페이").confidence).toBe("none");
  });

  it("matches Korean brand names regardless of spacing", () => {
    expect(classifyMerchant("웨스틴 조선 서울").region).toBe("domestic");
    expect(classifyMerchant("웨스틴조선서울").region).toBe("domestic");
    expect(classifyMerchant("조선 팰리스 서울 강남").confidence).toBe("high");
    expect(classifyMerchant("조선팰리스강남").confidence).toBe("high");
  });

  it("detects AC 호텔 (Korean form) as domestic Marriott", () => {
    const result = classifyMerchant("AC호텔 서울 강남");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("domestic");
  });

  it.each([
    ["호텔 오노마 대전", "오노마"],
    ["더 플라자", "더플라자"],
    ["더 링크", "더링크"],
  ])("surfaces new Korean collection hotels for review (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.status).toBe("needs_review");
    expect(result.confidence).toBe("medium");
    expect(result.region).toBe("domestic");
  });

  it("does NOT treat 그랜드 조선 as Marriott (독립 브랜드)", () => {
    expect(classifyMerchant("그랜드 조선 부산").isLikelyMarriott).toBe(false);
    expect(classifyMerchant("그랜드 조선 제주").confidence).toBe("none");
  });

  it("surfaces Nest Hotel (Design Hotels member) for review", () => {
    const result = classifyMerchant("네스트호텔 인천");
    expect(result.status).toBe("needs_review");
    expect(result.region).toBe("domestic");
  });

  it.each([
    "L ESCAPE SEOUL MYEONGDONG",
    "LESCAPE SEOUL",
    "레스케이프 서울 명동",
    "JOSUN PALACE SEOUL GANGNAM",
    "THE PLAZA SEOUL",
    "더플라자서울",
    "더 링크 서울",
  ])("catches short Korea property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("domestic");
  });

  it.each(["THE PLAZA", "THE LINK", "NEST HOTEL INCHEON"])(
    "keeps ambiguous short property aliases in review (%s)",
    (name) => {
      const result = classifyMerchant(name);
      expect(result.status).toBe("needs_review");
      expect(result.confidence).toBe("medium");
      expect(result.region).toBe("domestic");
    }
  );

  it("does not treat RYSE inside a longer English word as the hotel", () => {
    expect(classifyMerchant("RYSEUP CAFE").confidence).toBe("none");
  });

  it("surfaces the 신세계조선호텔 operator name for review", () => {
    const result = classifyMerchant("(주)신세계조선호텔");
    expect(result.status).toBe("needs_review");
    expect(result.confidence).toBe("medium");
  });

  it("does not let the operator rule downgrade a specific-brand match", () => {
    // 웨스틴조선호텔 must still be certain via the 웨스틴 keyword, not
    // needs_review via the operator rule.
    const result = classifyMerchant("웨스틴조선호텔 서울");
    expect(result.confidence).toBe("certain");
    expect(result.region).toBe("domestic");
  });

  it("no longer false-matches 에디션 in ordinary Korean merchants", () => {
    expect(classifyMerchant("나이키 특별에디션 스토어").confidence).toBe("none");
  });

  it("handles empty merchant names", () => {
    const result = classifyMerchant("   ");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });
});
