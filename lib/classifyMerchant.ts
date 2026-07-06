import type { MerchantClassification } from "@/types/transaction";
import {
  hotelLikeKeywords,
  knownMerchantRules,
  koreanKnownMerchantRules,
  koreanMarriottKeywords,
  marriottKeywords,
} from "@/rules/marriott";

/** Uppercases, trims, collapses spaces, and strips invisible characters. */
export function normalizeMerchantName(name: string): string {
  return name
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
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
 * Deterministic classification pipeline:
 * 1. Known merchant DB rules (curated, may be ambiguous → needs_review)
 * 2. Marriott brand keywords → certain
 * 3. Hotel-like keywords → low-confidence review candidate
 * 4. Otherwise not Marriott-related
 */
export function classifyMerchant(merchantName: string): MerchantClassification {
  const normalized = normalizeMerchantName(merchantName);

  if (!normalized) {
    return {
      isLikelyMarriott: false,
      confidence: "none",
      status: "rejected",
      reason: "가맹점명이 비어 있습니다.",
    };
  }

  for (const rule of knownMerchantRules) {
    if (matchesKeyword(normalized, normalizeMerchantName(rule.pattern))) {
      return {
        isLikelyMarriott: rule.brandGroup === "marriott",
        confidence: rule.confidence,
        status: rule.status,
        normalizedName: rule.normalizedName,
        matchedPattern: rule.pattern,
        reason: rule.reason,
        region: "overseas",
      };
    }
  }

  for (const rule of koreanKnownMerchantRules) {
    if (matchesKeyword(normalized, normalizeMerchantName(rule.pattern))) {
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

  for (const keyword of koreanMarriottKeywords) {
    if (matchesKeyword(normalized, keyword)) {
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
