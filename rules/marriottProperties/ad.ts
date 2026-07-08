import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const andorraMarriottOfficialRows = [
  { id: "LEUTX", officialName: "Hotel Euroski Mountain Resort & Spa" },
] as const;

export const andorraMarriottProperties: MarriottProperty[] = andorraMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AD",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
