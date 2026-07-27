import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const austriaMarriottOfficialRows = [
  { id: "SZGLC", officialName: "Hotel Goldener Hirsch, a Luxury Collection Hotel, Salzburg" },
  { id: "VIEIL", officialName: "Hotel Imperial, a Luxury Collection Hotel, Vienna" },
  { id: "VIELC", officialName: "Hotel Bristol, a Luxury Collection Hotel, Vienna" },
  { id: "VIEIR", officialName: "Imperial Riding School, Autograph Collection" },
  { id: "GRZAA", officialName: "Augarten Art Hotel, a Member of Design Hotels™" },
  { id: "INNRW", officialName: "Rote Wand Gourmet Hotel, a Member of Design Hotels™" },
  { id: "SZGBG", officialName: "The Cōmodo, a Member of Design Hotels™" },
  { id: "SZGSH", officialName: "Stieg’nhaus, a Member of Design Hotels™" },
  { id: "VIEMD", officialName: "Le Méridien Vienna" },
  { id: "VIEAT", officialName: "Vienna Marriott Hotel" },
  { id: "VIEHW", officialName: "Renaissance Vienna Schönbrunn Hotel" },
  { id: "SZGSI", officialName: "Sheraton Grand Salzburg" },
  { id: "SZGTX", officialName: "June Six Salzburg, a Tribute Portfolio Hotel" },
  { id: "SZGJF", officialName: "Arabella Jagdhof Resort am Fuschlsee, a Tribute Portfolio Hotel" },
  { id: "SZGTH", officialName: "The Passenger, a Tribute Portfolio Hotel" },
  { id: "INNAC", officialName: "AC Hotel Innsbruck" },
  { id: "LNZCY", officialName: "Courtyard by Marriott Linz" },
  { id: "VIEFG", officialName: "Courtyard by Marriott Vienna Prater/Messe" },
  { id: "ACHFP", officialName: "Four Points by Sheraton Panoramahaus Dornbirn" },
  { id: "SZGMX", officialName: "Four Points Flex by Sheraton Salzburg Messe" },
  { id: "VIEHX", officialName: "Four Points Flex by Sheraton Vienna Hauptbahnhof" },
  { id: "VIEMX", officialName: "Four Points Flex by Sheraton Vienna Mariahilf" },
  { id: "VIEOX", officialName: "Moxy Vienna Airport" },
  { id: "VIEOE", officialName: "Moxy Vienna City East" },
  { id: "VIERI", officialName: "Residence Inn by Marriott Vienna City East" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "VIERZ", officialName: "The Ritz-Carlton, Vienna" },
] as const;

export const austriaMarriottProperties: MarriottPropertySeed[] = austriaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
