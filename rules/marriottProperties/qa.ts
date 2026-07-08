import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const qatarMarriottOfficialRows = [
  { id: "DOHLA", officialName: "Al Messila, a Luxury Collection Resort & Spa, Doha" },
  { id: "DOHJB", officialName: "JW Marriott Marquis City Center Doha" },
  { id: "DOHXR", officialName: "The St. Regis Doha" },
  { id: "DOHXP", officialName: "The St. Regis Marsa Arabia Island, The Pearl Qatar" },
  { id: "DOHWH", officialName: "W Doha" },
  { id: "DOHLK", officialName: "Agora, Doha, Autograph Collection" },
  { id: "DOHKW", officialName: "Qabila Westbay Hotel" },
  { id: "DOHAS", officialName: "Al Samriya, Doha, Autograph Collection" },
  { id: "DOHDC", officialName: "Delta Hotels City Center Doha" },
  { id: "DOHCL", officialName: "Le Méridien City Center, Doha" },
  { id: "DOHMD", officialName: "Le Royal Méridien Place Vendôme Lusail" },
  { id: "DOHMQ", officialName: "Marriott Marquis City Center Doha Hotel" },
  { id: "DOHSI", officialName: "Sheraton Grand Doha Resort & Convention Hotel" },
  { id: "DOHWI", officialName: "The Westin Doha Hotel & Spa" },
  { id: "DOHFP", officialName: "Four Points by Sheraton Doha" },
  { id: "DOHWE", officialName: "Element by Marriott City Center Doha" },
  { id: "DOHEL", officialName: "Element by Marriott West Bay Doha" },
  { id: "DOHEC", officialName: "Marriott Executive Apartments City Center Doha" },
  { id: "DOHEW", officialName: "Marriott Executive Apartments Doha, Le Mirage City Walk" },
] as const;

export const qatarMarriottProperties: MarriottProperty[] = qatarMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "QA",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
