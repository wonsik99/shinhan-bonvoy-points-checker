import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const saintKittsNevisMarriottOfficialRows = [
  { id: "SKBRB", officialName: "St. Kitts Marriott Beach Resort, Casino & Spa" },
  { id: "SKBKT", officialName: "Marriott's St. Kitts Beach Club" },
] as const;

export const saintKittsNevisMarriottProperties: MarriottProperty[] = saintKittsNevisMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "KN",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
