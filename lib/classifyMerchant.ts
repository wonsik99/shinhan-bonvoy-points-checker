import type { MerchantClassification } from "@/types/transaction";
import {
  hotelLikeKeywords,
  koreanKnownMerchantRules,
  koreanMarriottKeywords,
  marriottProperties,
  marriottKeywords,
  type MarriottProperty,
  type MarriottPropertyAlias,
} from "@/rules/marriott";
import { defaultPropertyAliasMatch } from "@/rules/marriottProperties/helpers";

/** Uppercases, trims, collapses spaces, and strips invisible characters. */
export function normalizeMerchantName(name: string): string {
  return name
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Word-boundary keyword match so RITZ doesn't fire inside FRITZ,
 * EDITION inside EXPEDITION, W HOTEL inside VIEW HOTEL, etc.
 */
function matchesKeyword(normalized: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z])${escaped}([^A-Z]|$)`).test(normalized);
}

/**
 * Space-insensitive substring match for Korean tokens. Korean statement names
 * lack the A-Z collision problem, and spacing varies ("조선 팰리스" vs
 * "조선팰리스"), so both keyword and text are compared with spaces removed.
 */
function matchesKorean(normalizedNoSpace: string, keyword: string): boolean {
  return normalizedNoSpace.includes(keyword.replace(/\s+/g, ""));
}

interface CompiledPropertyAlias {
  property: MarriottProperty;
  alias: MarriottPropertyAlias;
  normalized: string;
  compact: string;
}

/**
 * Compact key for property-alias matching.
 * Statements often drop hyphens/periods/& that appear in official names
 * (e.g. "W Dubai - The Palm" vs "W DUBAI THE PALM").
 */
function compactMatchKeyFromNormalized(normalized: string): string {
  return normalized
    .replace(/&/g, " AND ")
    .replace(/[\p{Pd}.]/gu, " ")
    .replace(/\s+/g, "");
}

function aliasKey(value: string): string {
  return compactMatchKeyFromNormalized(normalizeMerchantName(value));
}

const propertyAliases = marriottProperties.flatMap((property) =>
  [
    { value: property.officialName },
    ...(property.localName
      ? [{ value: property.localName }]
      : []),
    ...property.aliases,
  ].map(
    (alias): CompiledPropertyAlias => {
      const match = alias.match ?? defaultPropertyAliasMatch(alias.value);
      return {
        property,
        alias: { ...alias, match },
        normalized: normalizeMerchantName(alias.value),
        compact: aliasKey(alias.value),
      };
    }
  )
);

const exactPropertyAliases = new Map<string, CompiledPropertyAlias[]>();
const containsPropertyAliasesByFirstChar = new Map<
  string,
  CompiledPropertyAlias[]
>();

for (const compiled of propertyAliases) {
  if (compiled.alias.match === "exact") {
    const matches = exactPropertyAliases.get(compiled.compact) ?? [];
    matches.push(compiled);
    exactPropertyAliases.set(compiled.compact, matches);
    continue;
  }

  const firstChar = compiled.compact[0];
  if (!firstChar) {
    continue;
  }
  const matches = containsPropertyAliasesByFirstChar.get(firstChar) ?? [];
  matches.push(compiled);
  containsPropertyAliasesByFirstChar.set(firstChar, matches);
}

function propertyAliasToClassification(
  compiled: CompiledPropertyAlias
): MerchantClassification {
  const { property, alias } = compiled;
  const brandGroup = alias.brandGroup ?? property.brandGroup ?? "marriott";
  const confidence = alias.confidence ?? property.confidence ?? "high";
  const status = alias.status ?? property.status ?? "active";

  return {
    isLikelyMarriott: brandGroup === "marriott",
    confidence,
    status,
    normalizedName: property.officialName,
    matchedPattern: alias.value,
    reason:
      alias.reason ??
      property.reason ??
      `${property.officialName}은 Marriott Bonvoy 계열 호텔로 확인된 가맹점입니다.`,
    region: property.region,
  };
}

function matchPropertyAlias(
  normalized: string
): MerchantClassification | undefined {
  const compact = compactMatchKeyFromNormalized(normalized);
  const exactMatches = exactPropertyAliases.get(compact);
  if (exactMatches?.[0]) {
    return propertyAliasToClassification(exactMatches[0]);
  }

  const checkedAliases = new Set<string>();
  for (const char of new Set(compact)) {
    const bucket = containsPropertyAliasesByFirstChar.get(char);
    if (!bucket) {
      continue;
    }

    for (const compiled of bucket) {
      if (checkedAliases.has(compiled.compact)) {
        continue;
      }
      checkedAliases.add(compiled.compact);

      // Single-token short ASCII aliases (e.g. TIAD) use word boundaries so
      // FOOTIAD does not match. Spaced short aliases (e.g. "L ESCAPE") and
      // longer aliases keep space-insensitive compact contains for truncation.
      const isShortAsciiToken =
        compiled.compact.length < 8 && /^[A-Z0-9]+$/.test(compiled.compact);
      const aliasHasSpaces = compiled.normalized.includes(" ");
      const matched =
        isShortAsciiToken && !aliasHasSpaces
          ? matchesKeyword(normalized, compiled.normalized)
          : compact.includes(compiled.compact);
      if (matched) {
        return propertyAliasToClassification(compiled);
      }
    }
  }

  return undefined;
}

/**
 * Deterministic classification pipeline:
 * 1. Korean Marriott brand keywords → certain domestic
 * 2. Global property alias DB (exact/contains, pre-indexed)
 * 3. English Marriott brand keywords → certain overseas
 * 4. Country-specific Korean rules, including operator names → needs_review
 * 5. Hotel-like keywords → low-confidence review candidate
 * 6. Otherwise not Marriott-related
 */
export function classifyMerchant(merchantName: string): MerchantClassification {
  const normalized = normalizeMerchantName(merchantName);
  const normalizedNoSpace = normalized.replace(/\s+/g, "");

  if (!normalized) {
    return {
      isLikelyMarriott: false,
      confidence: "none",
      status: "rejected",
      reason: "가맹점명이 비어 있습니다.",
    };
  }

  for (const keyword of koreanMarriottKeywords) {
    if (matchesKorean(normalizedNoSpace, keyword)) {
      return {
        isLikelyMarriott: true,
        confidence: "certain",
        status: "active",
        matchedPattern: keyword,
        reason: `가맹점명에 국내 Marriott 계열 브랜드 키워드(${keyword})가 포함되어 있습니다.`,
        region: "domestic",
      };
    }
  }

  const propertyMatch = matchPropertyAlias(normalized);
  if (propertyMatch) {
    return propertyMatch;
  }

  for (const keyword of marriottKeywords) {
    if (matchesKeyword(normalized, keyword)) {
      return {
        isLikelyMarriott: true,
        confidence: "certain",
        status: "active",
        matchedPattern: keyword,
        reason: `가맹점명에 Marriott 계열 브랜드 키워드(${keyword})가 포함되어 있습니다.`,
        region: "overseas",
      };
    }
  }

  for (const rule of koreanKnownMerchantRules) {
    if (matchesKorean(normalizedNoSpace, normalizeMerchantName(rule.pattern))) {
      return {
        isLikelyMarriott: rule.brandGroup === "marriott",
        confidence: rule.confidence,
        status: rule.status,
        normalizedName: rule.normalizedName,
        matchedPattern: rule.pattern,
        reason: rule.reason,
        region: "domestic",
      };
    }
  }

  for (const keyword of hotelLikeKeywords) {
    if (matchesKeyword(normalized, keyword)) {
      return {
        isLikelyMarriott: false,
        confidence: "low",
        status: "needs_review",
        matchedPattern: keyword,
        reason: `호텔 관련 키워드(${keyword})가 있어 Marriott 계열일 가능성이 있지만 확실하지 않습니다.`,
      };
    }
  }

  return {
    isLikelyMarriott: false,
    confidence: "none",
    status: "rejected",
    reason: "Marriott 계열 호텔로 볼 만한 단서가 없습니다.",
  };
}
