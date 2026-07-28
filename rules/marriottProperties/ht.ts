import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const haitiMarriottOfficialRows = [
  { id: "PAPMC", officialName: "Marriott Port-au-Prince Hotel" },
] as const;

export const haitiMarriottProperties: MarriottPropertySeed[] = haitiMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "HT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
