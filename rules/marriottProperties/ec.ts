import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const ecuadorMarriottOfficialRows = [
  { id: "UIODT", officialName: "JW Marriott Quito" },
  { id: "UIODS", officialName: "Carlota, a Member of Design Hotels™" },
  { id: "GYESI", officialName: "Sheraton Guayaquil Hotel" },
  { id: "UIOSI", officialName: "Sheraton Quito Hotel" },
  { id: "GYECY", officialName: "Courtyard by Marriott Guayaquil" },
  { id: "UIOCY", officialName: "Courtyard by Marriott Quito Airport" },
  { id: "CUEFP", officialName: "Four Points by Sheraton Cuenca" },
] as const;

export const ecuadorMarriottProperties: MarriottPropertySeed[] = ecuadorMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "EC",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
