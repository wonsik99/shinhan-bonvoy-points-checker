import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const maltaMarriottOfficialRows = [
  { id: "MLACG", officialName: "Cugó Gran Macina Malta, a Member of Design Hotels™" },
  { id: "MLAWI", officialName: "The Westin Dragonara Resort, Malta" },
  { id: "MLASJ", officialName: "AC Hotel St. Julian's" },
  { id: "MLASC", officialName: "Courtyard by Marriott Sliema" },
  { id: "MLASX", officialName: "Moxy St. Julian's Malta" },
  { id: "MLAMC", officialName: "Malta Marriott Resort And Spa" },
] as const;

export const maltaMarriottProperties: MarriottPropertySeed[] = maltaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "MT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
