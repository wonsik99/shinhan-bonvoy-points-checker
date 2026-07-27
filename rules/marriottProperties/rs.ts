import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const serbiaMarriottOfficialRows = [
  { id: "BEGXR", officialName: "The St. Regis Belgrade" },
  { id: "BEGSI", officialName: "Sheraton Novi Sad" },
  { id: "BEGCY", officialName: "Courtyard by Marriott Belgrade City Center" },
  { id: "BEGOX", officialName: "Moxy Belgrade" },
  { id: "BEGSX", officialName: "Moxy Belgrade Skadarlija" },
] as const;

export const serbiaMarriottProperties: MarriottPropertySeed[] = serbiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "RS",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
