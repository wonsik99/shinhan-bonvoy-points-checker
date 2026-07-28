import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const panamaMarriottOfficialRows = [
  { id: "PTYLC", officialName: "The Santa Maria, a Luxury Collection Hotel & Golf Resort, Panama City" },
  { id: "PTYMJ", officialName: "JW Marriott Panama" },
  { id: "PTYWH", officialName: "W Panama" },
  { id: "PTYAK", officialName: "Sortis Hotel, Spa & Casino, Autograph Collection" },
  { id: "PTYKP", officialName: "The Buenaventura Golf & Beach Resort Panama, Autograph Collection" },
  { id: "PTYMD", officialName: "Le Méridien Panama" },
  { id: "PTYMC", officialName: "Marriott Panama Hotel" },
  { id: "PTYRH", officialName: "Renaissance Panama City Hotel" },
  { id: "PTYSI", officialName: "Sheraton Grand Panama" },
  { id: "PTYBW", officialName: "The Westin Playa Bonita Panama" },
  { id: "PTYWI", officialName: "The Westin Panama" },
  { id: "PTYAR", officialName: "AC Hotel Panama City" },
  { id: "PTYAL", officialName: "Aloft by Marriott Panama" },
  { id: "PTYCY", officialName: "Courtyard by Marriott Panama Multiplaza Mall" },
  { id: "PTYMM", officialName: "Courtyard by Marriott Panama Metromall" },
  { id: "PTYER", officialName: "Marriott Executive Apartments Panama City, Finisterre" },
  { id: "PTYRI", officialName: "Residence Inn by Marriott Panama City" },
] as const;

export const panamaMarriottProperties: MarriottPropertySeed[] = panamaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PA",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
