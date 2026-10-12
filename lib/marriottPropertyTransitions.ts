import type { MerchantClassification } from "@/types/transaction";
import { marriottPropertyTransitions } from "@/rules/marriottPropertyTransitions";

function words(value: string): string[] {
  return value.toUpperCase().replace(/&/g, " AND ").match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Allow statement punctuation/glued words, but not NW SOUTH BEACH or BEACHFRONT. */
function aliasPattern(value: string): RegExp {
  const pattern = words(value)
    .map((word) => word === "MARRIOTT" ? "MARRIOTT?" : word)
    .join("[\\s\\p{P}\\p{S}]*");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${pattern}($|[^\\p{L}\\p{N}])`, "u");
}

const compiledTransitions = marriottPropertyTransitions.map((transition) => ({
  transition,
  aliases: transition.aliases.map((alias) => ({ alias, pattern: aliasPattern(alias) })),
  exclusions: (transition.excludedAliases ?? []).map(aliasPattern),
}));

/** Validate actual calendar dates without the system clock or date rollover. */
export function isValidTransactionDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

/**
 * Run before brand/property fallbacks: an old MARRIOTT name alone cannot
 * override current transition evidence. Only the transaction date is allowed;
 * posting/aggregation dates and today's date do not establish stay affiliation.
 */
export function matchMarriottPropertyTransition(
  normalizedMerchantName: string,
  transactionDate?: string
): MerchantClassification | undefined {
  const input = normalizedMerchantName.replace(/&/g, " AND ");
  for (const { transition, aliases, exclusions } of compiledTransitions) {
    const match = aliases.find(({ pattern }) => pattern.test(input));
    if (!match || exclusions.some((pattern) => pattern.test(input))) continue;

    const endDate = transition.lastMarriottOperatingDate;
    if (endDate && isValidTransactionDate(transactionDate) && transactionDate <= endDate) {
      // Let the existing historical alias/brand rules classify the old payment.
      return undefined;
    }

    const dateReason = endDate
      ? isValidTransactionDate(transactionDate)
        ? "이 거래는 마지막 운영일 이후여서 결제 당시 제휴 상태 확인이 필요합니다."
        : "거래일이 없거나 유효하지 않아 과거 Marriott 결제인지 확인이 필요합니다."
      : "정확한 전환일이 확인되지 않아 과거 거래도 날짜만으로 단정하지 않습니다.";
    return {
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
      normalizedName: transition.officialName,
      matchedPattern: match.alias,
      region: "overseas",
      reason: `${transition.reason} ${dateReason}`,
    };
  }
  return undefined;
}
