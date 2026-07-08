import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const angolaMarriottOfficialRows = [
  { id: "LADPR", officialName: "Protea Hotel Luanda" },
] as const;

export const angolaMarriottProperties: MarriottProperty[] = angolaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AO",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
