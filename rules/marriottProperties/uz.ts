import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const uzbekistanMarriottOfficialRows = [
  { id: "TASJW", officialName: "JW Marriott Hotel Tashkent" },
  { id: "TASCY", officialName: "Courtyard by Marriott Tashkent" },
] as const;

export const uzbekistanMarriottProperties: MarriottPropertySeed[] = uzbekistanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "UZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
