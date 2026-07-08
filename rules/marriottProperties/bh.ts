import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bahrainMarriottOfficialRows = [
  { id: "BAHMG", officialName: "Gulf Hotel Convention and SPA" },
  { id: "BAHMD", officialName: "Le Méridien City Centre Bahrain" },
  { id: "BAHSI", officialName: "Sheraton Bahrain Hotel" },
  { id: "BAHWI", officialName: "The Westin City Centre Bahrain" },
  { id: "BAHER", officialName: "Marriott Executive Apartments Manama, Bahrain" },
  { id: "BAHRI", officialName: "Residence Inn by Marriott Manama Juffair" },
] as const;

export const bahrainMarriottProperties: MarriottProperty[] = bahrainMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BH",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
