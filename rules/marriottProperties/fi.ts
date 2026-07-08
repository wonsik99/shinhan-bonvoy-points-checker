import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const finlandMarriottOfficialRows = [
  { id: "HELAK", officialName: "Hotel U14, Autograph Collection" },
  { id: "HELDG", officialName: "Hotel St. George, Helsinki, a Member of Design Hotels™" },
  { id: "TMPCY", officialName: "Courtyard by Marriott Tampere City" },
] as const;

export const finlandMarriottProperties: MarriottProperty[] = finlandMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "FI",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
