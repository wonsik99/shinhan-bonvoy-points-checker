import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const latviaMarriottOfficialRows = [
  { id: "RIXAC", officialName: "AC Hotel Riga" },
  { id: "RIXRO", officialName: "StudioRes by Marriott Riga Old Town" },
  { id: "RIXXO", officialName: "Four Points Flex Riga Old Town" },
] as const;

export const latviaMarriottProperties: MarriottPropertySeed[] = latviaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "LV",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
