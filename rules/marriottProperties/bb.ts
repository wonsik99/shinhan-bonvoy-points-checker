import { applyCuratedMarriottPropertyAliases } from "../marriottPropertyOverrides";
import { high, inferBrand } from "./helpers";
import type { MarriottOfficialRow, MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const barbadosMarriottOfficialRows: readonly MarriottOfficialRow[] = [
  { id: "BGILC", officialName: "Colony Club, a Luxury Collection Resort, Barbados" },
  { id: "BGIAB", officialName: "Treasure Beach Art Hotel, Barbados, An Autograph Collection All-Inclusive Resort" },
  {
    id: "BGIAU",
    propertyCode: "BGITU",
    formerPropertyCodes: ["BGIAU"],
    officialName: "Turtle Beach, Barbados, A Tribute Portfolio All-Inclusive Resort",
  },
  { id: "BGIAH", officialName: "The House, Barbados, An Autograph Collection All–Inclusive Resort - Adults Only" },
  { id: "BGIAT", officialName: "Tamarind, Barbados, An Autograph Collection All Inclusive Resort" },
  { id: "BGIAW", officialName: "Waves Resort & Spa Barbados An Autograph Collection All-Inclusive Resort" },
  { id: "BGIRC", officialName: "Royalton Vessence Barbados Adult-Oriented, an Autograph Collection All-Inclusive Resort" },
  { id: "BGITY", officialName: "Crystal Cove, Barbados, a Tribute Portfolio All-Inclusive Resort" },
  { id: "BGICY", officialName: "Courtyard by Marriott Bridgetown, Barbados" },
] as const;

export const barbadosMarriottProperties: MarriottPropertySeed[] = barbadosMarriottOfficialRows.map(
  ({ id, propertyCode, formerPropertyCodes, officialName }) =>
    applyCuratedMarriottPropertyAliases({
    id,
    propertyCode,
    formerPropertyCodes,
    country: "BB",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
