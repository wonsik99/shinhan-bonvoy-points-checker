import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bangladeshMarriottOfficialRows = [
  { id: "DACMD", officialName: "Le Méridien Dhaka" },
  { id: "DACBR", officialName: "Renaissance Dhaka Gulshan Hotel" },
  { id: "DACSI", officialName: "Sheraton Dhaka" },
  { id: "DACWI", officialName: "The Westin Dhaka" },
] as const;

export const bangladeshMarriottProperties: MarriottProperty[] = bangladeshMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BD",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
