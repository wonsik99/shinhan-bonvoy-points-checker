import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const israelMarriottOfficialRows = [
  { id: "TLVAK", officialName: "Publica Isrotel, Autograph Collection" },
  { id: "TLVBR", officialName: "Renaissance Tel Aviv Hotel" },
  { id: "TLVSI", officialName: "Sheraton Grand Tel Aviv" },
  { id: "TLVTX", officialName: "Gymnasia Isrotel, a Tribute Portfolio Hotel" },
] as const;

export const israelMarriottProperties: MarriottProperty[] = israelMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "IL",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
