import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const malawiMarriottOfficialRows = [
  { id: "BLZRY", officialName: "Protea Hotel Blantyre Ryalls" },
] as const;

export const malawiMarriottProperties: MarriottProperty[] = malawiMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MW",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
