import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const papuaNewGuineaMarriottOfficialRows = [
  { id: "POMEA", officialName: "Marriott Executive Apartments Port Moresby" },
  { id: "POMSI", officialName: "Sheraton Port Moresby Stanley Hotel & Suites" },
] as const;

export const papuaNewGuineaMarriottProperties: MarriottPropertySeed[] = papuaNewGuineaMarriottOfficialRows.map(
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
