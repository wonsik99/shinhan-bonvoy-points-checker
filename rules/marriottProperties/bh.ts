import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bahrainMarriottOfficialRows = [
  { id: "BAHMG", officialName: "Gulf Hotel Convention and SPA" },
  { id: "BAHMD", officialName: "Le Méridien City Centre Bahrain" },
  { id: "BAHSI", officialName: "Sheraton Bahrain Hotel" },
  { id: "BAHWI", officialName: "The Westin City Centre Bahrain" },
  { id: "BAHER", officialName: "Marriott Executive Apartments Manama, Bahrain" },
  { id: "BAHRI", officialName: "Residence Inn by Marriott Manama Juffair" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "BAHRZ", officialName: "The Ritz-Carlton, Bahrain" },
] as const;

export const bahrainMarriottProperties: MarriottPropertySeed[] = bahrainMarriottOfficialRows.map(
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
