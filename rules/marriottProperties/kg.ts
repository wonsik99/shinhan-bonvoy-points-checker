import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const kyrgyzstanMarriottOfficialRows = [
  { id: "FRUSI", officialName: "Sheraton Bishkek" },
] as const;

export const kyrgyzstanMarriottProperties: MarriottProperty[] = kyrgyzstanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "KG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
