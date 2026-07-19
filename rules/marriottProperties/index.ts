import { americasMarriottProperties } from "./americas";
import { asiaPacificMarriottProperties } from "./asiaPacific";
import { buildSafeDerivedAliases } from "./helpers";
import {
  chinaMarriottProperties,
  chinaSharedMerchantRules,
} from "./cn";
import { europeMarriottProperties } from "./europe";
import { koreaMarriottProperties } from "./kr";
import { middleEastAfricaMarriottProperties } from "./middleEastAfrica";
import { unitedStatesMarriottProperties } from "./us";
import type { SharedMarriottMerchantRule } from "./types";

export type {
  BrandGroup,
  MarriottProperty,
  MarriottPropertyAlias,
  MarriottPropertyAliasSource,
  MatchMode,
  SharedMarriottMerchantRule,
} from "./types";
export * from "./americas";
export * from "./asiaPacific";
export { chinaMarriottProperties, chinaSharedMerchantRules } from "./cn";
export * from "./europe";
export { koreaMarriottProperties } from "./kr";
export * from "./middleEastAfrica";
export { unitedStatesMarriottProperties } from "./us";

const rawMarriottProperties = [
  ...koreaMarriottProperties,
  ...asiaPacificMarriottProperties,
  ...europeMarriottProperties,
  ...americasMarriottProperties,
  ...middleEastAfricaMarriottProperties,
  ...chinaMarriottProperties,
  ...unitedStatesMarriottProperties,
];

export const marriottProperties = buildSafeDerivedAliases(rawMarriottProperties);

export const sharedMarriottMerchantRules: SharedMarriottMerchantRule[] = [
  ...chinaSharedMerchantRules,
];
