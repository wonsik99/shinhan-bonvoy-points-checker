import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const guatemalaMarriottOfficialRows = [
  { id: "GUAGH", officialName: "Good Hotel Antigua Guatemala, a Member of Design Hotels™" },
  { id: "GUAWI", officialName: "The Westin Camino Real, Guatemala" },
  { id: "GUAAR", officialName: "AC Hotel Guatemala City" },
  { id: "GUACY", officialName: "Courtyard by Marriott Guatemala City" },
] as const;

export const guatemalaMarriottProperties: MarriottProperty[] = guatemalaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "GT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
