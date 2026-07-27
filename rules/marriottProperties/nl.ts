import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const netherlandsMarriottOfficialRows = [
  { id: "AMSWH", officialName: "W Amsterdam" },
  { id: "AMSCA", officialName: "The College Hotel Amsterdam, Autograph Collection" },
  { id: "GLZAK", officialName: "Hotel Nassau Breda, Autograph Collection" },
  { id: "AMSDA", officialName: "Sir Albert, Amsterdam, a Member of Design Hotels™" },
  { id: "AMSDS", officialName: "Sir Adam Hotel, Amsterdam, a Member of Design Hotels™" },
  { id: "MSTDS", officialName: "Kruisherenhotel Maastricht, a Member of Design Hotels™" },
  { id: "AMSNT", officialName: "Amsterdam Marriott Hotel" },
  { id: "RTMMC", officialName: "The Hague Marriott Hotel" },
  { id: "RTMMN", officialName: "Rotterdam Marriott Hotel" },
  { id: "AMSRA", officialName: "Renaissance Amsterdam Schiphol Airport Hotel" },
  { id: "AMSRD", officialName: "Renaissance Amsterdam Hotel" },
  { id: "AMSSI", officialName: "Sheraton Amsterdam Airport Hotel and Conference Center" },
  { id: "AMSPO", officialName: "Apollo Hotel Amsterdam, a Tribute Portfolio Hotel" },
  { id: "AMSCT", officialName: "Corendon Amsterdam New-West, a Tribute Portfolio Hotel" },
  { id: "AMSVT", officialName: "Corendon Amsterdam Schiphol Airport, a Tribute Portfolio Hotel" },
  { id: "EINTX", officialName: "The Den, ‘s-Hertogenbosch, a Tribute Portfolio Hotel" },
  { id: "NRNNT", officialName: "The Rebyl, Nijmegen, a Tribute Portfolio Hotel" },
  { id: "AMSAA", officialName: "Courtyard by Marriott Amsterdam" },
  { id: "AMSCY", officialName: "Courtyard by Marriott Amsterdam Airport" },
  { id: "AMSOA", officialName: "Moxy Amsterdam Schiphol Airport" },
  { id: "AMSOX", officialName: "Moxy Amsterdam Houthavens" },
  { id: "AMSOU", officialName: "Moxy Utrecht" },
  { id: "RTMOX", officialName: "Moxy The Hague" },
  { id: "AMSEL", officialName: "Element by Marriott Amsterdam" },
  { id: "AMSRI", officialName: "Residence Inn by Marriott Amsterdam Houthavens" },
  { id: "AMSBI", officialName: "Residence Inn by Marriott Amsterdam Schiphol Airport" },
  { id: "RTMRI", officialName: "Residence Inn by Marriott The Hague" },
  { id: "AMSMA", officialName: "citizenM Amsterdam Amstel" },
  { id: "AMSMZ", officialName: "citizenM Amsterdam South" },
  { id: "AMSSA", officialName: "citizenM Amsterdam Airport Schiphol" },
  { id: "RTMCM", officialName: "citizenM Rotterdam" },
] as const;

export const netherlandsMarriottProperties: MarriottPropertySeed[] = netherlandsMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "NL",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
