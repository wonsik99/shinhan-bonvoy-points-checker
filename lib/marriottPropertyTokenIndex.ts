import type { MarriottProperty } from "@/rules/marriottProperties/types";

const STRUCTURAL_TOKENS = new Set([
  "A",
  "AN",
  "AND",
  "AT",
  "BY",
  "FOR",
  "FROM",
  "IN",
  "MEMBER",
  "OF",
  "ON",
  "THE",
  "TO",
  "WITH",
]);

const MIN_MATCHED_TOKENS = 2;

function rawTokens(value: string): string[] {
  return (
    value
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .normalize("NFC")
      .toUpperCase()
      .replace(/&/g, " AND ")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

export function tokenizeMarriottPropertyText(value: string): string[] {
  return [
    ...new Set(
      rawTokens(value).filter((token) => !STRUCTURAL_TOKENS.has(token))
    ),
  ];
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export interface MarriottPropertyTokenCandidate {
  property: MarriottProperty;
  /** Input tokens that occur in this property's official or local name. */
  matchedTokens: string[];
  /** Input tokens that this specific property name does not explain. */
  unexplainedTokens: string[];
  /** Share of non-structural input tokens explained by this property. */
  inputCoverage: number;
  /** Number of distinct properties containing each matched token. */
  matchedTokenOwnerCounts: Record<string, number>;
}

export interface MarriottPropertyTokenEvidence {
  inputTokens: string[];
  /** All candidates matching at least two input tokens, best score first. */
  candidates: MarriottPropertyTokenCandidate[];
}

/**
 * Builds a deterministic candidate finder from official and local property
 * names only. It deliberately knows nothing about Marriott brands, confidence,
 * or final classification; explicit aliases and decision policy live in the
 * higher-level merchant classifier.
 */
export function createMarriottPropertyTokenMatcher(
  properties: MarriottProperty[]
): (merchantName: string) => MarriottPropertyTokenEvidence | undefined {
  const propertyById = new Map(
    properties.map((property) => [property.id, property])
  );
  const tokenOwners = new Map<string, Set<string>>();

  for (const property of properties) {
    const nameTokens = new Set([
      ...tokenizeMarriottPropertyText(property.officialName),
      ...(property.localName
        ? tokenizeMarriottPropertyText(property.localName)
        : []),
    ]);

    for (const token of nameTokens) {
      const owners = tokenOwners.get(token) ?? new Set<string>();
      owners.add(property.id);
      tokenOwners.set(token, owners);
    }
  }

  return (merchantName) => {
    const inputTokens = tokenizeMarriottPropertyText(merchantName);
    const recognizedTokens = inputTokens.filter((token) =>
      tokenOwners.has(token)
    );
    if (recognizedTokens.length < MIN_MATCHED_TOKENS) {
      return undefined;
    }

    const matchedTokensByPropertyId = new Map<string, string[]>();
    for (const token of recognizedTokens) {
      for (const propertyId of tokenOwners.get(token) ?? []) {
        const matchedTokens = matchedTokensByPropertyId.get(propertyId) ?? [];
        matchedTokens.push(token);
        matchedTokensByPropertyId.set(propertyId, matchedTokens);
      }
    }

    const candidates = [...matchedTokensByPropertyId]
      .map(([propertyId, matchedTokens]) => {
        const property = propertyById.get(propertyId);
        if (!property || matchedTokens.length < MIN_MATCHED_TOKENS) {
          return undefined;
        }

        const matchedTokenSet = new Set(matchedTokens);
        return {
          property,
          matchedTokens,
          unexplainedTokens: inputTokens.filter(
            (token) => !matchedTokenSet.has(token)
          ),
          inputCoverage: matchedTokens.length / inputTokens.length,
          matchedTokenOwnerCounts: Object.fromEntries(
            matchedTokens.map((token) => [token, tokenOwners.get(token)?.size ?? 0])
          ),
        } satisfies MarriottPropertyTokenCandidate;
      })
      .filter((candidate) => candidate !== undefined)
      .sort(
        (left, right) =>
          right.matchedTokens.length - left.matchedTokens.length ||
          compareText(left.property.id, right.property.id)
      );

    return candidates.length > 0 ? { inputTokens, candidates } : undefined;
  };
}
