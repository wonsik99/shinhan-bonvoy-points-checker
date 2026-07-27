import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const tunisiaMarriottOfficialRows = [
  { id: "MIRMS", officialName: "Sousse Pearl Marriott Resort & Spa" },
  { id: "TUNMC", officialName: "Tunis Marriott Hotel" },
  { id: "TUNSI", officialName: "Sheraton Tunis Hotel" },
] as const;

export const tunisiaMarriottProperties: MarriottPropertySeed[] = tunisiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "TN",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
