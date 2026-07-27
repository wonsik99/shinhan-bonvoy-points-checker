import type { MerchantClassification } from "@/types/transaction";
import {
  hotelLikeKeywords,
  koreanKnownMerchantRules,
  koreanMarriottKeywords,
  marriottContextualKeywords,
  marriottPropertyReviewHolds,
  marriottProperties,
  marriottKeywords,
  sharedMarriottMerchantRules,
  type MarriottProperty,
  type MarriottPropertyAlias,
  type MarriottPropertyAliasSource,
  type MarriottPropertyReviewHold,
  type SharedMarriottMerchantRule,
} from "@/rules/marriott";
import { defaultPropertyAliasMatch } from "@/rules/marriottProperties/helpers";
import {
  createMarriottPropertyTokenMatcher,
  tokenizeMarriottPropertyText,
  type MarriottPropertyTokenCandidate,
  type MarriottPropertyTokenEvidence,
} from "@/lib/marriottPropertyTokenIndex";

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
  source: MarriottPropertyAliasSource | "official" | "local";
  normalized: string;
  compact: string;
}

interface CompiledSharedMerchantRule {
  rule: SharedMarriottMerchantRule;
  compact: string;
}

interface PropertyAliasMatch {
  compiled: CompiledPropertyAlias;
  isFullMatch: boolean;
}

interface SharedMerchantRuleMatch {
  compiled: CompiledSharedMerchantRule;
  isFullMatch: boolean;
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

interface CompiledPropertyReviewHold {
  hold: MarriottPropertyReviewHold;
  pattern: string;
  compact: string;
}

function createPropertyReviewHoldMatcher(
  holds: MarriottPropertyReviewHold[]
): (normalized: string) => MerchantClassification | undefined {
  const compiled = holds.flatMap((hold) =>
    [...new Set([hold.officialName, ...hold.aliases])].map(
      (pattern): CompiledPropertyReviewHold => ({
        hold,
        pattern,
        compact: aliasKey(pattern),
      })
    )
  );

  return (normalized) => {
    const compact = compactMatchKeyFromNormalized(normalized);
    const selected = compiled
      .filter((candidate) => compact.includes(candidate.compact))
      .sort(
        (left, right) =>
          right.compact.length - left.compact.length ||
          compareText(left.hold.propertyCode, right.hold.propertyCode)
      )[0];
    if (!selected) {
      return undefined;
    }

    return {
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
      normalizedName: selected.hold.officialName,
      matchedPattern: selected.pattern,
      reason: `${selected.hold.officialName}은 활성 등록 보류 목록에 있습니다. ${selected.hold.reason} 실제 운영 및 Marriott 특별 적립 대상 여부를 확인해야 합니다.`,
      region: selected.hold.region,
    };
  };
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

const propertyAliasSourcePriority: Record<
  CompiledPropertyAlias["source"],
  number
> = {
  explicit: 3,
  official: 2,
  local: 2,
  derived: 1,
};

function comparePropertyAliasMatchPriority(
  left: PropertyAliasMatch,
  right: PropertyAliasMatch
): number {
  if (left.isFullMatch !== right.isFullMatch) {
    return Number(left.isFullMatch) - Number(right.isFullMatch);
  }

  const sourceDifference =
    propertyAliasSourcePriority[left.compiled.source] -
    propertyAliasSourcePriority[right.compiled.source];
  if (sourceDifference !== 0) {
    return sourceDifference;
  }

  return left.compiled.compact.length - right.compiled.compact.length;
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareText);
}

// When a brandless candidate leaves one token unexplained, require at least
// one matched token that occurs in no more than five properties. The count is
// derived from the current property corpus, not from a hand-maintained word list.
const MAX_DISTINCTIVE_TOKEN_PROPERTY_COUNT = 5;

function topPropertyTokenCandidates(
  candidates: MarriottPropertyTokenCandidate[]
): MarriottPropertyTokenCandidate[] {
  const bestMatchedTokenCount = candidates[0]?.matchedTokens.length;
  return bestMatchedTokenCount === undefined
    ? []
    : candidates.filter(
        (candidate) =>
          candidate.matchedTokens.length === bestMatchedTokenCount
      );
}

function propertyTokenCandidateIsActiveMarriott(
  candidate: MarriottPropertyTokenCandidate
): boolean {
  const { property } = candidate;
  return (
    (property.brandGroup ?? "marriott") === "marriott" &&
    (property.status ?? "active") === "active"
  );
}

function candidateContainsBrandAndPropertyTokens(
  candidate: MarriottPropertyTokenCandidate,
  brandKeyword: string
): boolean {
  const brandTokens = tokenizeMarriottPropertyText(brandKeyword);
  return (
    brandTokens.length > 0 &&
    brandTokens.every((token) => candidate.matchedTokens.includes(token)) &&
    candidate.matchedTokens.some((token) => !brandTokens.includes(token))
  );
}

function topCandidatesForBrand(
  evidence: MarriottPropertyTokenEvidence | undefined,
  brandKeyword: string
): MarriottPropertyTokenCandidate[] {
  if (!evidence) {
    return [];
  }

  return topPropertyTokenCandidates(
    evidence.candidates.filter((candidate) =>
      candidateContainsBrandAndPropertyTokens(candidate, brandKeyword)
    )
  );
}

function unexplainedTokenText(tokens: string[]): string {
  return tokens.length > 0
    ? ` 설명되지 않는 토큰: ${tokens.join(", ")}.`
    : "";
}

function propertyTokenReviewClassification(
  candidates: MarriottPropertyTokenCandidate[]
): MerchantClassification {
  const properties = candidates.map((candidate) => candidate.property);
  const propertyNames = uniqueSorted(
    properties.map((property) => property.officialName)
  );
  const regions = new Set(properties.map((property) => property.region));

  if (candidates.length === 1) {
    const [candidate] = candidates;
    return {
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
      normalizedName: candidate.property.officialName,
      matchedPattern: candidate.matchedTokens.join(" "),
      reason: `공식 호텔명 토큰(${candidate.matchedTokens.join(
        ", "
      )})이 ${
        candidate.property.officialName
      } 후보와 일치하지만 자동 확정하지 않고 확인이 필요합니다.${unexplainedTokenText(
        candidate.unexplainedTokens
      )}`,
      region: candidate.property.region,
    };
  }

  const candidateText = propertyNames.slice(0, 3).join(" / ");
  const extraCandidateCount = Math.max(0, propertyNames.length - 3);
  const matchedTokens = uniqueSorted(
    candidates.flatMap((candidate) => candidate.matchedTokens)
  );
  const unexplainedTokens = uniqueSorted(
    candidates.flatMap((candidate) => candidate.unexplainedTokens)
  );

  return {
    isLikelyMarriott: false,
    confidence: "medium",
    status: "needs_review",
    matchedPattern: matchedTokens.join(" "),
    reason: `공식 호텔명 토큰이 같은 수준으로 일치하는 후보가 ${
      candidates.length
    }곳 있어 정확한 호텔 확인이 필요합니다.${
      candidateText
        ? ` 후보: ${candidateText}${
            extraCandidateCount > 0 ? ` 외 ${extraCandidateCount}곳` : ""
          }.`
        : ""
    }${unexplainedTokenText(unexplainedTokens)}`,
    region:
      properties.length > 0 && regions.size === 1
        ? properties[0].region
        : undefined,
  };
}

function contextualBrandPropertyClassification(
  candidate: MarriottPropertyTokenCandidate,
  brandKeyword: string
): MerchantClassification {
  const brandTokens = tokenizeMarriottPropertyText(brandKeyword);
  const propertyTokens = candidate.matchedTokens.filter(
    (token) => !brandTokens.includes(token)
  );

  return {
    isLikelyMarriott: true,
    confidence: "high",
    status: "active",
    normalizedName: candidate.property.officialName,
    matchedPattern: candidate.matchedTokens.join(" "),
    reason: `조건부 Marriott 브랜드 토큰(${brandKeyword})과 공식 호텔명 토큰(${propertyTokens.join(
      ", "
    )})이 ${candidate.property.officialName} 한 곳과 일치합니다.`,
    region: candidate.property.region,
  };
}

function standaloneBrandClassification(
  brandKeyword: string,
  candidate?: MarriottPropertyTokenCandidate
): MerchantClassification {
  if (candidate) {
    const brandTokens = tokenizeMarriottPropertyText(brandKeyword);
    const propertyTokens = candidate.matchedTokens.filter(
      (token) => !brandTokens.includes(token)
    );
    return {
      isLikelyMarriott: true,
      confidence: "certain",
      status: "active",
      normalizedName: candidate.property.officialName,
      matchedPattern: brandKeyword,
      reason: `Marriott 계열 브랜드 키워드(${brandKeyword})와 공식 호텔명 토큰(${propertyTokens.join(
        ", "
      )})이 ${candidate.property.officialName} 한 곳과 일치합니다.`,
      region: candidate.property.region,
    };
  }

  return {
    isLikelyMarriott: true,
    confidence: "certain",
    status: "active",
    matchedPattern: brandKeyword,
    reason: `가맹점명에 Marriott 계열 브랜드 키워드(${brandKeyword})가 포함되어 있습니다.`,
    region: "overseas",
  };
}

function qualifiesForBrandlessTokenReview(
  candidate: MarriottPropertyTokenCandidate
): boolean {
  if (candidate.unexplainedTokens.length === 0) {
    return true;
  }

  if (candidate.unexplainedTokens.length > 1) {
    return false;
  }

  return Object.values(candidate.matchedTokenOwnerCounts).some(
    (ownerCount) =>
      ownerCount > 0 && ownerCount <= MAX_DISTINCTIVE_TOKEN_PROPERTY_COUNT
  );
}

function ambiguousPropertyMatchesToClassification(
  matches: PropertyAliasMatch[]
): MerchantClassification {
  const properties = [
    ...new Map(
      [...matches]
        .sort((left, right) =>
          compareText(left.compiled.property.id, right.compiled.property.id)
        )
        .map(({ compiled }) => [compiled.property.id, compiled.property])
    ).values(),
  ];
  const propertyNames = uniqueSorted(
    properties.map((property) => property.officialName)
  );
  const patterns = uniqueSorted(
    matches.map(({ compiled }) => compiled.alias.value)
  );
  const regions = new Set(properties.map((property) => property.region));
  const isLikelyMarriott = matches.every(({ compiled }) => {
    const brandGroup =
      compiled.alias.brandGroup ??
      compiled.property.brandGroup ??
      "marriott";
    return brandGroup === "marriott";
  });
  const candidateSummary =
    propertyNames.length > 1
      ? ` 후보: ${propertyNames.slice(0, 3).join(" / ")}${
          propertyNames.length > 3 ? ` 외 ${propertyNames.length - 3}곳` : ""
        }.`
      : "";

  return {
    isLikelyMarriott,
    confidence: "medium",
    status: "needs_review",
    normalizedName:
      propertyNames.length > 1
        ? propertyNames.slice(0, 3).join(" / ")
        : undefined,
    matchedPattern: patterns.slice(0, 3).join(" / "),
    reason: `동일한 우선순위의 호텔 후보 ${properties.length}곳과 일치해 정확한 호텔 확인이 필요합니다.${candidateSummary}`,
    region: regions.size === 1 ? properties[0]?.region : undefined,
  };
}

function selectBestPropertyAliasMatch(
  matches: PropertyAliasMatch[]
): MerchantClassification | undefined {
  if (matches.length === 0) {
    return undefined;
  }

  let best = matches[0];
  for (const match of matches.slice(1)) {
    if (comparePropertyAliasMatchPriority(match, best) > 0) {
      best = match;
    }
  }

  const topMatches = matches.filter(
    (match) => comparePropertyAliasMatchPriority(match, best) === 0
  );
  const propertyIds = new Set(
    topMatches.map(({ compiled }) => compiled.property.id)
  );
  if (propertyIds.size > 1) {
    return ambiguousPropertyMatchesToClassification(topMatches);
  }

  const selected = [...topMatches].sort(
    (left, right) =>
      compareText(left.compiled.alias.value, right.compiled.alias.value) ||
      compareText(left.compiled.source, right.compiled.source)
  )[0];
  return propertyAliasToClassification(selected.compiled);
}

function sharedMerchantRuleToClassification(
  compiled: CompiledSharedMerchantRule
): MerchantClassification {
  const { rule } = compiled;
  return {
    isLikelyMarriott: rule.brandGroup === "marriott",
    confidence: rule.confidence,
    status: rule.status,
    normalizedName: rule.normalizedName,
    matchedPattern: rule.pattern,
    reason: rule.reason,
    region: rule.region,
  };
}

function compareSharedMerchantRuleMatchPriority(
  left: SharedMerchantRuleMatch,
  right: SharedMerchantRuleMatch
): number {
  if (left.isFullMatch !== right.isFullMatch) {
    return Number(left.isFullMatch) - Number(right.isFullMatch);
  }

  return left.compiled.compact.length - right.compiled.compact.length;
}

function selectBestSharedMerchantRuleMatch(
  matches: SharedMerchantRuleMatch[]
): MerchantClassification | undefined {
  if (matches.length === 0) {
    return undefined;
  }

  let best = matches[0];
  for (const match of matches.slice(1)) {
    if (compareSharedMerchantRuleMatchPriority(match, best) > 0) {
      best = match;
    }
  }

  const topMatches = matches.filter(
    (match) => compareSharedMerchantRuleMatchPriority(match, best) === 0
  );
  const ruleKeys = new Set(
    topMatches.map(({ compiled }) =>
      JSON.stringify({
        pattern: compiled.rule.pattern,
        normalizedName: compiled.rule.normalizedName,
        propertyIds: [...compiled.rule.propertyIds].sort(compareText),
      })
    )
  );
  if (ruleKeys.size > 1) {
    const names = uniqueSorted(
      topMatches.map(({ compiled }) => compiled.rule.normalizedName)
    );
    const patterns = uniqueSorted(
      topMatches.map(({ compiled }) => compiled.rule.pattern)
    );
    const regions = new Set(
      topMatches.map(({ compiled }) => compiled.rule.region)
    );
    return {
      isLikelyMarriott: topMatches.every(
        ({ compiled }) => compiled.rule.brandGroup === "marriott"
      ),
      confidence: "medium",
      status: "needs_review",
      normalizedName: names.slice(0, 3).join(" / "),
      matchedPattern: patterns.slice(0, 3).join(" / "),
      reason:
        "동일한 우선순위의 공용 가맹점 규칙이 여러 개 일치해 정확한 호텔 확인이 필요합니다.",
      region:
        regions.size === 1 ? topMatches[0].compiled.rule.region : undefined,
    };
  }

  const selected = [...topMatches].sort((left, right) =>
    compareText(left.compiled.rule.pattern, right.compiled.rule.pattern)
  )[0];
  return sharedMerchantRuleToClassification(selected.compiled);
}

/** Builds an indexed matcher whose result does not depend on property order. */
export function createPropertyAliasMatcher(
  properties: MarriottProperty[]
): (normalized: string) => MerchantClassification | undefined {
  const propertyAliases = properties.flatMap((property) => {
    const aliases: Array<{
      alias: MarriottPropertyAlias;
      source: CompiledPropertyAlias["source"];
    }> = [
      { alias: { value: property.officialName }, source: "official" },
      ...(property.localName
        ? [
            {
              alias: { value: property.localName },
              source: "local" as const,
            },
          ]
        : []),
      ...property.aliases.map((alias) => ({
        alias,
        source: alias.source ?? ("explicit" as const),
      })),
    ];

    return aliases.map(({ alias, source }): CompiledPropertyAlias => {
      const match = alias.match ?? defaultPropertyAliasMatch(alias.value);
      return {
        property,
        alias: { ...alias, match },
        source,
        normalized: normalizeMerchantName(alias.value),
        compact: aliasKey(alias.value),
      };
    });
  });
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

  return (normalized) => {
    const compact = compactMatchKeyFromNormalized(normalized);
    const matches: PropertyAliasMatch[] = (
      exactPropertyAliases.get(compact) ?? []
    ).map((compiled) => ({ compiled, isFullMatch: true }));
    const checkedAliases = new Set<CompiledPropertyAlias>();

    for (const char of new Set(compact)) {
      const bucket = containsPropertyAliasesByFirstChar.get(char);
      if (!bucket) {
        continue;
      }

      for (const compiled of bucket) {
        if (checkedAliases.has(compiled)) {
          continue;
        }
        checkedAliases.add(compiled);

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
          matches.push({
            compiled,
            isFullMatch: compact === compiled.compact,
          });
        }
      }
    }

    return selectBestPropertyAliasMatch(matches);
  };
}

/** Builds an indexed matcher whose result does not depend on rule order. */
export function createSharedMerchantRuleMatcher(
  rules: SharedMarriottMerchantRule[]
): (normalized: string) => MerchantClassification | undefined {
  const sharedMerchantRules = rules.map(
    (rule): CompiledSharedMerchantRule => ({
      rule,
      compact: aliasKey(rule.pattern),
    })
  );
  const exactSharedMerchantRules = new Map<
    string,
    CompiledSharedMerchantRule[]
  >();
  const containsSharedMerchantRulesByFirstChar = new Map<
    string,
    CompiledSharedMerchantRule[]
  >();

  for (const compiled of sharedMerchantRules) {
    const match =
      compiled.rule.match ??
      defaultPropertyAliasMatch(compiled.rule.pattern);
    if (match === "exact") {
      const matches = exactSharedMerchantRules.get(compiled.compact) ?? [];
      matches.push(compiled);
      exactSharedMerchantRules.set(compiled.compact, matches);
      continue;
    }

    const firstChar = compiled.compact[0];
    if (!firstChar) {
      continue;
    }
    const matches =
      containsSharedMerchantRulesByFirstChar.get(firstChar) ?? [];
    matches.push(compiled);
    containsSharedMerchantRulesByFirstChar.set(firstChar, matches);
  }

  return (normalized) => {
    const compact = compactMatchKeyFromNormalized(normalized);
    const matches: SharedMerchantRuleMatch[] = (
      exactSharedMerchantRules.get(compact) ?? []
    ).map((compiled) => ({ compiled, isFullMatch: true }));
    const checkedRules = new Set<CompiledSharedMerchantRule>();

    for (const char of new Set(compact)) {
      const bucket = containsSharedMerchantRulesByFirstChar.get(char);
      if (!bucket) {
        continue;
      }

      for (const compiled of bucket) {
        if (checkedRules.has(compiled)) {
          continue;
        }
        checkedRules.add(compiled);
        if (compact.includes(compiled.compact)) {
          matches.push({
            compiled,
            isFullMatch: compact === compiled.compact,
          });
        }
      }
    }

    return selectBestSharedMerchantRuleMatch(matches);
  };
}

const matchPropertyAlias = createPropertyAliasMatcher(marriottProperties);
const matchPropertyReviewHold = createPropertyReviewHoldMatcher(
  marriottPropertyReviewHolds
);
const matchSharedMerchantRule = createSharedMerchantRuleMatcher(
  sharedMarriottMerchantRules
);
const matchPropertyTokens = createMarriottPropertyTokenMatcher(
  marriottProperties
);

/**
 * Deterministic classification pipeline:
 * 1. Operator-reviewed registration holds → needs_review
 * 2. Korean Marriott brand keywords → certain domestic
 * 3. Shared merchant rules (one statement merchant for multiple properties)
 * 4. Global property alias DB (exact/contains, pre-indexed)
 * 5. Existing English brand evidence + official/local property candidates
 *    → certain, contextual-brand high, or conservative review
 * 6. Country-specific Korean rules, including operator names → needs_review
 * 7. Hotel-like keywords → low-confidence review candidate
 * 8. Otherwise not Marriott-related
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

  const reviewHoldMatch = matchPropertyReviewHold(normalized);
  if (reviewHoldMatch) {
    return reviewHoldMatch;
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

  const sharedMerchantMatch = matchSharedMerchantRule(normalized);
  if (sharedMerchantMatch) {
    return sharedMerchantMatch;
  }

  const propertyMatch = matchPropertyAlias(normalized);
  if (propertyMatch) {
    return propertyMatch;
  }

  const matchedEnglishBrandKeyword = marriottKeywords.find((keyword) =>
    matchesKeyword(normalized, keyword)
  );
  const matchedContextualBrandKeyword = marriottContextualKeywords.find(
    (keyword) => matchesKeyword(normalized, keyword)
  );
  const propertyTokenEvidence = matchPropertyTokens(normalized);

  if (matchedEnglishBrandKeyword) {
    const brandCandidates = topCandidatesForBrand(
      propertyTokenEvidence,
      matchedEnglishBrandKeyword
    );
    const propertyCandidate =
      brandCandidates.length === 1 &&
      brandCandidates[0].unexplainedTokens.length === 0 &&
      propertyTokenCandidateIsActiveMarriott(brandCandidates[0])
        ? brandCandidates[0]
        : undefined;

    // Existing standalone brand evidence remains authoritative. Property
    // tokens only enrich a fully explained unique match; they never replace or
    // downgrade the established brand rule.
    return standaloneBrandClassification(
      matchedEnglishBrandKeyword,
      propertyCandidate
    );
  }

  if (matchedContextualBrandKeyword) {
    const contextualCandidates = topCandidatesForBrand(
      propertyTokenEvidence,
      matchedContextualBrandKeyword
    );
    if (contextualCandidates.length > 0) {
      const [candidate] = contextualCandidates;
      if (
        contextualCandidates.length === 1 &&
        candidate.unexplainedTokens.length === 0 &&
        propertyTokenCandidateIsActiveMarriott(candidate)
      ) {
        return contextualBrandPropertyClassification(
          candidate,
          matchedContextualBrandKeyword
        );
      }

      return propertyTokenReviewClassification(contextualCandidates);
    }
  }

  if (propertyTokenEvidence) {
    const topCandidates = topPropertyTokenCandidates(
      propertyTokenEvidence.candidates
    );
    if (
      topCandidates.length === 1 &&
      qualifiesForBrandlessTokenReview(topCandidates[0])
    ) {
      return propertyTokenReviewClassification(topCandidates);
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
