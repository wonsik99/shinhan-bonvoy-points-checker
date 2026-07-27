import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const icelandMarriottOfficialRows = [
  { id: "REKEB", officialName: "The Reykjavik EDITION" },
  { id: "RKVDR", officialName: "101 Hotel, Reykjavik, a Member of Design Hotels™" },
  { id: "RKVDI", officialName: "ION City Hotel, a Member of Design Hotels™" },
  { id: "RKVDS", officialName: "ION Adventure Hotel, Nesjavellir, a Member of Design Hotels™" },
  { id: "KEFCY", officialName: "Courtyard by Marriott Reykjavik Keflavik Airport" },
] as const;

export const icelandMarriottProperties: MarriottPropertySeed[] = icelandMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "IS",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
