import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const kazakhstanMarriottOfficialRows = [
  { id: "TSEXR", officialName: "The St. Regis Astana" },
  { id: "TSESI", officialName: "Sheraton Astana Hotel" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "ALARZ", officialName: "The Ritz-Carlton, Almaty" },
  { id: "TSERZ", officialName: "The Ritz-Carlton, Astana" },
] as const;

export const kazakhstanMarriottProperties: MarriottPropertySeed[] = kazakhstanMarriottOfficialRows.map(
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
