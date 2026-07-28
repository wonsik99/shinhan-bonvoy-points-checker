import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const botswanaMarriottOfficialRows = [
  { id: "GBEPG", officialName: "Protea Hotel Gaborone Masa Square" },
] as const;

export const botswanaMarriottProperties: MarriottPropertySeed[] = botswanaMarriottOfficialRows.map(
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
