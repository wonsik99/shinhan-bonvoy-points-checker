import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const mauritiusMarriottOfficialRows = [
  { id: "MRUXM", officialName: "The St. Regis Le Morne Resort, Mauritius" },
  { id: "MRUSP", officialName: "SALT of Palmar, Mauritius, a Member of Design Hotels™" },
  { id: "MRUMD", officialName: "Le Méridien Ile Maurice" },
  { id: "MRUTB", officialName: "The Westin Turtle Bay Resort & Spa, Mauritius" },
] as const;

export const mauritiusMarriottProperties: MarriottProperty[] = mauritiusMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MU",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
