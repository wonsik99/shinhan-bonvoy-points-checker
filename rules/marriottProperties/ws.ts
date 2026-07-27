import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const samoaMarriottOfficialRows = [
  { id: "APWSI", officialName: "Sheraton Samoa Aggie Grey's Hotel & Bungalows" },
] as const;

export const samoaMarriottProperties: MarriottPropertySeed[] = samoaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "WS",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
