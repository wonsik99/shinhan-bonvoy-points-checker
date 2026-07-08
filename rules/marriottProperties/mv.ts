import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const maldivesMarriottOfficialRows = [
  { id: "MLEJS", officialName: "JW Marriott Maldives Resort & Spa" },
  { id: "MLEJM", officialName: "JW Marriott Maldives Kaafu Atoll Island Resort" },
  { id: "MLEXR", officialName: "The St. Regis Maldives Vommuli Resort" },
  { id: "MLEWH", officialName: "W Maldives" },
  { id: "MLEHP", officialName: "The Halcyon Private Isles Maldives, Autograph Collection" },
  { id: "MLEFB", officialName: "Finolhu, A Seaside Collection Resort, a Member of Design Hotels™" },
  { id: "MLEPF", officialName: "Patina Maldives, Fari Islands, a Member of Design Hotels" },
  { id: "MLEMD", officialName: "Le Méridien Maldives Resort & Spa" },
  { id: "MLESI", officialName: "Sheraton Maldives Full Moon Resort & Spa" },
  { id: "MLEWI", officialName: "The Westin Maldives Miriandhoo Resort" },
] as const;

export const maldivesMarriottProperties: MarriottProperty[] = maldivesMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MV",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
