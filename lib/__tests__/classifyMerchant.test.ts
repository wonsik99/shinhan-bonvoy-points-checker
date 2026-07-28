import { describe, expect, it } from "vitest";
import {
  classifyMerchant,
  createPropertyAliasMatcher,
  createSharedMerchantRuleMatcher,
  normalizeMerchantName,
} from "@/lib/classifyMerchant";
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
import type {
  MarriottProperty,
  SharedMarriottMerchantRule,
} from "@/rules/marriott";

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
    expect(
      marriottBrandCatalog.find((brand) => brand.officialName === "W Hotels")
    ).toMatchObject({ contextualKeywords: ["W"] });
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

  it("keeps property ids and names non-empty and unique", () => {
    const ids = new Set<string>();
    for (const property of marriottProperties) {
      expect(property.id.trim()).not.toBe("");
      expect(property.officialName.trim()).not.toBe("");
      expect(ids.has(property.id), property.id).toBe(false);
      ids.add(property.id);
      for (const alias of property.aliases) {
        expect(alias.value.trim(), property.id).not.toBe("");
      }
    }
  });

  it("classifies every stored property alias in its configured region", () => {
    for (const property of marriottProperties) {
      const values = [
        ...(property.localName ? [property.localName] : []),
        ...property.aliases.map((alias) => alias.value),
      ];
      for (const value of values) {
        const result = classifyMerchant(value);
        expect(
          result.isLikelyMarriott || result.status === "needs_review",
          `${property.id}: ${value}`
        ).toBe(true);
        expect(result.region, `${property.id}: ${value}`).toBe(property.region);

        const storedAlias = property.aliases.find(
          (alias) => alias.value === value
        );
        if (storedAlias?.source === "explicit" && isAsciiAlias(value)) {
          expect(
            result.normalizedName,
            `${property.id}: explicit alias ${value} mapped to ${result.normalizedName}`
          ).toBe(property.officialName);
        }
      }
    }
  });

  it("classifies every configured brand keyword", () => {
    for (const brand of marriottBrandCatalog) {
      for (const keyword of brand.keywords) {
        const result = classifyMerchant(keyword);
        expect(result.isLikelyMarriott, `${brand.officialName}: ${keyword}`).toBe(
          true
        );
        expect(result.status, `${brand.officialName}: ${keyword}`).toBe("active");
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
        expect(
          result.normalizedName === property.officialName ||
            result.status === "needs_review",
          `${property.id}: official name mapped to ${result.normalizedName}`
        ).toBe(true);
      }
    },
    15_000
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

  it("keeps a shared China merchant linked to both Qingdao properties", () => {
    const result = classifyMerchant("QINGDAOQINGMAOIYEYOXINGON");

    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.status).toBe("active");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe(
      "Renaissance Qingdao Hotel / Element Qingdao"
    );
    expect(result.matchedPattern).toBe("QINGDAOQINGMAOIYEYOXINGON");
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

  it("classifies HOTEL CLEVELAND via property alias", () => {
    const result = classifyMerchant("HOTEL CLEVELAND");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.status).toBe("active");
    expect(result.normalizedName).toBe("Hotel Cleveland, Autograph Collection");
  });

  it("classifies TIAD via derived exact alias from jp seed", () => {
    const result = classifyMerchant("TIAD");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.normalizedName).toBe("TIAD, Autograph Collection");
  });

  it.each([
    ["MOXY SEOUL INSADONG", "Moxy Seoul Insadong"],
    [
      "FAIRFIELD BY MARRIOTT BUSAN SONGDO",
      "Fairfield by Marriott Busan Songdo Beach",
    ],
    [
      "COURTYARD BY MARRIOTT BANGKOK SUVARNABHUMI AIRPORT",
      "Courtyard by Marriott Bangkok Suvarnabhumi Airport",
    ],
    ["LE MERIDIEN TAIPEI BANQIAO", "Le Méridien Taipei Banqiao"],
    [
      "MYSTIQUE HOLBOX BY ROYALTON A TRIBUTE PORTFOLIO RESORT",
      "Mystique Holbox by Royalton, A Tribute Portfolio Resort",
    ],
    [
      "THE BROWN PALACE HOTEL AND SPA AUTOGRAPH COLLECTION",
      "The Brown Palace Hotel and Spa, Autograph Collection",
    ],
  ])(
    "selects the most specific property instead of the first broad match (%s)",
    (merchantName, expectedProperty) => {
      expect(classifyMerchant(merchantName)).toMatchObject({
        isLikelyMarriott: true,
        normalizedName: expectedProperty,
      });
    }
  );

  it("keeps a true same-priority property tie in review", () => {
    const result = classifyMerchant("COURTYARD BY MARRIOTT HAMILTON");

    expect(result).toMatchObject({
      isLikelyMarriott: true,
      confidence: "medium",
      status: "needs_review",
      region: "overseas",
    });
    expect(result.normalizedName).toBeUndefined();
    expect(result.reason).toContain("정확한 호텔 확인이 필요");
  });

  it("keeps property selection independent of source array order", () => {
    const broadProperty: MarriottProperty = {
      id: "broad-moxy",
      country: "KR",
      region: "domestic",
      officialName: "Moxy Seoul, Myeongdong",
      brand: "Moxy",
      aliases: [
        {
          value: "MOXY SEOUL",
          match: "contains",
          source: "derived",
        },
      ],
    };
    const specificProperty: MarriottProperty = {
      id: "specific-moxy",
      country: "KR",
      region: "domestic",
      officialName: "Moxy Seoul Insadong",
      brand: "Moxy",
      aliases: [
        {
          value: "MOXY SEOUL INSADONG",
          match: "contains",
          source: "explicit",
        },
      ],
    };
    const input = normalizeMerchantName("MOXY SEOUL INSADONG");

    for (const properties of [
      [broadProperty, specificProperty],
      [specificProperty, broadProperty],
    ]) {
      expect(createPropertyAliasMatcher(properties)(input)?.normalizedName).toBe(
        "Moxy Seoul Insadong"
      );
    }
  });

  it("handles multiple equal aliases for the same property deterministically", () => {
    const property: MarriottProperty = {
      id: "same-property",
      country: "KR",
      region: "domestic",
      officialName: "Alpha Hotel",
      brand: "Marriott Bonvoy",
      aliases: [
        {
          value: "ALPHA-MERCHANT",
          match: "contains",
          source: "explicit",
        },
        {
          value: "ALPHA MERCHANT",
          match: "contains",
          source: "explicit",
        },
      ],
    };

    expect(
      createPropertyAliasMatcher([property])(
        normalizeMerchantName("ALPHA MERCHANT")
      )
    ).toMatchObject({
      normalizedName: "Alpha Hotel",
      matchedPattern: "ALPHA MERCHANT",
    });
  });

  it("keeps a cross-region same-priority property tie in review", () => {
    const alpha: MarriottProperty = {
      id: "alpha",
      country: "KR",
      region: "domestic",
      officialName: "Alpha Hotel",
      brand: "Marriott Bonvoy",
      aliases: [
        {
          value: "ALPHA MERCHANT",
          match: "contains",
          source: "explicit",
        },
      ],
    };
    const omega: MarriottProperty = {
      ...alpha,
      id: "omega",
      country: "US",
      region: "overseas",
      officialName: "Omega Hotel",
      aliases: [
        {
          value: "OMEGA MERCHANT",
          match: "contains",
          source: "explicit",
        },
      ],
    };
    const result = createPropertyAliasMatcher([omega, alpha])(
      normalizeMerchantName("ALPHA MERCHANT OMEGA MERCHANT")
    );

    expect(result).toMatchObject({
      isLikelyMarriott: true,
      confidence: "medium",
      status: "needs_review",
      normalizedName: "Alpha Hotel / Omega Hotel",
    });
    expect(result?.region).toBeUndefined();
  });

  it("selects the longest shared merchant rule independent of array order", () => {
    const broadRule: SharedMarriottMerchantRule = {
      pattern: "QINGDAO",
      normalizedName: "Broad Qingdao candidate",
      propertyIds: ["broad"],
      region: "overseas",
      match: "contains",
      brandGroup: "marriott",
      confidence: "high",
      status: "active",
      reason: "broad",
    };
    const specificRule: SharedMarriottMerchantRule = {
      ...broadRule,
      pattern: "QINGDAO MERCHANT",
      normalizedName: "Specific Qingdao candidate",
      propertyIds: ["specific"],
      reason: "specific",
    };
    const input = normalizeMerchantName("QINGDAO MERCHANT TERMINAL");

    for (const rules of [
      [broadRule, specificRule],
      [specificRule, broadRule],
    ]) {
      expect(createSharedMerchantRuleMatcher(rules)(input)?.normalizedName).toBe(
        "Specific Qingdao candidate"
      );
    }
  });

  it("keeps equal shared merchant rules in review", () => {
    const alpha: SharedMarriottMerchantRule = {
      pattern: "ALPHA MERCHANT",
      normalizedName: "Alpha Hotel",
      propertyIds: ["alpha"],
      region: "overseas",
      match: "contains",
      brandGroup: "marriott",
      confidence: "high",
      status: "active",
      reason: "alpha",
    };
    const omega: SharedMarriottMerchantRule = {
      ...alpha,
      pattern: "OMEGA MERCHANT",
      normalizedName: "Omega Hotel",
      propertyIds: ["omega"],
      reason: "omega",
    };
    const result = createSharedMerchantRuleMatcher([omega, alpha])(
      normalizeMerchantName("ALPHA MERCHANT OMEGA MERCHANT")
    );

    expect(result).toMatchObject({
      isLikelyMarriott: true,
      confidence: "medium",
      status: "needs_review",
      normalizedName: "Alpha Hotel / Omega Hotel",
      region: "overseas",
    });
  });

  it("prioritizes an exact shared rule and tolerates duplicate rule rows", () => {
    const exactRule: SharedMarriottMerchantRule = {
      pattern: "TIAD",
      normalizedName: "TIAD, Autograph Collection",
      propertyIds: ["tiad"],
      region: "overseas",
      brandGroup: "marriott",
      confidence: "high",
      status: "active",
      reason: "exact",
    };
    const broadRule: SharedMarriottMerchantRule = {
      ...exactRule,
      pattern: "TIA",
      normalizedName: "Broad candidate",
      propertyIds: ["broad"],
      match: "contains",
      reason: "broad",
    };

    expect(
      createSharedMerchantRuleMatcher([
        broadRule,
        exactRule,
        { ...exactRule, propertyIds: [...exactRule.propertyIds] },
      ])(normalizeMerchantName("TIAD"))
    ).toMatchObject({
      normalizedName: "TIAD, Autograph Collection",
      matchedPattern: "TIAD",
      status: "active",
    });
  });

  it("matches property aliases after normalizing hyphen, period, and &", () => {
    // Official: "W Dubai - The Palm" — statement drops the hyphen
    expect(classifyMerchant("W DUBAI THE PALM")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "high",
      normalizedName: "W Dubai - The Palm",
    });
    // Official uses en-dash: "W Dubai – Mina Seyahi"
    expect(classifyMerchant("W DUBAI MINA SEYAHI")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "high",
      normalizedName: "W Dubai – Mina Seyahi",
    });
    // Official: "... St. Croix ..." — statement drops the period
    expect(classifyMerchant("CARAMBOLA BEACH RESORT ST CROIX")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "high",
      normalizedName:
        "Carambola Beach Resort St. Croix, US Virgin Islands",
    });
  });

  it("classifies POSTCARD CABINS via Outdoor Collection brand keyword", () => {
    const result = classifyMerchant("POSTCARD CABINS THE TH");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("certain");
    expect(result.matchedPattern).toBe("POSTCARD CABINS");
  });

  it("classifies HOTEL 55 CHICAGO as high-confidence Marriott", () => {
    const result = classifyMerchant("HOTEL 55 CHICAGO");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.status).toBe("active");
    expect(result.normalizedName).toBe("Hotel 55 Chicago Downtown");
  });

  it("classifies SKY ROCK INN OF SEDONA as high-confidence Marriott", () => {
    const result = classifyMerchant("SKY ROCK INN OF SEDONA");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.status).toBe("active");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe(
      "Sky Rock Sedona, a Tribute Portfolio Hotel"
    );
  });

  it("maps DECAMONDO HOTEL to DeCamondo Galata as high-confidence Marriott", () => {
    const result = classifyMerchant("DECAMONDO HOTEL");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe(
      "DeCamondo Galata, a Tribute Portfolio Hotel"
    );
  });

  it("maps CYMARRIOTTSAPPOR to Courtyard Sapporo as high-confidence Marriott", () => {
    const result = classifyMerchant("CYMARRIOTTSAPPOR");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe("Courtyard by Marriott Sapporo");
  });

  it("maps the compact former Moxy Osaka name via an exact alias", () => {
    expect(classifyMerchant("MOXYOSAKASHINUMEDA")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "high",
      status: "active",
      region: "overseas",
      normalizedName: "Moxy Osaka Umeda",
      matchedPattern: "MOXY OSAKA SHIN UMEDA",
    });

    expect(classifyMerchant("MOXY-OSAKA-SHIN-UMEDA")).toMatchObject({
      normalizedName: "Moxy Osaka Umeda",
      matchedPattern: "MOXY OSAKA SHIN UMEDA",
    });

    expect(
      classifyMerchant("MOXYOSAKASHINUMEDASHOP").normalizedName
    ).not.toBe("Moxy Osaka Umeda");
  });

  it("maps the confirmed Princesa statement merchant via an exact alias", () => {
    expect(classifyMerchant("PRINCESA PLAZA MADRID FOH")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "high",
      status: "active",
      region: "overseas",
      normalizedName: "Madrid Marriott Hotel Princesa Plaza",
      matchedPattern: "PRINCESA PLAZA MADRID FOH",
    });
  });

  it.each([
    "FOH PRINCESA PLAZA MADRID",
    "PRINCESA FOH PLAZA MADRID",
    "MADRID PRINCESA PLAZA FOH",
    "PRINCESA PLAZA MADRID RESTAURANT",
    "TUDOR PARK RESTAURANT",
    "CRYSTAL GATEWAY",
    "ANN ARBOR NORTH",
  ])("surfaces a unique general token candidate for review (%s)", (name) => {
    const result = classifyMerchant(name);

    expect(result).toMatchObject({
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
    });
    expect(result.normalizedName).toBeDefined();
  });

  it("automatically confirms W Singapore from brand and property tokens", () => {
    expect(classifyMerchant("W SINGAPORE")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "high",
      status: "active",
      region: "overseas",
      normalizedName: "W Singapore - Sentosa Cove",
    });
  });

  it("keeps a contextual W candidate with unexplained text in review", () => {
    expect(classifyMerchant("W STORE SINGAPORE")).toMatchObject({
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
      normalizedName: "W Singapore - Sentosa Cove",
    });
  });

  it("normalizes a fully explained Element property-token match", () => {
    expect(classifyMerchant("ELEMENT LAS COLINAS")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "certain",
      status: "active",
      normalizedName: "Element by Marriott Dallas Las Colinas",
    });
  });

  it("preserves an existing standalone brand match despite extra text", () => {
    expect(classifyMerchant("ELEMENT LAS COLINAS FITNESS")).toMatchObject({
      isLikelyMarriott: true,
      confidence: "certain",
      status: "active",
      matchedPattern: "ELEMENT",
    });
  });

  it("keeps tied contextual W candidates in review without selecting one", () => {
    const result = classifyMerchant("W DUBAI");

    expect(result).toMatchObject({
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
    });
    expect(result.normalizedName).toBeUndefined();
  });

  it.each([
    "FRITZ BURGER CO",
    "FOH STARBUCKS MADRID",
    "ZIPPY AUTO WASH ELLSWO",
    "ANN ARBOR NORTH CAMPUS UMICH",
    "DETROIT AIRPORT PARKING",
    "MADRID DENTAL CENTER",
    "GRAND RAPIDS SWEET",
    "W",
  ])("does not create a token candidate from weak evidence (%s)", (name) => {
    const result = classifyMerchant(name);

    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });

  it("classifies ZIPPY AUTO WASH - ELLSWO as not Marriott", () => {
    const result = classifyMerchant("ZIPPY AUTO WASH - ELLSWO");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });

  it("keeps a weak unknown hotel-like merchant in low-confidence review", () => {
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

  // Shinhan statements sometimes print the merchant with a single-T "MARRIOT"
  // spelling. The catalog derives that variant for every MARRIOTT keyword so
  // the whole family stays recognized.
  it.each([
    "MARRIOT HOTELS",
    "DELTA HOTELS BY MARRIOT",
    "MARRIOT VACATION CLUB",
  ])("classifies the one-T MARRIOT spelling as certain Marriott (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("certain");
  });

  it.each([
    ["JW MARRIOT HOTEL KL", "JW Marriott Hotel Kuala Lumpur"],
    [
      "FPF NAGOYA STATION",
      "Four Points Flex by Sheraton Nagoya Station",
    ],
  ])("maps verified statement alias %s to %s", (merchantName, propertyName) => {
    const result = classifyMerchant(merchantName);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.status).toBe("active");
    expect(result.normalizedName).toBe(propertyName);
    expect(result.region).toBe("overseas");
  });

  it("still matches the canonical JW MARRIOTT spelling", () => {
    // Full official name resolves via the property alias DB (high); the
    // abbreviated form falls through to the brand keyword (certain). Both are
    // confident Marriott matches — the variant must not disturb either.
    expect(classifyMerchant("JW MARRIOTT HOTEL KUALA LUMPUR").confidence).toBe(
      "high"
    );
    expect(classifyMerchant("JW MARRIOTT HOTEL KL").confidence).toBe("certain");
  });

  it("does not treat unrelated MARIO/FRITZ names as MARRIOT", () => {
    expect(classifyMerchant("MARIO PIZZA").confidence).toBe("none");
    expect(classifyMerchant("FRITZ CAFE").confidence).toBe("none");
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

  it("maps 삼매봉개발 to JW Marriott Jeju", () => {
    const result = classifyMerchant("삼매봉개발 주식회사");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("JW Marriott Jeju Resort & Spa");
  });

  it("maps 람정제주개발 to Jeju Shinhwa World Marriott", () => {
    const result = classifyMerchant("람정제주개발 주식회사");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Jeju Shinhwa World Marriott Resort");
  });

  it("maps 비에스떠블유파트너스 to Daegu Marriott Hotel", () => {
    const result = classifyMerchant("비에스떠블유파트너스");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Daegu Marriott Hotel");
  });

  it("maps 세경호텔 to Courtyard by Marriott Sejong", () => {
    const result = classifyMerchant("세경호텔");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Courtyard by Marriott Sejong");
  });

  it("maps 대신투자개발 to Aloft Seoul Gangnam", () => {
    const result = classifyMerchant("대신투자개발 주식회사");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Aloft Seoul Gangnam");
  });

  it("maps 아주호텔서교 to RYSE Autograph Collection", () => {
    const result = classifyMerchant("(주)아주호텔서교");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("RYSE, Autograph Collection");
  });

  it("maps 한화호텔앤드리조트 to THE PLAZA Seoul", () => {
    const result = classifyMerchant("한화호텔앤드리조트(주)");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("THE PLAZA Seoul, Autograph Collection");
  });

  it("maps 케이알에스 to Fairfield Busan Songdo Beach", () => {
    const result = classifyMerchant("케이알에스");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe(
      "Fairfield by Marriott Busan Songdo Beach"
    );
  });

  it("maps 제이엔에스인부산 to Fairfield by Marriott Busan", () => {
    const result = classifyMerchant("제이엔에스인부산");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Fairfield by Marriott Busan");
  });

  it("maps 와이씨앤티 to Four Points by Sheraton Seoul, Guro", () => {
    const result = classifyMerchant("와이씨앤티");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe(
      "Four Points by Sheraton Seoul, Guro"
    );
  });

  it("maps 경방 to Courtyard by Marriott Seoul Times Square", () => {
    const result = classifyMerchant("경방");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe(
      "Courtyard by Marriott Seoul Times Square"
    );
  });

  it("maps 미래엠 to Courtyard by Marriott Seoul Botanic Park", () => {
    const result = classifyMerchant("미래엠");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe(
      "Courtyard by Marriott Seoul Botanic Park"
    );
  });

  it("maps 대우송도호텔 to Sheraton Grand Incheon Hotel", () => {
    const result = classifyMerchant("대우송도호텔");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Sheraton Grand Incheon Hotel");
  });

  it("maps 서우제이앤디 to Four Points Seoul Gangnam", () => {
    const result = classifyMerchant("서우제이앤디");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe(
      "Four Points by Sheraton Seoul, Gangnam"
    );
  });

  it("maps 프라임아이티 to AC Hotel Seoul Geumjeong", () => {
    const result = classifyMerchant("주식회사 프라임아이티");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("AC Hotel Seoul Geumjeong");
  });

  it("maps 성문더플레이스 to Four Points by Sheraton Suwon", () => {
    const result = classifyMerchant("유한회사 성문더플레이스");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Four Points by Sheraton Suwon");
  });

  it("maps 에스엘지수원 to Courtyard by Marriott Suwon", () => {
    const result = classifyMerchant("에스엘지수원");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("Courtyard by Marriott Suwon");
  });

  it("maps LKL*DALIANFUMAOJIUDIAN to Four Points Dalian Donggang", () => {
    const result = classifyMerchant("LKL*DALIANFUMAOJIUDIAN");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe(
      "Four Points by Sheraton Dalian Donggang"
    );
  });

  it("maps qing dao lv cheng hua chu to Sheraton Qingdao Licang", () => {
    const result = classifyMerchant("qing dao lv cheng hua chu");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe("Sheraton Qingdao Licang Hotel");
  });

  it("maps Y P H Y Hotel Management to Moxy Xi'an Beilin", () => {
    const result = classifyMerchant("Y P H Y Hotel Management");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe("Moxy Xi'an Beilin");
  });

  it("maps CTY CP VINPEARL to Vinpearl Landmark 81 as review candidate", () => {
    const result = classifyMerchant("CTY CP VINPEARL");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("medium");
    expect(result.status).toBe("needs_review");
    expect(result.region).toBe("overseas");
    expect(result.normalizedName).toBe(
      "Vinpearl Landmark 81, Autograph Collection"
    );
  });

  it("does NOT treat 그랜드 조선 as Marriott (독립 브랜드)", () => {
    expect(classifyMerchant("그랜드 조선 부산").isLikelyMarriott).toBe(false);
    expect(classifyMerchant("그랜드 조선 제주").confidence).toBe("none");
  });

  it("classifies Nest Hotel full names as high-confidence Marriott", () => {
    for (const name of ["네스트호텔", "네스트호텔 인천", "NEST HOTEL INCHEON"]) {
      const result = classifyMerchant(name);
      expect(result.isLikelyMarriott).toBe(true);
      expect(result.confidence).toBe("high");
      expect(result.status).toBe("active");
      expect(result.region).toBe("domestic");
    }
  });

  it("keeps bare Nest short forms in review", () => {
    for (const name of ["네스트", "NEST"]) {
      const result = classifyMerchant(name);
      expect(result.isLikelyMarriott).toBe(false);
      expect(result.confidence).toBe("medium");
      expect(result.status).toBe("needs_review");
      expect(result.region).toBe("domestic");
    }
  });

  it.each([
    "L ESCAPE SEOUL MYEONGDONG",
    "LESCAPE SEOUL",
    "레스케이프 서울 명동",
    "JOSUN PALACE SEOUL GANGNAM",
    "THE PLAZA SEOUL",
    "더플라자서울",
    "더 링크 서울",
    "NEST HOTEL INCHEON",
    "네스트호텔",
  ])("catches short Korea property aliases (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.region).toBe("domestic");
  });

  it.each(["THE PLAZA", "THE LINK", "네스트", "NEST", "파르나스"])(
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

  it("matches the Shinsegae Central hotel division to JW Marriott Seoul", () => {
    const result = classifyMerchant("(주)신세계센트럴 호텔부문");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.status).toBe("active");
    expect(result.region).toBe("domestic");
    expect(result.normalizedName).toBe("JW Marriott Hotel Seoul");
  });

  it("does not broaden the Shinsegae Central alias to the short company name", () => {
    const result = classifyMerchant("신세계센트럴");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
    expect(result.status).toBe("rejected");
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
