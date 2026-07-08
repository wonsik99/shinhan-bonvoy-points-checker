import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const nepalMarriottOfficialRows = [
  { id: "KTMSK", officialName: "The Soaltee Kathmandu, Autograph Collection" },
  { id: "KTMMC", officialName: "Kathmandu Marriott Hotel" },
  { id: "KTMAL", officialName: "Aloft by Marriott Kathmandu Thamel" },
  { id: "KTMFI", officialName: "Fairfield by Marriott Kathmandu" },
  { id: "KTMOX", officialName: "Moxy Kathmandu" },
] as const;

export const nepalMarriottProperties: MarriottProperty[] = nepalMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "NP",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
