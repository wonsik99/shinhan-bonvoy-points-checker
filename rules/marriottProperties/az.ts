import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const azerbaijanMarriottOfficialRows = [
  { id: "GYDJW", officialName: "JW Marriott Absheron Baku" },
  { id: "GYDCS", officialName: "Park Chalet, Shahdag, Autograph Collection" },
  { id: "GYDPS", officialName: "Pik Palace, Shahdag, Autograph Collection" },
  { id: "GYDMB", officialName: "Baku Marriott Hotel Boulevard" },
  { id: "GYDSI", officialName: "Sheraton Baku Intourist" },
  { id: "GYDCY", officialName: "Courtyard by Marriott Baku" },
] as const;

export const azerbaijanMarriottProperties: MarriottProperty[] = azerbaijanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
