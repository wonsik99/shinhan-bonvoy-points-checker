import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bhutanMarriottOfficialRows = [
  { id: "PBHMD", officialName: "Le Méridien Thimphu" },
  { id: "PBHPR", officialName: "Le Méridien Paro, Riverfront" },
] as const;

export const bhutanMarriottProperties: MarriottProperty[] = bhutanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
