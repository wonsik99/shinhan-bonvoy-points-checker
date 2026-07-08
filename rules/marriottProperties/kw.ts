import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const kuwaitMarriottOfficialRows = [
  { id: "KWILC", officialName: "Sheraton Kuwait, a Luxury Collection Hotel, Kuwait City" },
  { id: "KWIJW", officialName: "JW Marriott Hotel Kuwait City" },
  { id: "KWIXR", officialName: "The St. Regis Kuwait" },
  { id: "KWICY", officialName: "Courtyard by Marriott Kuwait City" },
  { id: "KWIFP", officialName: "Four Points by Sheraton Kuwait" },
  { id: "KWIER", officialName: "Marriott Executive Apartments Kuwait City" },
  { id: "KWIRI", officialName: "Residence Inn by Marriott Kuwait City" },
] as const;

export const kuwaitMarriottProperties: MarriottProperty[] = kuwaitMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "KW",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
