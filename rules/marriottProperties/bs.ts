import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const bahamasMarriottOfficialRows = [
  { id: "ELHAK", officialName: "French Leave Resort, Autograph Collection" },
  { id: "NASCT", officialName: "The Coral at Atlantis" },
  { id: "NASAK", officialName: "The Royal at Atlantis" },
  { id: "NASCV", officialName: "The Cove at Atlantis" },
  { id: "NASHB", officialName: "Harborside Resort at Atlantis" },
  { id: "NASCY", officialName: "Courtyard by Marriott Nassau Downtown/Junkanoo Beach" },
] as const;

export const bahamasMarriottProperties: MarriottPropertySeed[] = bahamasMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BS",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
