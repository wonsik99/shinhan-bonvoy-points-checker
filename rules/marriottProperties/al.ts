import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const albaniaMarriottOfficialRows = [
  { id: "TIAMC", officialName: "Tirana Marriott" },
] as const;

export const albaniaMarriottProperties: MarriottProperty[] = albaniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AL",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
