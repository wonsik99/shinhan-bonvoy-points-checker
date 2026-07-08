import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const norwayMarriottOfficialRows = [
  { id: "BGOOX", officialName: "Moxy Bergen" },
  { id: "TOSOX", officialName: "Moxy Tromso" },
] as const;

export const norwayMarriottProperties: MarriottProperty[] = norwayMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "NO",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
