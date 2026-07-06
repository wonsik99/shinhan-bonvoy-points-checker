import type { MerchantRule } from "@/types/transaction";

export const marriottKeywords = [
  "MARRIOTT",
  "COURTYARD",
  "FAIRFIELD",
  "TOWNEPLACE",
  "RESIDENCE INN",
  "SPRINGHILL",
  "SHERATON",
  "WESTIN",
  "JW MARRIOTT",
  "AUTOGRAPH",
  "ALOFT",
  "AC HOTEL",
  "MOXY",
  "ELEMENT",
  "FOUR POINTS",
  "RITZ",
  "ST REGIS",
  "ST. REGIS",
  "W HOTEL",
  "LE MERIDIEN",
  "TRIBUTE",
  "EDITION",
  "GAYLORD",
  "POSTCARD CABINS",
  "TIAD",
];

export const knownMerchantRules: MerchantRule[] = [
  {
    pattern: "TIAD",
    normalizedName: "TIAD, Autograph Collection",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "TIAD is a known Autograph Collection hotel.",
  },
  {
    pattern: "POSTCARD CABINS",
    normalizedName: "Postcard Cabins / Outdoor Collection by Marriott Bonvoy",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "Postcard Cabins is associated with Marriott Bonvoy Outdoor Collection.",
  },
  {
    pattern: "HOTEL CLEVELAND",
    normalizedName: "Hotel Cleveland, Autograph Collection",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "Known Marriott Autograph Collection property.",
  },
  {
    pattern: "HOTEL 55 CHICAGO",
    normalizedName: "Hotel 55 Chicago",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason: "Hotel-like merchant with prior user suspicion; needs confirmation.",
  },
];

export const hotelLikeKeywords = [
  "HOTEL",
  "INN",
  "SUITES",
  "LODGE",
  "RESORT",
  "CABINS",
];
