import { marriottKeywords } from "../marriottBrands";
import type { MarriottProperty, MarriottPropertyAlias, MatchMode } from "./types";

export const high = {
  brandGroup: "marriott" as const,
  confidence: "high" as const,
  status: "active" as const,
};

export const candidate = {
  brandGroup: "marriott_candidate" as const,
  confidence: "medium" as const,
  status: "needs_review" as const,
};

export const needsReviewReason =
  "실제 Marriott Bonvoy 계열 호텔명이지만, 명세서 상호가 짧거나 일반 단어와 겹칠 수 있어 확인이 필요합니다.";

export const exact = (
  value: string,
  overrides?: Omit<MarriottPropertyAlias, "value" | "match">
): MarriottPropertyAlias => ({
  value,
  match: "exact",
  ...overrides,
});

export const contains = (
  value: string,
  overrides?: Omit<MarriottPropertyAlias, "value" | "match">
): MarriottPropertyAlias => ({
  value,
  match: "contains",
  ...overrides,
});

export function propertyId(country: string, officialName: string): string {
  const slug = officialName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${country.toLowerCase()}-${slug}`;
}

/** Match-key compact form: strip spaces and punctuation that statements often omit. */
export function compactAliasKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toUpperCase()
    .replace(/&/g, " AND ")
    // hyphen / en-dash / em-dash / period — card statements often drop these
    .replace(/[\p{Pd}.]/gu, " ")
    .replace(/\s+/g, "");
}

export function defaultPropertyAliasMatch(value: string): MatchMode {
  const compact = compactAliasKey(value);
  return /^[\x00-\x7F]+$/.test(value) && compact.length < 8
    ? "exact"
    : "contains";
}

const marriottKeywordKeys = new Set(marriottKeywords.map(compactAliasKey));

function baseName(officialName: string): string | null {
  const baseName = officialName.split(",")[0]?.trim();
  if (!baseName || baseName === officialName) {
    return null;
  }

  return baseName;
}

export function buildSafeDerivedAliases(
  properties: MarriottProperty[]
): MarriottProperty[] {
  const baseAliasCounts = new Map<string, number>();
  const officialNameKeys = new Set<string>();
  for (const property of properties) {
    officialNameKeys.add(compactAliasKey(property.officialName));
    const alias = baseName(property.officialName);
    if (!alias) {
      continue;
    }
    const key = compactAliasKey(alias);
    baseAliasCounts.set(key, (baseAliasCounts.get(key) ?? 0) + 1);
  }

  return properties.map((property) => {
    const aliases = property.aliases.map((alias) =>
      alias.match ? alias : { ...alias, match: defaultPropertyAliasMatch(alias.value) }
    );
    const alias = baseName(property.officialName);
    if (!alias || baseAliasCounts.get(compactAliasKey(alias)) !== 1) {
      return { ...property, aliases };
    }
    const aliasKey = compactAliasKey(alias);
    if (officialNameKeys.has(aliasKey)) {
      return { ...property, aliases };
    }
    if (
      aliases.some(
        (existingAlias) => compactAliasKey(existingAlias.value) === aliasKey
      )
    ) {
      return { ...property, aliases };
    }

    if (marriottKeywordKeys.has(aliasKey)) {
      return { ...property, aliases };
    }

    const derivedAlias =
      defaultPropertyAliasMatch(alias) === "exact" ? exact(alias) : contains(alias);
    return {
      ...property,
      aliases: [...aliases, derivedAlias],
    };
  });
}

export function inferBrand(officialName: string): string {
  const upperName = officialName.toUpperCase();
  if (upperName.includes("RITZ-CARLTON RESERVE")) return "Ritz-Carlton Reserve";
  if (upperName.includes("RITZ-CARLTON")) return "The Ritz-Carlton";
  if (upperName.includes("LUXURY COLLECTION")) return "The Luxury Collection";
  if (upperName.includes("AUTOGRAPH")) return "Autograph Collection";
  if (upperName.includes("TRIBUTE PORTFOLIO")) return "Tribute Portfolio";
  if (upperName.includes("DESIGN HOTELS")) return "Design Hotels";
  if (upperName.includes("FOUR POINTS FLEX")) return "Four Points Flex by Sheraton";
  if (upperName.includes("FOUR POINTS")) return "Four Points by Sheraton";
  if (upperName.includes("FAIRFIELD")) return "Fairfield by Marriott";
  if (upperName.includes("COURTYARD")) return "Courtyard by Marriott";
  if (upperName.includes("JW MARRIOTT")) return "JW Marriott";
  if (upperName.includes("AC HOTEL")) return "AC Hotels";
  if (upperName.includes("ALOFT")) return "Aloft";
  if (upperName.includes("CITY EXPRESS")) return "City Express by Marriott";
  if (upperName.includes("DELTA HOTEL")) return "Delta Hotels by Marriott";
  if (upperName.includes("ELEMENT")) return "Element Hotels";
  if (upperName.includes("GAYLORD")) return "Gaylord Hotels";
  if (upperName.includes("MOXY")) return "Moxy";
  if (upperName.includes("PROTEA")) return "Protea Hotels";
  if (upperName.includes("RESIDENCE INN")) return "Residence Inn";
  if (upperName.includes("SERIES BY MARRIOTT")) return "Series by Marriott";
  if (upperName.includes("SPRINGHILL")) return "SpringHill Suites";
  if (upperName.includes("TOWNEPLACE")) return "TownePlace Suites";
  if (upperName.includes("MARRIOTT EXECUTIVE APARTMENTS")) {
    return "Marriott Executive Apartments";
  }
  if (
    upperName.includes("MARRIOTT VACATION CLUB") ||
    upperName.includes("MARRIOTT'S") ||
    upperName.includes("MARRIOTT’S")
  ) {
    return "Marriott Vacation Club";
  }
  if (upperName.includes("MARRIOTT")) return "Marriott Hotels";
  if (upperName.includes("SHERATON")) return "Sheraton";
  if (upperName.includes("WESTIN")) return "Westin";
  if (upperName.includes("ST. REGIS")) return "St. Regis";
  if (upperName.includes("RENAISSANCE")) return "Renaissance";
  if (upperName.includes("EDITION")) return "Edition";
  if (upperName.includes("BVLGARI")) return "Bvlgari Hotels";
  if (upperName.includes("W ")) return "W Hotels";
  return "Marriott Bonvoy";
}
