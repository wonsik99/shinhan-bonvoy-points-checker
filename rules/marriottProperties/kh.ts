import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const cambodiaMarriottOfficialRows = [
  { id: "REPMD", officialName: "Le Méridien Angkor" },
  { id: "PNHCY", officialName: "Courtyard by Marriott Phnom Penh" },
  { id: "REPCY", officialName: "Courtyard by Marriott Siem Reap Resort" },
  { id: "PNHFI", officialName: "Fairfield by Marriott Phnom Penh" },
] as const;

export const cambodiaMarriottProperties: MarriottProperty[] = cambodiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "KH",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
