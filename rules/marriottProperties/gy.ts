import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const guyanaMarriottOfficialRows = [
  { id: "GEOMC", officialName: "Guyana Marriott Hotel Georgetown" },
  { id: "GEOAC", officialName: "AC Hotel Georgetown Guyana" },
  { id: "GEOTI", officialName: "Courtyard by Marriott Cheddi Jagan International Airport, Guyana" },
  { id: "GEOFP", officialName: "Four Points by Sheraton Georgetown" },
] as const;

export const guyanaMarriottProperties: MarriottProperty[] = guyanaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "GY",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
