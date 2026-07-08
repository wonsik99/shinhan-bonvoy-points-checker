import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const turksCaicosMarriottOfficialRows = [
  { id: "XSCLC", officialName: "Salterra, a Luxury Collection Resort & Spa, South Caicos" },
] as const;

export const turksCaicosMarriottProperties: MarriottProperty[] = turksCaicosMarriottOfficialRows.map(
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
