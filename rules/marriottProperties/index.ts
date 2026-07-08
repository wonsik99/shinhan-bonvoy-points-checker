import { australiaMarriottProperties } from "./au";
import { buildSafeDerivedAliases } from "./helpers";
import { chinaMarriottProperties } from "./cn";
import { indonesiaMarriottProperties } from "./id";
import { indiaMarriottProperties } from "./in";
import { italyMarriottProperties } from "./it";
import { japanMarriottProperties } from "./jp";
import { koreaMarriottProperties } from "./kr";
import { malaysiaMarriottProperties } from "./my";
import { philippinesMarriottProperties } from "./ph";
import { singaporeMarriottProperties } from "./sg";
import { thailandMarriottProperties } from "./th";
import { taiwanMarriottProperties } from "./tw";
import { unitedStatesMarriottProperties } from "./us";
import { vietnamMarriottProperties } from "./vn";

export type {
  BrandGroup,
  MarriottProperty,
  MarriottPropertyAlias,
  MatchMode,
} from "./types";
export { australiaMarriottProperties } from "./au";
export { chinaMarriottProperties } from "./cn";
export { indonesiaMarriottProperties } from "./id";
export { indiaMarriottProperties } from "./in";
export { italyMarriottProperties } from "./it";
export { japanMarriottProperties } from "./jp";
export { koreaMarriottProperties } from "./kr";
export { malaysiaMarriottProperties } from "./my";
export { philippinesMarriottProperties } from "./ph";
export { singaporeMarriottProperties } from "./sg";
export { thailandMarriottProperties } from "./th";
export { taiwanMarriottProperties } from "./tw";
export { unitedStatesMarriottProperties } from "./us";
export { vietnamMarriottProperties } from "./vn";

const rawMarriottProperties = [
  ...koreaMarriottProperties,
  ...japanMarriottProperties,
  ...thailandMarriottProperties,
  ...singaporeMarriottProperties,
  ...vietnamMarriottProperties,
  ...taiwanMarriottProperties,
  ...philippinesMarriottProperties,
  ...malaysiaMarriottProperties,
  ...indonesiaMarriottProperties,
  ...australiaMarriottProperties,
  ...indiaMarriottProperties,
  ...italyMarriottProperties,
  ...chinaMarriottProperties,
  ...unitedStatesMarriottProperties,
];

export const marriottProperties = buildSafeDerivedAliases(rawMarriottProperties);
