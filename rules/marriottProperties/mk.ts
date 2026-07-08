import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const northMacedoniaMarriottOfficialRows = [
  { id: "SKPMC", officialName: "Skopje Marriott Hotel" },
] as const;

export const northMacedoniaMarriottProperties: MarriottProperty[] = northMacedoniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MK",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
