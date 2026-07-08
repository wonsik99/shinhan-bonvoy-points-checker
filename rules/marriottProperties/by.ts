import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const belarusMarriottOfficialRows = [
  { id: "MHPMC", officialName: "Minsk Marriott Hotel" },
] as const;

export const belarusMarriottProperties: MarriottProperty[] = belarusMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BY",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
