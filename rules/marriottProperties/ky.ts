import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const caymanIslandsMarriottOfficialRows = [
  { id: "GCMGC", officialName: "Grand Cayman Marriott Resort" },
  { id: "GCMMI", officialName: "The Westin Grand Cayman Seven Mile Beach Resort & Spa" },
] as const;

export const caymanIslandsMarriottProperties: MarriottProperty[] = caymanIslandsMarriottOfficialRows.map(
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
