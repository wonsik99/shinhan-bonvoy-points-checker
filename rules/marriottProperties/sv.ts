import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const elSalvadorMarriottOfficialRows = [
  { id: "SALSI", officialName: "Sheraton Presidente San Salvador Hotel" },
  { id: "SALCX", officialName: "City Centro by Marriott San Salvador" },
  { id: "SALCY", officialName: "Courtyard by Marriott San Salvador" },
  { id: "SALFI", officialName: "Fairfield by Marriott San Salvador" },
] as const;

export const elSalvadorMarriottProperties: MarriottPropertySeed[] = elSalvadorMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SV",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
