import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const belgiumMarriottOfficialRows = [
  { id: "ANRAK", officialName: "Sapphire House Antwerp, Autograph Collection" },
  { id: "BRUAK", officialName: "Cardo Brussels, Autograph Collection" },
  { id: "BRUDD", officialName: "The Dominican, Brussels, a Member of Design Hotels™" },
  { id: "BRUDT", officialName: "Brussels Marriott Hotel Grand Place" },
  { id: "GNEMC", officialName: "Ghent Marriott Hotel" },
  { id: "BRUBR", officialName: "Renaissance Brussels Hotel" },
  { id: "BRUSI", officialName: "Sheraton Brussels Airport Hotel" },
  { id: "BRUBG", officialName: "The Belson Brussels, a Tribute Portfolio Hotel" },
  { id: "BRUCY", officialName: "Courtyard by Marriott Brussels" },
  { id: "BRUMT", officialName: "Courtyard by Marriott Brussels EU" },
  { id: "BRUGY", officialName: "Courtyard by Marriott Ghent" },
  { id: "ANROX", officialName: "Moxy Antwerp" },
  { id: "BRUOC", officialName: "Moxy Brussels City Center" },
  { id: "BRUER", officialName: "Marriott Executive Apartments Brussels, European Quarter" },
  { id: "BRURI", officialName: "Residence Inn by Marriott Brussels Airport" },
  { id: "GNERI", officialName: "Residence Inn by Marriott Ghent" },
] as const;

export const belgiumMarriottProperties: MarriottPropertySeed[] = belgiumMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
