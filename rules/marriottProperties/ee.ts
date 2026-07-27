import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const estoniaMarriottOfficialRows = [
  { id: "TLLAK", officialName: "Hotel Telegraaf, Autograph Collection" },
] as const;

export const estoniaMarriottProperties: MarriottPropertySeed[] = estoniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "EE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
