import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const ghanaMarriottOfficialRows = [
  { id: "ACCMC", officialName: "Accra Marriott Hotel" },
  { id: "ACCFP", officialName: "Four Points by Sheraton Accra Airport Hotel" },
] as const;

export const ghanaMarriottProperties: MarriottPropertySeed[] = ghanaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "GH",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
