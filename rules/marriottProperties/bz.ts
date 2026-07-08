import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const belizeMarriottOfficialRows = [
  { id: "SPRAK", officialName: "Alaia Belize, Autograph Collection" },
] as const;

export const belizeMarriottProperties: MarriottProperty[] = belizeMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
