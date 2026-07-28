import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const turksCaicosMarriottOfficialRows = [
  { id: "XSCLC", officialName: "Salterra, a Luxury Collection Resort & Spa, South Caicos" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "PLSRR", officialName: "The Ritz-Carlton Residences, Turks & Caicos" },
  { id: "PLSRT", officialName: "The Ritz-Carlton, Turks & Caicos" },
] as const;

export const turksCaicosMarriottProperties: MarriottPropertySeed[] = turksCaicosMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "TC",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
