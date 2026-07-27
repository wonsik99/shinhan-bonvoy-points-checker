import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott HWS property XML, July 2026.
const laosMarriottOfficialRows = [
  { id: "LPQPV", officialName: "La Résidence Phou Vao, a Luxury Collection Resort & Spa, Luang Prabang" },
] as const;

export const laosMarriottProperties: MarriottPropertySeed[] =
  laosMarriottOfficialRows.map(({ id, officialName }) => ({
    id,
    country: "LA",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  }));
