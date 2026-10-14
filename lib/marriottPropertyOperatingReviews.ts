import type { MerchantClassification } from "@/types/transaction";
import { marriottPropertyOperatingReviews } from "@/rules/marriottPropertyOperatingReviews";

const reviewsByCode = new Map(
  marriottPropertyOperatingReviews.map((review) => [review.propertyCode, review])
);

function aliasPattern(value: string): RegExp {
  const words = value.toUpperCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const pattern = words
    .map((word) => word === "MARRIOTT" ? "MARRIOTT?" : word)
    .join("[\\s\\p{P}\\p{S}]*");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${pattern}($|[^\\p{L}\\p{N}])`, "u");
}

const compiledAliases = marriottPropertyOperatingReviews.flatMap((review) =>
  [review.officialName, ...review.aliases].map((alias) => ({
    propertyCode: review.propertyCode,
    alias,
    pattern: aliasPattern(alias),
  }))
);

/** Also protect token/alias-index matches that already identified this code. */
export function reviewMarriottPropertyOperatingStatus(
  propertyCode: string,
  matchedPattern: string
): MerchantClassification | undefined {
  const review = reviewsByCode.get(propertyCode);
  if (!review) return undefined;
  return {
    isLikelyMarriott: false,
    confidence: "medium",
    status: "needs_review",
    normalizedName: review.officialName,
    matchedPattern,
    reason: review.reason,
    region: review.region,
  };
}

/** Narrow names run before brand fallback; no transaction or system-clock gate. */
export function matchMarriottPropertyOperatingReview(
  normalizedMerchantName: string
): MerchantClassification | undefined {
  const match = compiledAliases.find(({ pattern }) => pattern.test(normalizedMerchantName));
  return match
    ? reviewMarriottPropertyOperatingStatus(match.propertyCode, match.alias)
    : undefined;
}
