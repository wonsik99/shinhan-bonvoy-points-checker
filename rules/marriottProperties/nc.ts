import { applyCuratedMarriottPropertyAliases } from "../marriottPropertyOverrides";
import { high, inferBrand } from "./helpers";
import type { MarriottOfficialRow, MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const newCaledoniaMarriottOfficialRows: readonly MarriottOfficialRow[] = [
  {
    id: "ILPMD",
    propertyCode: "ILPSE",
    formerPropertyCodes: ["ILPMD"],
    officialName: "Le Domaine Oro, Series by Marriott",
  },
  {
    id: "NOUMD",
    propertyCode: "NOUSR",
    formerPropertyCodes: ["NOUMD"],
    officialName: "Le Domaine Nouméa, Series by Marriott",
  },
  {
    id: "NOUSI",
    propertyCode: "NOUDR",
    formerPropertyCodes: ["NOUSI"],
    officialName: "Le Domaine Deva, Series by Marriott",
  },
];

export const newCaledoniaMarriottProperties: MarriottPropertySeed[] = newCaledoniaMarriottOfficialRows.map(
  ({ id, propertyCode, formerPropertyCodes, officialName }) =>
    applyCuratedMarriottPropertyAliases({
    id,
    propertyCode,
    formerPropertyCodes,
    country: "NC",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
