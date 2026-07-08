import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const luxembourgMarriottOfficialRows = [
  { id: "LUXMC", officialName: "Luxembourg Marriott Hotel Alfa" },
  { id: "LUXOX", officialName: "Moxy Luxembourg Airport" },
] as const;

export const luxembourgMarriottProperties: MarriottProperty[] = luxembourgMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "LU",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
