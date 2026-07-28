import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const trinidadTobagoMarriottOfficialRows = [
  { id: "POSAK", officialName: "The BRIX, Autograph Collection" },
  { id: "POSCY", officialName: "Courtyard by Marriott Port of Spain" },
] as const;

export const trinidadTobagoMarriottProperties: MarriottPropertySeed[] = trinidadTobagoMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "TT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
