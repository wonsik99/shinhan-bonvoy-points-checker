import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const belarusMarriottOfficialRows = [
  { id: "MHPMC", officialName: "Minsk Marriott Hotel" },
] as const;

export const belarusMarriottProperties: MarriottPropertySeed[] = belarusMarriottOfficialRows.map(
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
