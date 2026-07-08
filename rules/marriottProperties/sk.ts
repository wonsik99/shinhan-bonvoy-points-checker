import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const slovakiaMarriottOfficialRows = [
  { id: "BTSLC", officialName: "Grand Hotel River Park, a Luxury Collection Hotel, Bratislava" },
  { id: "BTSSI", officialName: "Sheraton Bratislava Hotel" },
  { id: "BTSAR", officialName: "AC Hotel Bratislava Old Town" },
] as const;

export const slovakiaMarriottProperties: MarriottProperty[] = slovakiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SK",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
