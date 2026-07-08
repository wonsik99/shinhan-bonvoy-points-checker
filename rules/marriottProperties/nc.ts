import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const newCaledoniaMarriottOfficialRows = [
  { id: "ILPMD", officialName: "Le Méridien Ile des Pins" },
  { id: "NOUMD", officialName: "Le Meridien Noumea Resort & Spa" },
  { id: "NOUSI", officialName: "Sheraton New Caledonia Deva Spa & Golf Resort" },
] as const;

export const newCaledoniaMarriottProperties: MarriottProperty[] = newCaledoniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "NC",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
