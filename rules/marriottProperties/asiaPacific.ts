import { australiaMarriottProperties } from "./au";
import { indiaMarriottProperties } from "./in";
import { indonesiaMarriottProperties } from "./id";
import { japanMarriottProperties } from "./jp";
import { malaysiaMarriottProperties } from "./my";
import { philippinesMarriottProperties } from "./ph";
import { restOfAsiaPacificMarriottProperties } from "./restOfAsiaPacific";
import { singaporeMarriottProperties } from "./sg";
import { taiwanMarriottProperties } from "./tw";
import { thailandMarriottProperties } from "./th";
import { vietnamMarriottProperties } from "./vn";

export { australiaMarriottProperties } from "./au";
export { indiaMarriottProperties } from "./in";
export { indonesiaMarriottProperties } from "./id";
export { japanMarriottProperties } from "./jp";
export { malaysiaMarriottProperties } from "./my";
export { philippinesMarriottProperties } from "./ph";
export * from "./restOfAsiaPacific";
export { singaporeMarriottProperties } from "./sg";
export { taiwanMarriottProperties } from "./tw";
export { thailandMarriottProperties } from "./th";
export { vietnamMarriottProperties } from "./vn";

export const asiaPacificMarriottProperties = [
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
  ...restOfAsiaPacificMarriottProperties,
];
