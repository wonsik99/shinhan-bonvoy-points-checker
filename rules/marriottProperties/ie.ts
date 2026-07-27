import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const irelandMarriottOfficialRows = [
  { id: "DUBDT", officialName: "The Shelbourne, Autograph Collection" },
  { id: "DUBAK", officialName: "Powerscourt Hotel, Autograph Collection" },
  { id: "DUBCG", officialName: "The College Green Hotel Dublin, Autograph Collection" },
  { id: "KKYAK", officialName: "Mount Juliet Estate, Autograph Collection" },
  { id: "GWYSI", officialName: "Sheraton Athlone Hotel" },
  { id: "DUBAL", officialName: "Aloft by Marriott Dublin City" },
  { id: "DUBOX", officialName: "Moxy Dublin City" },
  { id: "DUBXD", officialName: "Moxy Dublin Docklands" },
  { id: "ORKOX", officialName: "Moxy Cork" },
  { id: "ORKRI", officialName: "Residence Inn by Marriott Cork" },
  { id: "DUBSP", officialName: "citizenM Dublin St Patrick's" },
] as const;

export const irelandMarriottProperties: MarriottPropertySeed[] = irelandMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "IE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
