import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const ugandaMarriottOfficialRows = [
  { id: "EBBMK", officialName: "Kampala Marriott Hotel" },
  { id: "EBBSI", officialName: "Sheraton Kampala Hotel" },
  { id: "EBBFP", officialName: "Four Points by Sheraton Kampala" },
  { id: "EBBEN", officialName: "Protea Hotel Entebbe" },
  { id: "EBBKA", officialName: "Protea Hotel Kampala" },
  { id: "EBBNS", officialName: "Protea Hotel Kampala Skyz" },
  { id: "EBBER", officialName: "Marriott Executive Apartments Kampala" },
] as const;

export const ugandaMarriottProperties: MarriottPropertySeed[] = ugandaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "UG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
