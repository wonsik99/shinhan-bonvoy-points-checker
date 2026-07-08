import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bulgariaMarriottOfficialRows = [
  { id: "SOFDS", officialName: "Sense Hotel Sofia, a Member of Design Hotels™" },
  { id: "SOFJH", officialName: "Junó Hotel Sofia, a Member of Design Hotels" },
  { id: "SOFMC", officialName: "Sofia Marriott" },
  { id: "BOJSP", officialName: "Four Points by Sheraton Sunny Beach" },
  { id: "SOFBS", officialName: "Four Points by Sheraton Bansko" },
] as const;

export const bulgariaMarriottProperties: MarriottProperty[] = bulgariaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
