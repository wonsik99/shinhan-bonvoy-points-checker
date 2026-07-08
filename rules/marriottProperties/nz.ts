import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const newZealandMarriottOfficialRows = [
  { id: "AKLJW", officialName: "JW Marriott Auckland" },
  { id: "AKLFP", officialName: "Four Points by Sheraton Auckland" },
] as const;

export const newZealandMarriottProperties: MarriottProperty[] = newZealandMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "NZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
