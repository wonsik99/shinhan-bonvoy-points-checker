import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const pakistanMarriottOfficialRows = [
  { id: "ISBPK", officialName: "Islamabad Marriott Hotel" },
  { id: "KHIPK", officialName: "Karachi Marriott Hotel" },
  { id: "LHEFP", officialName: "Four Points by Sheraton Lahore" },
] as const;

export const pakistanMarriottProperties: MarriottProperty[] = pakistanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PK",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
