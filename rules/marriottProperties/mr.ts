import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott HWS property XML, July 2026.
const mauritaniaMarriottOfficialRows = [
  { id: "NKCSI", officialName: "Sheraton Nouakchott Hotel" },
] as const;

export const mauritaniaMarriottProperties: MarriottPropertySeed[] =
  mauritaniaMarriottOfficialRows.map(({ id, officialName }) => ({
    id,
    country: "MR",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  }));
