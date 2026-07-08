import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const croatiaMarriottOfficialRows = [
  { id: "RJKCK", officialName: "The Isolano, Cres, Autograph Collection" },
  { id: "SPUBV", officialName: "Boutique Hotel Venturo, a Member of Design Hotels™" },
  { id: "SPUMD", officialName: "Le Méridien Lav, Split" },
  { id: "RJKOM", officialName: "Opatija Marriott Resort & Spa" },
  { id: "DBVSI", officialName: "Sheraton Dubrovnik Riviera Hotel" },
  { id: "ZAGSI", officialName: "Sheraton Zagreb Hotel" },
  { id: "RJKTX", officialName: "Jadran, Rijeka, a Tribute Portfolio Hotel" },
  { id: "ZAGWI", officialName: "The Westin Zagreb" },
  { id: "SPUAC", officialName: "AC Hotel Split" },
] as const;

export const croatiaMarriottProperties: MarriottProperty[] = croatiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "HR",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
