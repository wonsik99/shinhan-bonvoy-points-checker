import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const swedenMarriottOfficialRows = [
  { id: "STORP", officialName: "Hagastrand, Autograph Collection" },
  { id: "STOCL", officialName: "Miss Clara by Nobis, Stockholm, a Member of Design Hotels™" },
  { id: "STODN", officialName: "Blique by Nobis, Stockholm, a Member of Design Hotels™" },
  { id: "STONB", officialName: "Nobis Hotel Stockholm, a Member of Design Hotels™" },
  { id: "STOSK", officialName: "Hotel Skeppsholmen, Stockholm, a Member of Design Hotels™" },
  { id: "STODS", officialName: "Hotel J, Stockholm, a Member of Design Hotels™" },
  { id: "STOSD", officialName: "Stallmästaregarden, Stockholm, a Member of Design Hotels™" },
  { id: "STOSI", officialName: "Sheraton Stockholm Hotel" },
  { id: "STOAR", officialName: "AC Hotel Stockholm Ulriksdal" },
  { id: "STOCY", officialName: "Courtyard by Marriott Stockholm Kungsholmen" },
] as const;

export const swedenMarriottProperties: MarriottPropertySeed[] = swedenMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
