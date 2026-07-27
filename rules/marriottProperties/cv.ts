import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott HWS property XML, July 2026.
const capeVerdeMarriottOfficialRows = [
  { id: "VXEFP", officialName: "Four Points by Sheraton São Vicente Resort" },
] as const;

export const capeVerdeMarriottProperties: MarriottPropertySeed[] =
  capeVerdeMarriottOfficialRows.map(({ id, officialName }) => ({
    id,
    country: "CV",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  }));
