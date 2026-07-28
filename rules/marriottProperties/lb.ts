import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const lebanonMarriottOfficialRows = [
  { id: "BEYFP", officialName: "Four Points by Sheraton Le Verdun" },
] as const;

export const lebanonMarriottProperties: MarriottPropertySeed[] = lebanonMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "LB",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
