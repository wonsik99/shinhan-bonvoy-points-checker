import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const kenyaMarriottOfficialRows = [
  { id: "NBOMM", officialName: "Kinara, a Luxury Collection Safari Camp, Masai Mara" },
  { id: "NBOMJ", officialName: "JW Marriott Masai Mara Lodge" },
  { id: "NBOJW", officialName: "JW Marriott Hotel Nairobi" },
  { id: "NBORJ", officialName: "JW Marriott Mount Kenya Rhino Reserve Safari Camp" },
  { id: "NBOAK", officialName: "Sankara Nairobi, Autograph Collection" },
  { id: "NBODS", officialName: "Tribe Hotel, Nairobi, a Member of Design Hotels™" },
  { id: "NBOTD", officialName: "Trademark Hotel, a Member of Design Hotels™" },
  { id: "NBOFA", officialName: "Four Points by Sheraton Nairobi Airport" },
  { id: "NBOFP", officialName: "Four Points by Sheraton Nairobi Hurlingham" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "NBOMR", officialName: "The Ritz-Carlton, Masai Mara Safari Camp" },
] as const;

export const kenyaMarriottProperties: MarriottPropertySeed[] = kenyaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "KE",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
