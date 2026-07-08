import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const arubaMarriottOfficialRows = [
  { id: "AUAXR", officialName: "The St. Regis Aruba Resort" },
  { id: "AUAAR", officialName: "Aruba Marriott Resort & Stellaris Casino" },
  { id: "AUAAC", officialName: "Marriott's Aruba Surf Club" },
  { id: "AUAAO", officialName: "Marriott's Aruba Ocean Club" },
  { id: "AUABR", officialName: "Renaissance Wind Creek Aruba Resort" },
  { id: "AUACY", officialName: "Courtyard by Marriott Aruba Resort" },
] as const;

export const arubaMarriottProperties: MarriottProperty[] = arubaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AW",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
