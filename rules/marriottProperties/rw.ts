import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const rwandaMarriottOfficialRows = [
  { id: "KGLMC", officialName: "Kigali Marriott Hotel" },
  { id: "KGLFP", officialName: "Four Points by Sheraton Kigali" },
] as const;

export const rwandaMarriottProperties: MarriottPropertySeed[] = rwandaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "RW",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
