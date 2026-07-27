import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const armeniaMarriottOfficialRows = [
  { id: "EVNLC", officialName: "The Alexander, a Luxury Collection Hotel, Yerevan" },
  { id: "EVNMC", officialName: "Armenia Marriott Hotel Yerevan" },
  { id: "EVNTK", officialName: "Tsaghkadzor Marriott Hotel" },
  { id: "EVNCY", officialName: "Courtyard by Marriott Yerevan" },
] as const;

export const armeniaMarriottProperties: MarriottPropertySeed[] = armeniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AM",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
