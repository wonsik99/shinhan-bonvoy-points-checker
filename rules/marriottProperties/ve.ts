import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const venezuelaMarriottOfficialRows = [
  { id: "CCSJW", officialName: "JW Marriott Hotel Caracas" },
  { id: "CCSAP", officialName: "Venezuela Marriott Hotel Playa Grande" },
  { id: "MYCMC", officialName: "Marriott Maracay Golf Resort" },
  { id: "CCSBR", officialName: "Renaissance Caracas La Castellana Hotel" },
] as const;

export const venezuelaMarriottProperties: MarriottProperty[] = venezuelaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "VE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
