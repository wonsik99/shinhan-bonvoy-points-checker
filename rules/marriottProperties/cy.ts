import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const cyprusMarriottOfficialRows = [
  { id: "PFOMD", officialName: "Parklane, a Luxury Collection Resort & Spa, Limassol" },
  { id: "LCANL", officialName: "The Landmark Nicosia, Autograph Collection" },
  { id: "LCAAN", officialName: "Amyth of Nicosia, a Member of Design Hotels™" },
  { id: "PFOPA", officialName: "Almyra, a Member of Design Hotels" },
] as const;

export const cyprusMarriottProperties: MarriottPropertySeed[] = cyprusMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CY",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
