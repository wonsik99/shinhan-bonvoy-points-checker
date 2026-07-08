import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const barbadosMarriottOfficialRows = [
  { id: "BGILC", officialName: "Colony Club, a Luxury Collection Resort, Barbados" },
  { id: "BGIAB", officialName: "Treasure Beach Art Hotel, Barbados, An Autograph Collection All-Inclusive Resort" },
  { id: "BGIAU", officialName: "Turtle Beach by Elegant Hotels - All-Inclusive" },
  { id: "BGIAH", officialName: "The House, Barbados, An Autograph Collection All–Inclusive Resort - Adults Only" },
  { id: "BGIAT", officialName: "Tamarind, Barbados, An Autograph Collection All Inclusive Resort" },
  { id: "BGIAW", officialName: "Waves Resort & Spa Barbados An Autograph Collection All-Inclusive Resort" },
  { id: "BGIRC", officialName: "Royalton Vessence Barbados Adult-Oriented, an Autograph Collection All-Inclusive Resort" },
  { id: "BGITY", officialName: "Crystal Cove, Barbados, a Tribute Portfolio All-Inclusive Resort" },
  { id: "BGITU", officialName: "Turtle Beach, Barbados, A Tribute Portfolio All-Inclusive Resort" },
  { id: "BGICY", officialName: "Courtyard by Marriott Bridgetown, Barbados" },
] as const;

export const barbadosMarriottProperties: MarriottProperty[] = barbadosMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BB",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
