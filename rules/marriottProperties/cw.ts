import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const curacaoMarriottOfficialRows = [
  { id: "CURAK", officialName: "The Pyrmont Curaçao, an Autograph Collection All-Inclusive Resort – Adults Only" },
  { id: "CURPB", officialName: "Curacao Marriott Beach Resort" },
  { id: "CURBR", officialName: "Renaissance Wind Creek Curacao Resort" },
  { id: "CURCY", officialName: "Courtyard by Marriott Curacao" },
] as const;

export const curacaoMarriottProperties: MarriottProperty[] = curacaoMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CW",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
