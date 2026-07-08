import { high, inferBrand, propertyId } from "./helpers";
import type { MarriottProperty } from "./types";

const singaporeOfficialNames = [
  "Duxton Reserve Singapore, Autograph Collection",
  "Maxwell Reserve Singapore, Autograph Collection",
  "JW Marriott Hotel Singapore South Beach",
  "Frasers House, a Luxury Collection Hotel, Singapore",
  "Aloft by Marriott Singapore Novena",
  "The Ritz-Carlton, Millenia Singapore",
  "The Westin Singapore",
  "Four Points by Sheraton Singapore, Riverview",
  "The Vagabond Club, Singapore, a Tribute Portfolio Hotel",
  "The Warehouse Hotel, Singapore, a Member of Design Hotels™",
  "The Singapore EDITION",
  "W Singapore - Sentosa Cove",
  "Courtyard by Marriott Singapore Novena",
  "Varel Singapore, a Tribute Portfolio Hotel",
  "The St. Regis Singapore",
  "The Serangoon House Little India, Singapore, a Tribute Portfolio Hotel",
  "21 Carpenter, Singapore, a Member of Design Hotels",
  "Genting Hotel Jurong",
  "Sheraton Towers Singapore",
  "Singapore Marriott Tang Plaza Hotel",
  "The Laurus, a Luxury Collection Resort, Singapore",
];

export const singaporeMarriottProperties: MarriottProperty[] =
  singaporeOfficialNames.map((officialName) => ({
    id: propertyId("SG", officialName),
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
