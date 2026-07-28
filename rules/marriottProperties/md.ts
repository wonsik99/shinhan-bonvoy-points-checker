import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const moldovaMarriottOfficialRows = [
  { id: "KIVCY", officialName: "Courtyard by Marriott Chisinau" },
] as const;

export const moldovaMarriottProperties: MarriottPropertySeed[] = moldovaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MD",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
