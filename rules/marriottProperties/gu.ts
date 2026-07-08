import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const guamMarriottOfficialRows = [
  { id: "GUMWI", officialName: "The Westin Resort Guam" },
] as const;

export const guamMarriottProperties: MarriottProperty[] = guamMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "GU",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
