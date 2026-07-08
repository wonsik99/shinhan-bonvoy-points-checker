import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const fijiMarriottOfficialRows = [
  { id: "NANMC", officialName: "Fiji Marriott Resort Momi Bay" },
  { id: "NANDS", officialName: "Sheraton Denarau Villas" },
  { id: "NANSI", officialName: "Sheraton Fiji Golf & Beach Resort" },
  { id: "NANTI", officialName: "Sheraton Resort & Spa, Tokoriki Island, Fiji" },
  { id: "NANWI", officialName: "The Westin Fiji Golf Resort & Spa" },
] as const;

export const fijiMarriottProperties: MarriottProperty[] = fijiMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "FJ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
