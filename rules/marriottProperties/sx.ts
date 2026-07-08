import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const sintMaartenMarriottOfficialRows = [
  { id: "SXMDB", officialName: "JW Marriott St. Maarten Beach Resort & Spa" },
] as const;

export const sintMaartenMarriottProperties: MarriottProperty[] = sintMaartenMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SX",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
