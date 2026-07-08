import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const ivoryCoastMarriottOfficialRows = [
  { id: "ABJMP", officialName: "La Maison Palmier, a Member of Design Hotels™" },
] as const;

export const ivoryCoastMarriottProperties: MarriottProperty[] = ivoryCoastMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CI",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
