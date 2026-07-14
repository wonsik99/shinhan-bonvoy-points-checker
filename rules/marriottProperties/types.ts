import type { Confidence, RuleStatus } from "@/types/transaction";

export type BrandGroup = "marriott" | "marriott_candidate";
export type MatchMode = "exact" | "contains";
export type MarriottPropertyAliasSource = "explicit" | "derived";

export interface MarriottPropertyAlias {
  value: string;
  match?: MatchMode;
  /**
   * Explicit aliases are human-curated statement names. Derived aliases are
   * generated from an official comma-separated hotel name and must rank below
   * curated aliases when more than one property matches.
   */
  source?: MarriottPropertyAliasSource;
  brandGroup?: BrandGroup;
  confidence?: Confidence;
  status?: RuleStatus;
  reason?: string;
}

/**
 * A merchant name shared by multiple Marriott properties.
 *
 * The property alias index intentionally maps one alias to one property. A
 * shared merchant is kept separately so classification can preserve the
 * ambiguity instead of assigning the first matching property by accident.
 */
export interface SharedMarriottMerchantRule {
  pattern: string;
  normalizedName: string;
  propertyIds: string[];
  region: "domestic" | "overseas";
  match?: MatchMode;
  brandGroup: BrandGroup;
  confidence: Confidence;
  status: RuleStatus;
  reason: string;
}

export interface MarriottProperty {
  id: string;
  country: string;
  region: "domestic" | "overseas";
  officialName: string;
  localName?: string;
  brand: string;
  brandGroup?: BrandGroup;
  confidence?: Confidence;
  status?: RuleStatus;
  aliases: MarriottPropertyAlias[];
  reason?: string;
}
