import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const nigeriaMarriottOfficialRows = [
  { id: "LOSLG", officialName: "Lagos Marriott Hotel Ikeja" },
  { id: "LOSSI", officialName: "Sheraton Lagos Hotel" },
  { id: "LOSFP", officialName: "Four Points by Sheraton Lagos" },
  { id: "QUOFP", officialName: "Four Points by Sheraton Ikot Ekpene" },
  { id: "BNISE", officialName: "Protea Hotel Benin City Select Emotan" },
  { id: "LOSPK", officialName: "Protea Hotel Lagos Kuramo Waters" },
  { id: "LOSPR", officialName: "Protea Hotel Ikeja Select" },
  { id: "PHCPR", officialName: "Protea Hotel Owerri Select" },
  { id: "QRWDP", officialName: "Protea Hotel Delta" },
] as const;

export const nigeriaMarriottProperties: MarriottPropertySeed[] = nigeriaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "NG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
