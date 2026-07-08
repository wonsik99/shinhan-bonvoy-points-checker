import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const omanMarriottOfficialRows = [
  { id: "MCTMJ", officialName: "JW Marriott Hotel Muscat" },
  { id: "MCTXR", officialName: "The St. Regis Al Mouj Muscat Resort" },
  { id: "MCTWH", officialName: "W Muscat" },
  { id: "MCTSI", officialName: "Sheraton Oman Hotel" },
  { id: "MCTAL", officialName: "Aloft by Marriott Muscat" },
  { id: "DQMAP", officialName: "Four Points by Sheraton Duqm " },
] as const;

export const omanMarriottProperties: MarriottProperty[] = omanMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "OM",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
