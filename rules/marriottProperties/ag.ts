import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const antiguaBarbudaMarriottOfficialRows = [
  { id: "ANURO", officialName: "Royalton Antigua, An Autograph Collection All-Inclusive Resort" },
  { id: "ANURC", officialName: "Royalton CHIC Antigua, an Autograph Collection All-Inclusive Resort - Adults Only" },
] as const;

export const antiguaBarbudaMarriottProperties: MarriottProperty[] = antiguaBarbudaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
