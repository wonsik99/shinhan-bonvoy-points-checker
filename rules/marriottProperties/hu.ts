import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const hungaryMarriottOfficialRows = [
  { id: "BUDLC", officialName: "Matild Palace, a Luxury Collection Hotel, Budapest" },
  { id: "BUDXR", officialName: "The St. Regis Budapest" },
  { id: "BUDWH", officialName: "W Budapest" },
  { id: "BUDKC", officialName: "Dorothea Hotel, Budapest, Autograph Collection" },
  { id: "BUDHU", officialName: "Budapest Marriott Hotel" },
  { id: "BUDCY", officialName: "Courtyard by Marriott Budapest City Center" },
  { id: "BUDFP", officialName: "Four Points by Sheraton Kecskemet Hotel & Conference Center" },
  { id: "BUDFD", officialName: "Four Points by Sheraton Budapest Danube" },
  { id: "BUDDX", officialName: "Moxy Budapest Downtown" },
  { id: "BUDER", officialName: "Millennium Court, Budapest - Marriott Executive Apartments" },
] as const;

export const hungaryMarriottProperties: MarriottProperty[] = hungaryMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "HU",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
