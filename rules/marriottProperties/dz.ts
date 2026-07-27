import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const algeriaMarriottOfficialRows = [
  { id: "ORNMD", officialName: "Le Méridien Oran Hotel & Convention Centre" },
  { id: "CZLMC", officialName: "Constantine Marriott Hotel" },
  { id: "AAESI", officialName: "Sheraton Annaba Hotel" },
  { id: "ALGSI", officialName: "Sheraton Club des Pins Resort" },
  { id: "ORNFP", officialName: "Four Points by Sheraton Oran" },
  { id: "ALGRI", officialName: "Residence Inn by Marriott Algiers Bab Ezzouar" },
  { id: "ALGMC", officialName: "Algiers Marriott Hotel Bab Ezzouar" },
] as const;

export const algeriaMarriottProperties: MarriottPropertySeed[] = algeriaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "DZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
