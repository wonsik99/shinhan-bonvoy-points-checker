import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const latviaMarriottOfficialRows = [
  { id: "RIXAC", officialName: "AC Hotel Riga" },
] as const;

export const latviaMarriottProperties: MarriottProperty[] = latviaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "LV",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
