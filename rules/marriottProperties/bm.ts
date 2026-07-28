import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bermudaMarriottOfficialRows = [
  { id: "BDARX", officialName: "The Residences at The St. Regis Bermuda" },
  { id: "BDAXR", officialName: "The St. Regis Bermuda Resort" },
] as const;

export const bermudaMarriottProperties: MarriottPropertySeed[] = bermudaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BM",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
