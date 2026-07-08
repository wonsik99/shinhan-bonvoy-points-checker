import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const usVirginIslandsMarriottOfficialRows = [
  { id: "STTAK", officialName: "Buoy Haus Beach Resort St. Thomas, Autograph Collection" },
  { id: "STTUV", officialName: "Marriott's Frenchman's Cove" },
  { id: "STTWJ", officialName: "The Westin St. John Resort Villas" },
  { id: "STXBR", officialName: "Carambola Beach Resort St. Croix, US Virgin Islands" },
  { id: "STTWI", officialName: "The Westin St. Thomas Beach Resort & Spa" },
] as const;

export const usVirginIslandsMarriottProperties: MarriottProperty[] = usVirginIslandsMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "VI",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
