import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const jordanMarriottOfficialRows = [
  { id: "AQJLC", officialName: "Al Manara, a Luxury Collection Hotel, Saraya Aqaba" },
  { id: "AMMXR", officialName: "The St. Regis Amman" },
  { id: "AMMWI", officialName: "W Amman" },
  { id: "AMMJR", officialName: "Amman Marriott Hotel" },
  { id: "MPQMC", officialName: "Petra Marriott Hotel" },
  { id: "QMDJV", officialName: "Dead Sea Marriott Resort & Spa" },
  { id: "AMMSI", officialName: "Sheraton Amman Al Nabil Hotel" },
  { id: "AQJWI", officialName: "The Westin Saraya Aqaba Resort & Spa" },
] as const;

export const jordanMarriottProperties: MarriottProperty[] = jordanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "JO",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
