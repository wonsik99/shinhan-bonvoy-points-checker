import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, reviewed August 2026.
const saintLuciaMarriottOfficialRows = [
  { id: "UVFHI", officialName: "Royalton Hideaway Saint Lucia, An Autograph Collection All-Inclusive Resort - Adults Only" },
  { id: "UVFRO", officialName: "Royalton Saint Lucia, An Autograph Collection All-Inclusive Resort" },
  { id: "UVFRH", officialName: "Rabot Hotel from Hotel Chocolat, a Member of Design Hotels™" },
] as const;

export const saintLuciaMarriottProperties: MarriottPropertySeed[] = saintLuciaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "LC",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
