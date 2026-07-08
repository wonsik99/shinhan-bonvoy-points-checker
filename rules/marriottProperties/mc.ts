import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const monacoMarriottOfficialRows = [
  { id: "MCMMD", officialName: "Le Méridien Beach Plaza" },
] as const;

export const monacoMarriottProperties: MarriottProperty[] = monacoMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MC",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
