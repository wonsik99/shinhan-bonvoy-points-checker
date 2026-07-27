import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const boliviaMarriottOfficialRows = [
  { id: "LPBAH", officialName: "Atix Hotel, a Member of Design Hotels™" },
  { id: "VVIMC", officialName: "Marriott Santa Cruz de la Sierra Hotel" },
  { id: "VVITX", officialName: "Los Tajibos, Santa Cruz de la Sierra, a Tribute Portfolio Hotel" },
] as const;

export const boliviaMarriottProperties: MarriottPropertySeed[] = boliviaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BO",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
