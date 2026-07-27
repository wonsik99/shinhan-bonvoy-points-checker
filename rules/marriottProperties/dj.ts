import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const djiboutiMarriottOfficialRows = [
  { id: "JIBSI", officialName: "Sheraton Djibouti" },
] as const;

export const djiboutiMarriottProperties: MarriottPropertySeed[] = djiboutiMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "DJ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
