import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const grenadaMarriottOfficialRows = [
  { id: "GNDRO", officialName: "Royalton Grenada, an Autograph Collection All-Inclusive Resort" },
  { id: "GNDDS", officialName: "Laluna, Grenada, a Member of Design Hotels™" },
] as const;

export const grenadaMarriottProperties: MarriottPropertySeed[] = grenadaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "GD",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
