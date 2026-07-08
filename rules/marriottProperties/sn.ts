import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const senegalMarriottOfficialRows = [
  { id: "DSSCA", officialName: "Courtyard by Marriott Dakar Diamniadio" },
  { id: "DSSFP", officialName: "Four Points by Sheraton Dakar Diamniadio" },
] as const;

export const senegalMarriottProperties: MarriottProperty[] = senegalMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "SN",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
