import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const sriLankaMarriottOfficialRows = [
  { id: "CMBLC", officialName: "ITC Ratnadipa, a Luxury Collection Hotel, Colombo" },
  { id: "CMBMC", officialName: "Weligama Bay Marriott Resort & Spa" },
  { id: "CMBSI", officialName: "Sheraton Colombo Hotel" },
  { id: "CMBST", officialName: "Sheraton Kosgoda Turtle Beach Resort" },
  { id: "CMBCY", officialName: "Courtyard by Marriott Colombo" },
] as const;

export const sriLankaMarriottProperties: MarriottProperty[] = sriLankaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "LK",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
