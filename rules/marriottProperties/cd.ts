import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott HWS property XML, July 2026.
const democraticRepublicCongoMarriottOfficialRows = [
  { id: "FIHFP", officialName: "Four Points Kinshasa" },
  { id: "FIHPR", officialName: "Protea Hotel Kinshasa" },
] as const;

export const democraticRepublicCongoMarriottProperties: MarriottPropertySeed[] =
  democraticRepublicCongoMarriottOfficialRows.map(({ id, officialName }) => ({
    id,
    country: "CD",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  }));
