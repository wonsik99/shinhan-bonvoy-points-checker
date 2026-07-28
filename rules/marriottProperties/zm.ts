import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const zambiaMarriottOfficialRows = [
  { id: "LUNCR", officialName: "Ciêla, Lusaka, a Tribute Portfolio Resort and Spa" },
  { id: "CIPBR", officialName: "Protea Hotel Chipata" },
  { id: "KIWPR", officialName: "Protea Hotel Chingola" },
  { id: "LUNCA", officialName: "Protea Hotel Lusaka Cairo Road" },
  { id: "LUNLS", officialName: "Protea Hotel Lusaka" },
  { id: "LUNLU", officialName: "Protea Hotel Lusaka Safari Lodge" },
  { id: "LUNTW", officialName: "Protea Hotel Lusaka Tower" },
  { id: "LVILI", officialName: "Protea Hotel Livingstone" },
  { id: "LUNAP", officialName: "Protea Hotel Lusaka International Airport" },
  { id: "NLAPR", officialName: "Protea Hotel Ndola" },
] as const;

export const zambiaMarriottProperties: MarriottPropertySeed[] = zambiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "ZM",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
