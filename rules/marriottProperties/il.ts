import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const israelMarriottOfficialRows = [
  { id: "TLVAK", officialName: "Publica Isrotel, Autograph Collection" },
  { id: "TLVBR", officialName: "Renaissance Tel Aviv Hotel" },
  { id: "TLVSI", officialName: "Sheraton Grand Tel Aviv" },
  { id: "TLVTX", officialName: "Gymnasia Isrotel, a Tribute Portfolio Hotel" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "TLVRZ", officialName: "The Ritz-Carlton, Herzliya" },
] as const;

export const israelMarriottProperties: MarriottPropertySeed[] = israelMarriottOfficialRows.map(
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
