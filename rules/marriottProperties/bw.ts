import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const botswanaMarriottOfficialRows = [
  { id: "GBEPG", officialName: "Protea Hotel Gaborone Masa Square" },
] as const;

export const botswanaMarriottProperties: MarriottProperty[] = botswanaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BW",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
