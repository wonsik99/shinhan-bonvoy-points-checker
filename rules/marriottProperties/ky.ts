import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const caymanIslandsMarriottOfficialRows = [
  { id: "GCMGC", officialName: "Grand Cayman Marriott Resort" },
  { id: "GCMMI", officialName: "The Westin Grand Cayman Seven Mile Beach Resort & Spa" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "GCMRZ", officialName: "The Ritz-Carlton, Grand Cayman" },
] as const;

export const caymanIslandsMarriottProperties: MarriottPropertySeed[] = caymanIslandsMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "KY",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
