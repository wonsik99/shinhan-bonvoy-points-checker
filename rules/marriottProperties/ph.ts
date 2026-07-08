import { high, inferBrand, propertyId } from "./helpers";
import type { MarriottProperty } from "./types";

const philippinesOfficialNames = [
  "Fairfield by Marriott Cebu Mandaue City",
  "Sheraton Cebu Mactan Resort",
  "Courtyard by Marriott Iloilo",
  "Fairfield by Marriott Cebu Mactan",
  "The Farm at San Benito, Autograph Collection",
  "Clark Marriott Hotel",
  "Four Points by Sheraton Boracay",
  "Sheraton Manila Bay",
  "The Westin Manila",
  "Sheraton Manila Hotel at Newport World Resorts",
  "Manila Marriott Hotel at Newport World Resorts",
  "AC Hotel by Marriott Manila",
  "Four Points by Sheraton Palawan Puerto Princesa",
];

export const philippinesMarriottProperties: MarriottProperty[] =
  philippinesOfficialNames.map((officialName) => ({
    id: propertyId("PH", officialName),
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
