import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const polandMarriottOfficialRows = [
  { id: "KRKHP", officialName: "H15 Palace, a Luxury Collection Hotel, Krakow" },
  { id: "WAWLC", officialName: "Hotel Bristol, a Luxury Collection Hotel, Warsaw" },
  { id: "KRKAK", officialName: "Stradom House Hotel & Spa, Autograph Collection" },
  { id: "WAWAK", officialName: "Hotel Verte, Warsaw, Autograph Collection" },
  { id: "WAWHF", officialName: "H15 Boutique Hotel, Warsaw, a Member of Design Hotels" },
  { id: "GDNMC", officialName: "Sopot Marriott Resort & Spa" },
  { id: "WAWBR", officialName: "Renaissance Warsaw Airport Hotel" },
  { id: "GDNSI", officialName: "Sheraton Sopot Hotel" },
  { id: "KRKSI", officialName: "Sheraton Grand Krakow" },
  { id: "POZSI", officialName: "Sheraton Poznan Hotel" },
  { id: "WAWSI", officialName: "Sheraton Grand Warsaw" },
  { id: "KRKTX", officialName: "Garamond, a Tribute Portfolio Hotel" },
  { id: "WAWWI", officialName: "The Westin Warsaw" },
  { id: "KRKAC", officialName: "AC Hotel Krakow" },
  { id: "WROAR", officialName: "AC Hotel Wroclaw" },
  { id: "GDNCY", officialName: "Courtyard by Marriott Gdynia Waterfront" },
  { id: "KTWCY", officialName: "Courtyard by Marriott Katowice City Center" },
  { id: "SZZCY", officialName: "Courtyard by Marriott Szczecin City" },
  { id: "WAWCY", officialName: "Courtyard by Marriott Warsaw Airport" },
  { id: "WAWFP", officialName: "Four Points by Sheraton Warsaw Mokotow" },
  { id: "WROFP", officialName: "Four Points by Sheraton Wroclaw" },
  { id: "KTWOX", officialName: "Moxy Katowice Airport" },
  { id: "POZOX", officialName: "Moxy Poznan Airport" },
  { id: "SZZOX", officialName: "Moxy Szczecin City" },
  { id: "WAWOK", officialName: "Moxy Warsaw Praga" },
  { id: "WAWOW", officialName: "Moxy Warsaw City" },
  { id: "WROEL", officialName: "Element by Marriott Wroclaw" },
] as const;

export const polandMarriottProperties: MarriottProperty[] = polandMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PL",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
