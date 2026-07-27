import { describe, expect, it } from "vitest";
import {
  buildSafeDerivedAliases,
  compactAliasKey,
  contains,
  defaultPropertyAliasMatch,
  exact,
  inferBrand,
  propertyId,
} from "@/rules/marriottProperties/helpers";
import type {
  MarriottProperty,
  MarriottPropertyAlias,
} from "@/rules/marriottProperties/types";
import {
  activeCardProfile,
  theBestProfile,
} from "@/rules/cardProfiles";

function property(
  officialName: string,
  aliases: MarriottPropertyAlias[] = []
): MarriottProperty {
  return {
    id: propertyId("US", officialName),
    propertyCode: "TEST01",
    country: "US",
    region: "overseas",
    officialName,
    brand: "Marriott Bonvoy",
    aliases,
  };
}

describe("property alias helpers", () => {
  it("builds explicit exact and contains aliases with overrides", () => {
    expect(exact("TIAD", { confidence: "high" })).toEqual({
      value: "TIAD",
      match: "exact",
      confidence: "high",
    });
    expect(contains("HOTEL CLEVELAND", { status: "active" })).toEqual({
      value: "HOTEL CLEVELAND",
      match: "contains",
      status: "active",
    });
  });

  it("normalizes property ids and compact alias keys", () => {
    expect(propertyId("FR", "Hôtel & Spa!")).toBe("fr-hotel-and-spa");
    expect(compactAliasKey("  Le Méridien\tSeoul ")).toBe("LEMERIDIENSEOUL");
    expect(compactAliasKey("W Dubai - The Palm")).toBe("WDUBAITHEPALM");
    expect(compactAliasKey("W Dubai – Mina Seyahi")).toBe("WDUBAIMINASEYAHI");
    expect(compactAliasKey("A & B Hotel")).toBe("AANDBHOTEL");
    expect(compactAliasKey("St. Croix")).toBe("STCROIX");

    const longName = "A".repeat(120);
    expect(propertyId("US", longName).slice(3)).toHaveLength(80);
  });

  it("uses exact matching only for short ASCII aliases", () => {
    expect(defaultPropertyAliasMatch("1234567")).toBe("exact");
    expect(defaultPropertyAliasMatch("12345678")).toBe("contains");
    expect(defaultPropertyAliasMatch("티아드")).toBe("contains");
  });
});

describe("buildSafeDerivedAliases", () => {
  it("fills explicit match modes and derives a unique comma base alias", () => {
    const [built] = buildSafeDerivedAliases([
      property("Unique Retreat, a Tribute Portfolio Hotel", [
        { value: "ABC" },
        { value: "ALREADY EXACT", match: "exact" },
      ]),
    ]);

    expect(built.aliases).toEqual([
      { value: "ABC", match: "exact", source: "explicit" },
      { value: "ALREADY EXACT", match: "exact", source: "explicit" },
      { value: "Unique Retreat", match: "contains", source: "derived" },
    ]);
  });

  it("does not derive ambiguous, duplicate, official-name, or brand aliases", () => {
    const built = buildSafeDerivedAliases([
      property("Shared Base, City One"),
      property("Shared Base, City Two"),
      property("Existing Name"),
      property("Existing Name, Extended"),
      property("Alias Exists, Extended", [exact("Alias Exists")]),
      property("Courtyard, Test City"),
    ]);

    for (const [index, forbidden] of [
      "Shared Base",
      "Shared Base",
      null,
      "Existing Name",
      "Alias Exists",
      "Courtyard",
    ].entries()) {
      if (!forbidden) continue;
      const occurrences = built[index].aliases.filter(
        (alias) => compactAliasKey(alias.value) === compactAliasKey(forbidden)
      );
      expect(occurrences).toHaveLength(index === 4 ? 1 : 0);
    }
  });
});

describe("inferBrand", () => {
  it.each([
    ["The Ritz-Carlton Reserve Dorado Beach", "Ritz-Carlton Reserve"],
    ["The Ritz-Carlton New York", "The Ritz-Carlton"],
    ["The Luxury Collection Hotel", "The Luxury Collection"],
    ["Autograph Collection Hotel", "Autograph Collection"],
    ["Tribute Portfolio Hotel", "Tribute Portfolio"],
    ["Design Hotels Member", "Design Hotels"],
    ["Four Points Flex London", "Four Points Flex by Sheraton"],
    ["Four Points Seoul", "Four Points by Sheraton"],
    ["Fairfield Seoul", "Fairfield by Marriott"],
    ["Courtyard Detroit", "Courtyard by Marriott"],
    ["JW Marriott Seoul", "JW Marriott"],
    ["AC Hotel Seoul", "AC Hotels"],
    ["Aloft Detroit", "Aloft"],
    ["City Express Cancun", "City Express by Marriott"],
    ["Delta Hotel Toronto", "Delta Hotels by Marriott"],
    ["Element Detroit", "Element Hotels"],
    ["citizenM Paris Opera", "citizenM"],
    ["StudioRes Riga Old Town", "StudioRes"],
    ["Gaylord Rockies", "Gaylord Hotels"],
    ["Moxy Seoul", "Moxy"],
    ["Protea Cape Town", "Protea Hotels"],
    ["Residence Inn Ann Arbor", "Residence Inn"],
    ["Series by Marriott Test", "Series by Marriott"],
    ["SpringHill Suites Detroit", "SpringHill Suites"],
    ["TownePlace Suites Detroit", "TownePlace Suites"],
    ["Marriott Executive Apartments Seoul", "Marriott Executive Apartments"],
    ["Marriott Vacation Club Test", "Marriott Vacation Club"],
    ["Marriott's Ko Olina", "Marriott Vacation Club"],
    ["Marriott Hotel Test", "Marriott Hotels"],
    ["Sheraton Grand", "Sheraton"],
    ["Westin Seoul", "Westin"],
    ["St. Regis New York", "St. Regis"],
    ["Renaissance Detroit", "Renaissance"],
    ["Rome Edition", "Edition"],
    ["Bvlgari Hotel Tokyo", "Bvlgari Hotels"],
    ["W Rome", "W Hotels"],
    ["Mystique Santorini", "Marriott Bonvoy"],
  ])("infers %s as %s", (officialName, expected) => {
    expect(inferBrand(officialName)).toBe(expected);
  });
});

describe("active card profile", () => {
  it("keeps the supported The Best accrual contract explicit", () => {
    expect(theBestProfile).toEqual({
      id: "the_best",
      label: "메리어트 본보이™ 더 베스트 신한카드",
      marriottPointsPer1000: 5,
      domesticGrade: "L4",
      overseasGrade: "L5",
      domesticFallbackGrade: "L1",
      overseasFallbackGrade: "L2",
    });
    expect(activeCardProfile).toBe(theBestProfile);
  });
});
