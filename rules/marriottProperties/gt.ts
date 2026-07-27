import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const guatemalaMarriottOfficialRows = [
  { id: "GUAGH", officialName: "Good Hotel Antigua Guatemala, a Member of Design Hotels™" },
  { id: "GUAWI", officialName: "The Westin Camino Real, Guatemala" },
  { id: "GUAAR", officialName: "AC Hotel Guatemala City" },
  { id: "GUACY", officialName: "Courtyard by Marriott Guatemala City" },
  { id: "GUAMG", officialName: "Marriott Guatemala City Cayala" },
] as const;

export const guatemalaMarriottProperties: MarriottPropertySeed[] = guatemalaMarriottOfficialRows.map(
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
