import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const seychellesMarriottOfficialRows = [
  { id: "SEZEI", officialName: "Enchanted Island Resort" },
  { id: "SEZTX", officialName: "laïla, Seychelles, a Tribute Portfolio Resort" },
] as const;

export const seychellesMarriottProperties: MarriottProperty[] = seychellesMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SC",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
