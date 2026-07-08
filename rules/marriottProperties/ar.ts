import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const argentinaMarriottOfficialRows = [
  { id: "BUEPL", officialName: "Park Tower, a Luxury Collection Hotel, Buenos Aires" },
  { id: "BUEMB", officialName: "Marriott Buenos Aires Downtown" },
  { id: "BUEEM", officialName: "Marriott Buenos Aires Ezeiza Airport" },
  { id: "REFMC", officialName: "Marriott Corrientes" },
  { id: "BUESC", officialName: "Sheraton Buenos Aires Hotel & Convention Center" },
  { id: "BUESI", officialName: "Sheraton Pilar Hotel & Convention Center" },
  { id: "BRCSI", officialName: "Sheraton Bariloche Hotel" },
  { id: "BUESG", officialName: "Sheraton Buenos Aires Greenville Polo & Resort" },
  { id: "MDQSI", officialName: "Sheraton Mar del Plata Hotel" },
  { id: "MDZSI", officialName: "Sheraton Mendoza Hotel" },
  { id: "SLASS", officialName: "Sheraton Salta Hotel" },
  { id: "TUCSI", officialName: "Sheraton Tucuman Hotel" },
  { id: "BRCTX", officialName: "Arelauquen Lodge, a Tribute Portfolio Hotel, San Carlos de Bariloche" },
  { id: "BUETX", officialName: "Recoleta Grand, Buenos Aires, a Tribute Portfolio Hotel" },
  { id: "MDZAV", officialName: "Auberge du Vin, a Tribute Portfolio Hotel, Tupungato" },
  { id: "BUEPX", officialName: "City Express Plus by Marriott Buenos Aires Palermo" },
  { id: "IGRXE", officialName: "City Falls Iguazu" },
  { id: "USHSX", officialName: "City Centro by Marriott Ushuaia Argentina" },
  { id: "ROSBA", officialName: "Brickton, Rosario, Apartments by Marriott Bonvoy" },
] as const;

export const argentinaMarriottProperties: MarriottProperty[] = argentinaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "AR",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
