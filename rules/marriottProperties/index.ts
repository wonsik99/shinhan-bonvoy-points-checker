import { buildSafeDerivedAliases } from "./helpers";
import { japanMarriottProperties } from "./jp";
import { koreaMarriottProperties } from "./kr";

export type {
  BrandGroup,
  MarriottProperty,
  MarriottPropertyAlias,
  MatchMode,
} from "./types";
export { japanMarriottProperties } from "./jp";
export { koreaMarriottProperties } from "./kr";

const rawMarriottProperties = [
  ...koreaMarriottProperties,
  ...japanMarriottProperties,
];

export const marriottProperties = buildSafeDerivedAliases(rawMarriottProperties);
