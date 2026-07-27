import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const czechRepublicMarriottOfficialRows = [
  { id: "PRGWH", officialName: "W Prague" },
  { id: "PRGSP", officialName: "Sir Prague, a Member Design Hotels" },
  { id: "PRGDT", officialName: "Prague Marriott Hotel" },
  { id: "PRGTX", officialName: "Stages Hotel Prague, a Tribute Portfolio Hotel" },
  { id: "BRQCY", officialName: "Courtyard by Marriott Brno" },
  { id: "PRGCY", officialName: "Courtyard by Marriott Prague City" },
  { id: "PRGPA", officialName: "Courtyard by Marriott Prague Airport" },
  { id: "PRGPZ", officialName: "Courtyard by Marriott Pilsen" },
] as const;

export const czechRepublicMarriottProperties: MarriottPropertySeed[] = czechRepublicMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
