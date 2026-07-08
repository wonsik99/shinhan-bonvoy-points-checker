import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const chileMarriottOfficialRows = [
  { id: "SCLWH", officialName: "W Santiago" },
  { id: "SCLHP", officialName: "Le Méridien Santiago" },
  { id: "SCLDT", officialName: "Santiago Marriott Hotel" },
  { id: "SCLBR", officialName: "Renaissance Santiago Hotel" },
  { id: "KNASI", officialName: "Sheraton Miramar Hotel & Convention Center" },
  { id: "SCLSI", officialName: "Sheraton Santiago Hotel and Convention Center" },
  { id: "SCLAC", officialName: "AC Hotel Santiago Cenco Costanera" },
  { id: "SCLXO", officialName: "City Express by Marriott Santiago Aeropuerto Chile" },
  { id: "PMCCY", officialName: "Courtyard by Marriott Puerto Montt" },
  { id: "SCLCS", officialName: "Courtyard by Marriott Santiago Las Condes" },
  { id: "SCLCA", officialName: "Courtyard by Marriott Santiago Airport" },
  { id: "LSQFP", officialName: "Four Points by Sheraton Los Angeles" },
  { id: "SCLFP", officialName: "Four Points by Sheraton Santiago" },
] as const;

export const chileMarriottProperties: MarriottProperty[] = chileMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CL",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
