import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott destination page property codes, July 2026.
const singaporeOfficialRows = [
  { id: "SINNV", officialName: "Aloft by Marriott Singapore Novena" },
  { id: "SINSL", officialName: "The Laurus, a Luxury Collection Resort, Singapore" },
  { id: "SINTC", officialName: "21 Carpenter, Singapore, a Member of Design Hotels" },
  { id: "SINWH", officialName: "W Singapore - Sentosa Cove" },
  { id: "SINDT", officialName: "Singapore Marriott Tang Plaza Hotel" },
  { id: "SINRZ", officialName: "The Ritz-Carlton, Millenia Singapore" },
  { id: "SINFP", officialName: "Four Points by Sheraton Singapore, Riverview" },
  { id: "SINSI", officialName: "Sheraton Towers Singapore" },
  { id: "SINDW", officialName: "The Warehouse Hotel, Singapore, a Member of Design Hotels™" },
  { id: "SINTX", officialName: "Varel Singapore, a Tribute Portfolio Hotel" },
  { id: "SINTG", officialName: "The Serangoon House Little India, Singapore, a Tribute Portfolio Hotel" },
  { id: "SINLB", officialName: "Frasers House, a Luxury Collection Hotel, Singapore" },
  { id: "SINCY", officialName: "Courtyard by Marriott Singapore Novena" },
  { id: "SINJW", officialName: "JW Marriott Hotel Singapore South Beach" },
  { id: "SINWI", officialName: "The Westin Singapore" },
  { id: "SINXR", officialName: "The St. Regis Singapore" },
  { id: "SINSP", officialName: "Genting Hotel Jurong" },
  { id: "SINEB", officialName: "The Singapore EDITION" },
  { id: "SINAM", officialName: "Maxwell Reserve Singapore, Autograph Collection" },
  { id: "SINAD", officialName: "Duxton Reserve Singapore, Autograph Collection" },
  { id: "SINVB", officialName: "The Vagabond Club, Singapore, a Tribute Portfolio Hotel" },
];

export const singaporeMarriottProperties: MarriottPropertySeed[] =
  singaporeOfficialRows.map(({ id, officialName }) => ({
    id: `sg-${id.toLowerCase()}`,
    country: "SG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    brandGroup: high.brandGroup,
    confidence: high.confidence,
    status: high.status,
    aliases: [],
    reason: `${officialName}은 Marriott Bonvoy 계열 호텔로 확인된 싱가포르 호텔입니다.`,
  }));
