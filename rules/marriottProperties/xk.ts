import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const kosovoMarriottOfficialRows = [
  { id: "PRNCY", officialName: "Courtyard by Marriott Prishtina" },
  { id: "PRNFP", officialName: "Four Points by Sheraton Prishtina City" },
] as const;

export const kosovoMarriottProperties: MarriottPropertySeed[] = kosovoMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "XK",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
