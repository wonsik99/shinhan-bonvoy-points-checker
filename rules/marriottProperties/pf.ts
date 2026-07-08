import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const frenchPolynesiaMarriottOfficialRows = [
  { id: "BOBXR", officialName: "The St. Regis Bora Bora Resort" },
  { id: "BOBWI", officialName: "The Westin Bora Bora Resort & Spa" },
] as const;

export const frenchPolynesiaMarriottProperties: MarriottProperty[] = frenchPolynesiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PF",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
