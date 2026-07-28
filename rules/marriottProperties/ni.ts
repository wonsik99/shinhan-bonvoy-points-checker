import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott HWS property XML, July 2026.
const nicaraguaMarriottOfficialRows = [
  { id: "MGACR", officialName: "City Centro by Marriott La Recolección Nicaragua" },
  { id: "MGAEX", officialName: "City Express by Marriott Estelí" },
  { id: "MGAXE", officialName: "City Express by Marriott Managua" },
] as const;

export const nicaraguaMarriottProperties: MarriottPropertySeed[] =
  nicaraguaMarriottOfficialRows.map(({ id, officialName }) => ({
    id,
    country: "NI",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  }));
