import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const portugalMarriottOfficialRows = [
  { id: "FAOLC", officialName: "Pine Cliffs Residence, a Luxury Collection Resort, Algarve" },
  { id: "FAOPL", officialName: "Pine Cliffs Hotel, a Luxury Collection Resort, Algarve" },
  { id: "FAOPC", officialName: "Pine Cliffs Ocean Suites, a Luxury Collection Resort & Spa, Algarve" },
  { id: "FAOWH", officialName: "W Algarve" },
  { id: "FAOWR", officialName: "W Residences Algarve" },
  { id: "FAOAK", officialName: "Domes Lake Algarve, Autograph Collection" },
  { id: "LISTI", officialName: "The Ivens, Autograph Collection" },
  { id: "OPOLG", officialName: "Forte de Gaia, Autograph Collection" },
  { id: "PDLDE", officialName: "Delta Hotels Azores" },
  { id: "LISDM", officialName: "Memmo Principe Real, Lisbon, a Member of Design Hotels™" },
  { id: "LISDT", officialName: "Torre de Palma Wine Hotel, Monforte, a Member of Design Hotels™" },
  { id: "LISEI", officialName: "Immerso Hotel, a Member of Design Hotels™" },
  { id: "LISAB", officialName: "Altis Belém Hotel & Spa, a Member of Design Hotels™" },
  { id: "FAOPV", officialName: "Marriott Residences Salgados Resort, Algarve" },
  { id: "FAOSP", officialName: "Algarve Marriott Salgados Golf Resort & Spa" },
  { id: "LISPT", officialName: "Lisbon Marriott Hotel" },
  { id: "LISDR", officialName: "Praia D'El Rey Marriott Golf & Beach Resort" },
  { id: "OPOBR", officialName: "Renaissance Porto Lapa Hotel" },
  { id: "LISSI", officialName: "Sheraton Lisboa Hotel & Spa" },
  { id: "LISSC", officialName: "Sheraton Cascais Resort" },
  { id: "OPOSI", officialName: "Sheraton Porto Hotel & Spa" },
  { id: "OPOGT", officialName: "Origine Porto Gaia, a Tribute Portfolio Hotel" },
  { id: "FAOAA", officialName: "The Westin Salgados Beach Resort, Algarve" },
  { id: "OPOPO", officialName: "AC Hotel Porto" },
  { id: "LISFP", officialName: "Four Points by Sheraton Sesimbra" },
  { id: "OPOFP", officialName: "Four Points by Sheraton Matosinhos" },
  { id: "LISOX", officialName: "Moxy Lisboa Oriente" },
  { id: "LISOP", officialName: "Moxy Lisbon City" },
  { id: "LISXA", officialName: "Moxy Alfragide Lisboa" },
  { id: "LISRI", officialName: "Residence Inn by Marriott Lisbon" },
] as const;

export const portugalMarriottProperties: MarriottProperty[] = portugalMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PT",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
