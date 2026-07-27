import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const sloveniaMarriottOfficialRows = [
  { id: "LJUFP", officialName: "Four Points by Sheraton Ljubljana Mons" },
] as const;

export const sloveniaMarriottProperties: MarriottPropertySeed[] = sloveniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SI",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
