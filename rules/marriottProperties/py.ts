import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const paraguayMarriottOfficialRows = [
  { id: "ASUSI", officialName: "Sheraton Asuncion Hotel" },
  { id: "ASUTX", officialName: "Yacht & Golf Club Paraguayo, a Tribute Portfolio Resort" },
  { id: "ASUAL", officialName: "Aloft by Marriott Asuncion" },
] as const;

export const paraguayMarriottProperties: MarriottProperty[] = paraguayMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PY",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
