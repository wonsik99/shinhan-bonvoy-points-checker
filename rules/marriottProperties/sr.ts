import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const surinameMarriottOfficialRows = [
  { id: "PBMCY", officialName: "Courtyard by Marriott Paramaribo" },
] as const;

export const surinameMarriottProperties: MarriottPropertySeed[] = surinameMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SR",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
