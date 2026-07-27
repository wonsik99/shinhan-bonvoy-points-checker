import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const namibiaMarriottOfficialRows = [
  { id: "MPAPR", officialName: "Protea Hotel Zambezi River Lodge" },
  { id: "ONDON", officialName: "Protea Hotel Ondangwa" },
  { id: "WDHFR", officialName: "Protea Hotel Windhoek Fürstenhof" },
  { id: "WVBPE", officialName: "Protea Hotel Walvis Bay Pelican Bay" },
  { id: "WVBWA", officialName: "Protea Hotel Walvis Bay Indongo" },
] as const;

export const namibiaMarriottProperties: MarriottPropertySeed[] = namibiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "NA",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
