import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const romaniaMarriottOfficialRows = [
  { id: "BUHRO", officialName: "JW Marriott Bucharest Grand Hotel" },
  { id: "BUHAK", officialName: "The Marmorosch Bucharest, Autograph Collection" },
  { id: "BUHSI", officialName: "Sheraton Bucharest Hotel" },
  { id: "BUHCF", officialName: "Courtyard by Marriott Bucharest Floreasca" },
  { id: "CLJCY", officialName: "Courtyard by Marriott Cluj-Napoca Downtown" },
  { id: "SBZSS", officialName: "Courtyard by Marriott Downtown Sibiu" },
  { id: "BUHOX", officialName: "Moxy Bucharest Old Town" },
] as const;

export const romaniaMarriottProperties: MarriottPropertySeed[] = romaniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "RO",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
