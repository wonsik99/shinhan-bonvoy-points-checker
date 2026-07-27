import reviewHoldDocument from "@/data/marriott/property-review-holds.json";

export interface MarriottPropertyReviewHold {
  propertyCode: string;
  officialName: string;
  country: string;
  region: "domestic" | "overseas";
  aliases: readonly string[];
  status: "not_yet_open" | "reservations_unavailable";
  reason: string;
  officialUrl: string;
  lastReviewedAt: string;
}

/**
 * Operator-reviewed properties that must not become active matching rules yet.
 * They stay visible to the updater and classifier as review-only evidence until
 * an operator confirms that the property is operating and publicly bookable.
 */
export const marriottPropertyReviewHolds =
  reviewHoldDocument.properties as MarriottPropertyReviewHold[];
