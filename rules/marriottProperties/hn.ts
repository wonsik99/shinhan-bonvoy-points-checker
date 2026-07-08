import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const hondurasMarriottOfficialRows = [
  { id: "SAPAL", officialName: "Aloft by Marriott San Pedro Sula" },
] as const;

export const hondurasMarriottProperties: MarriottProperty[] = hondurasMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "HN",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
