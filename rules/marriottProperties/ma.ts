import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const moroccoMarriottOfficialRows = [
  { id: "TTUBB", officialName: "The St. Regis La Bahia Blanca Resort, Tamuda Bay" },
  { id: "RAKPP", officialName: "Amerruk, Marrakech, Autograph Collection" },
  { id: "RAKEA", officialName: "Delta Hotels by Marriott Marrakech Eden Andalou" },
  { id: "CMNVS", officialName: "Villa Sahrai, a Member of Design Hotels" },
  { id: "RAKDS", officialName: "AnaYela, Marrakesh, a Member of Design Hotels™" },
  { id: "CMNMD", officialName: "Le Méridien Casablanca" },
  { id: "RAKMD", officialName: "Le Méridien N'Fis" },
  { id: "CMNMC", officialName: "Casablanca Marriott Hotel" },
  { id: "FEZMC", officialName: "Fes Marriott Hotel Jnan Palace" },
  { id: "RBAMC", officialName: "Rabat Marriott Hotel" },
  { id: "RBATB", officialName: "Taghazout Bay Marriott Resort" },
  { id: "CMNCM", officialName: "Courtyard by Marriott Casablanca Downtown" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "RBARZ", officialName: "The Ritz-Carlton Rabat, Dar Es Salam" },
] as const;

export const moroccoMarriottProperties: MarriottPropertySeed[] = moroccoMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MA",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
