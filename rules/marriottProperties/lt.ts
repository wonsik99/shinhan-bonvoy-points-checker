import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const lithuaniaMarriottOfficialRows = [
  { id: "PLQKR", officialName: "Reja, a Member of Design Hotels™" },
  { id: "VNODS", officialName: "Hotel Pacai, a Member of Design Hotels™" },
  { id: "VNOEL", officialName: "Esperanza Lake Resort, a Member of Design Hotels" },
  { id: "VNOAC", officialName: "AC Hotel Vilnius" },
  { id: "VNOCY", officialName: "Courtyard by Marriott Vilnius City Center" },
  { id: "KUNOX", officialName: "Moxy Kaunas Center" },
] as const;

export const lithuaniaMarriottProperties: MarriottProperty[] = lithuaniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "LT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
