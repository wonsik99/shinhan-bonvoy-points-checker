import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const peruMarriottOfficialRows = [
  { id: "CUZLC", officialName: "Palacio del Inka, a Luxury Collection Hotel, Cusco" },
  { id: "CUZTL", officialName: "Tambo del Inka, a Luxury Collection Resort & Spa, Valle Sagrado" },
  { id: "PIOLC", officialName: "Hotel Paracas, a Luxury Collection Resort, Paracas" },
  { id: "CUZMC", officialName: "JW Marriott El Convento Cusco" },
  { id: "LIMDT", officialName: "JW Marriott Hotel Lima" },
  { id: "LIMSI", officialName: "Sheraton Lima Historic Center" },
  { id: "LIMTX", officialName: "Humano, Lima, a Tribute Portfolio Hotel" },
  { id: "LIMWI", officialName: "The Westin Lima Hotel & Convention Center" },
  { id: "LIMAC", officialName: "AC Hotel Lima Miraflores" },
  { id: "LIMRA", officialName: "Aloft by Marriott Lima Miraflores" },
  { id: "LIMLM", officialName: "Courtyard by Marriott Lima Miraflores" },
  { id: "LIMFL", officialName: "Fairfield by Marriott Lima Miraflores" },
] as const;

export const peruMarriottProperties: MarriottProperty[] = peruMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
