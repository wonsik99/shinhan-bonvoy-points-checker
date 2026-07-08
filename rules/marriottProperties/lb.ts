import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const lebanonMarriottOfficialRows = [
  { id: "BEYFP", officialName: "Four Points by Sheraton Le Verdun" },
] as const;

export const lebanonMarriottProperties: MarriottProperty[] = lebanonMarriottOfficialRows.map(
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
