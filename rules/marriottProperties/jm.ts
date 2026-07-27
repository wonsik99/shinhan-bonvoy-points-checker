import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const jamaicaMarriottOfficialRows = [
  { id: "MBJGN", officialName: "Grand Lido Negril Au-Naturel, An Autograph Collection All-Inclusive Resort - Adults Only" },
  { id: "MBJHN", officialName: "Royalton Hideaway Negril, An Autograph Collection All-Inclusive Resort - Adults Only" },
  { id: "MBJRB", officialName: "Royalton Blue Waters Montego Bay, An Autograph Collection All-Inclusive Resort" },
  { id: "MBJRN", officialName: "Royalton Negril, An Autograph Collection All-Inclusive Resort" },
  { id: "MBJRW", officialName: "Royalton Hideaway Blue Waters - Montego Bay, Autograph Collection All-Inclusive Resort - Adults Only" },
  { id: "KINAR", officialName: "AC Hotel Kingston, Jamaica" },
  { id: "KINCY", officialName: "Courtyard by Marriott Kingston, Jamaica" },
] as const;

export const jamaicaMarriottProperties: MarriottPropertySeed[] = jamaicaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "JM",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
