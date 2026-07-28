import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const switzerlandMarriottOfficialRows = [
  { id: "GVALC", officialName: "Hotel President Wilson, a Luxury Collection Hotel, Geneva" },
  { id: "GVAWH", officialName: "W Verbier" },
  { id: "EMLAK", officialName: "The Hotel Lucerne, Autograph Collection" },
  { id: "GVAAK", officialName: "Grand Hotel Suisse Majestic, Autograph Collection" },
  { id: "ZRHAK", officialName: "Kameha Grand Zurich, Autograph Collection" },
  { id: "ZRHNS", officialName: "Neues Schloss Privat Hotel Zurich, Autograph Collection" },
  { id: "ACHGT", officialName: "Gasthaus Traube, a Member of Design Hotels™" },
  { id: "ACHRR", officialName: "Rocksresort, a Member of Design Hotels™" },
  { id: "BRNDS", officialName: "The Cambrian, Adelboden, a Member of Design Hotels™" },
  { id: "BSLAH", officialName: "Art House Basel, a Member of Design Hotels" },
  { id: "BSLND", officialName: "Nomad Design & Lifestyle Hotel, a Member of Design Hotels" },
  { id: "GVADC", officialName: "Chandolin Boutique Hotel, a Member of Design Hotels™" },
  { id: "GVAMB", officialName: "Hôtel Borsari, a Member of Design Hotels" },
  { id: "LUGDS", officialName: "Giardino Lago, Minusio-Locarno, a Member of Design Hotels™" },
  { id: "LUGGA", officialName: "Giardino Ascona, a Member of Design Hotels™" },
  { id: "SMVDS", officialName: "Giardino Mountain, Champfèr, a Member of Design Hotels™" },
  { id: "ZRHTH", officialName: "The Home Hotel Zürich, a Member of Design Hotels™" },
  { id: "BSLMC", officialName: "Basel Marriott Hotel" },
  { id: "GVAMC", officialName: "Geneva Marriott Hotel" },
  { id: "ZRHDT", officialName: "Zurich Marriott Hotel" },
  { id: "EMLBR", officialName: "Renaissance Lucerne Hotel" },
  { id: "ZRHBR", officialName: "Renaissance Zurich Tower Hotel" },
  { id: "ZRHZS", officialName: "Sheraton Zurich Hotel" },
  { id: "GVAVB", officialName: "Modern Times Hotel, Vevey, a Tribute Portfolio Hotel" },
  { id: "GVABC", officialName: "AC Hotel by Marriott Bulle" },
  { id: "BSLCY", officialName: "Courtyard by Marriott Basel" },
  { id: "BSLBC", officialName: "Courtyard by Marriott Biel/Bienne" },
  { id: "ZRHCY", officialName: "Courtyard by Marriott Zurich North" },
  { id: "BRNOX", officialName: "Moxy Bern Expo" },
  { id: "GVAOS", officialName: "Moxy Sion" },
  { id: "GVAOX", officialName: "Moxy Lausanne City" },
  { id: "ZRHOX", officialName: "Moxy Rapperswil" },
  { id: "ZRHXL", officialName: "Moxy Zurich" },
  { id: "GVARI", officialName: "Residence Inn by Marriott Geneva City Nations" },
  { id: "GVACM", officialName: "citizenM Geneva" },
  { id: "MILGL", officialName: "Grand Hotel Locarno, a Luxury Collection Hotel" },
  { id: "ZRHCM", officialName: "citizenM Zurich" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "GVARZ", officialName: "The Ritz-Carlton Hotel de la Paix, Geneva" },
] as const;

export const switzerlandMarriottProperties: MarriottPropertySeed[] = switzerlandMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CH",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
