import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bosniaHerzegovinaMarriottOfficialRows = [
  { id: "OMOMC", officialName: "Mostar Marriott Hotel" },
  { id: "BNXCY", officialName: "Courtyard by Marriott Banja Luka" },
  { id: "SJJCY", officialName: "Courtyard by Marriott Sarajevo" },
  { id: "SJJRI", officialName: "Residence Inn by Marriott Sarajevo" },
] as const;

export const bosniaHerzegovinaMarriottProperties: MarriottPropertySeed[] = bosniaHerzegovinaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BA",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
