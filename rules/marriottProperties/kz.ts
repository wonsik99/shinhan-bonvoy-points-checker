import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const kazakhstanMarriottOfficialRows = [
  { id: "TSEXR", officialName: "The St. Regis Astana" },
  { id: "TSESI", officialName: "Sheraton Astana Hotel" },
] as const;

export const kazakhstanMarriottProperties: MarriottProperty[] = kazakhstanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "KZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
