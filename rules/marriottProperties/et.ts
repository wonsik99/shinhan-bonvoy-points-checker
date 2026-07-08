import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const ethiopiaMarriottOfficialRows = [
  { id: "ADDLC", officialName: "Sheraton Addis, a Luxury Collection Hotel, Addis Ababa" },
  { id: "ADDER", officialName: "Marriott Executive Apartments Addis Ababa" },
] as const;

export const ethiopiaMarriottProperties: MarriottProperty[] = ethiopiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "ET",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
