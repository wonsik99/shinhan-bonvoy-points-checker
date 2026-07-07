import type { Confidence, RuleStatus } from "@/types/transaction";

export type BrandGroup = "marriott" | "marriott_candidate";
export type MatchMode = "exact" | "contains";

export interface MarriottPropertyAlias {
  value: string;
  match?: MatchMode;
  brandGroup?: BrandGroup;
  confidence?: Confidence;
  status?: RuleStatus;
  reason?: string;
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
