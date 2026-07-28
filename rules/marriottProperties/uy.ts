import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const uruguayMarriottOfficialRows = [
  { id: "CYRSI", officialName: "Sheraton Colonia Golf & Spa Resort" },
  { id: "MVDAL", officialName: "Aloft by Marriott Montevideo Hotel" },
] as const;

export const uruguayMarriottProperties: MarriottPropertySeed[] = uruguayMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "UY",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
