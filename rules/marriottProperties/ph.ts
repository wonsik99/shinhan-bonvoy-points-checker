import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott destination page property codes, July 2026.
const philippinesOfficialRows = [
  { id: "CEBFM", officialName: "Fairfield by Marriott Cebu Mandaue City" },
  { id: "CEBSI", officialName: "Sheraton Cebu Mactan Resort" },
  { id: "ILOCY", officialName: "Courtyard by Marriott Iloilo" },
  { id: "CEBFI", officialName: "Fairfield by Marriott Cebu Mactan" },
  { id: "MNLFS", officialName: "The Farm at San Benito, Autograph Collection" },
  { id: "CRKMC", officialName: "Clark Marriott Hotel" },
  { id: "MPHBP", officialName: "Four Points by Sheraton Boracay" },
  { id: "MNLSB", officialName: "Sheraton Manila Bay" },
  { id: "MNLWP", officialName: "The Westin Manila" },
  { id: "MNLSI", officialName: "Sheraton Manila Hotel at Newport World Resorts" },
  { id: "MNLAP", officialName: "Manila Marriott Hotel at Newport World Resorts" },
  { id: "MNLAC", officialName: "AC Hotel by Marriott Manila" },
  { id: "PPSFP", officialName: "Four Points by Sheraton Palawan Puerto Princesa" },
];

export const philippinesMarriottProperties: MarriottProperty[] =
  philippinesOfficialRows.map(({ id, officialName }) => ({
    id: `ph-${id.toLowerCase()}`,
    country: "PH",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    brandGroup: high.brandGroup,
    confidence: high.confidence,
    status: high.status,
    aliases: [],
    reason: `${officialName}은 Marriott Bonvoy 계열 호텔로 확인된 필리핀 호텔입니다.`,
  }));
