import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const georgiaMarriottOfficialRows = [
  { id: "TBSLC", officialName: "Paragraph Freedom Square, a Luxury Collection Hotel, Tbilisi" },
  { id: "BUSAK", officialName: "Paragraph Resort & Spa Shekvetili, Autograph Collection" },
  { id: "TBSAP", officialName: "Paragraph Golf & Spa Tabori, Autograph Collection" },
  { id: "BUSRH", officialName: "Rooms Batumi, a Member of Design Hotels™" },
  { id: "TBSRH", officialName: "Rooms Tbilisi, a Member of Design Hotels™" },
  { id: "TBSKR", officialName: "Rooms Kazbegi, a Member of Design Hotels™" },
  { id: "TBSBF", officialName: "The Blue Fox Hotel, a Member of Design Hotels" },
  { id: "BUSMD", officialName: "Le Méridien Batumi" },
  { id: "TBSMC", officialName: "Tbilisi Marriott Hotel" },
  { id: "BUSSI", officialName: "Sheraton Batumi Hotel" },
  { id: "TBSSI", officialName: "Sheraton Grand Tbilisi Metechi Palace" },
  { id: "BUSCY", officialName: "Courtyard by Marriott Batumi" },
  { id: "TBSCY", officialName: "Courtyard by Marriott Tbilisi" },
  { id: "TBSOX", officialName: "Moxy Tbilisi" },
] as const;

export const georgiaMarriottProperties: MarriottProperty[] = georgiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "GE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
