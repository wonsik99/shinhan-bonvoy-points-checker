import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const papuaNewGuineaMarriottOfficialRows = [
  { id: "POMEA", officialName: "Marriott Executive Apartments Port Moresby" },
] as const;

export const papuaNewGuineaMarriottProperties: MarriottProperty[] = papuaNewGuineaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
