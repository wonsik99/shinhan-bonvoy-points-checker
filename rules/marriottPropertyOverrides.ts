import {
  candidate,
  contains,
  exact,
  high,
  needsReviewReason,
} from "./marriottProperties/helpers";
import type {
  MarriottPropertyAlias,
  MarriottPropertySeed,
} from "./marriottProperties/types";

/**
 * Human-reviewed statement aliases attached to generated official directory
 * rows live here. Korea remains a deliberately hand-curated property file.
 * Keys are stable application property IDs rather than official hotel names,
 * so a Marriott rename cannot silently detach a curated alias.
 */
export const curatedMarriottPropertyAliases: Readonly<
  Record<string, readonly MarriottPropertyAlias[]>
> = {
  // Former hotel names retained across Marriott property-code migrations.
  BGIAU: [contains("TURTLE BEACH BY ELEGANT HOTELS ALL-INCLUSIVE", high)],
  CUNWO: [contains("THE WESTIN RESORT & SPA, CANCUN", high)],
  ILPMD: [contains("LE MERIDIEN ILE DES PINS", high)],
  NOUMD: [contains("LE MERIDIEN NOUMEA RESORT & SPA", high)],
  NOUSI: [
    contains("SHERATON NEW CALEDONIA DEVA SPA & GOLF RESORT", high),
  ],
  PVRWI: [contains("THE WESTIN RESORT & SPA, PUERTO VALLARTA", high)],
  // Confirmed Shinhan overseas statement merchants.
  MADPP: [exact("PRINCESA PLAZA MADRID FOH", high)],
  ISTDC: [contains("DECAMONDO HOTEL", high)],
  // Truncated/glued and former Japanese statement names.
  "jp-ctscy": [contains("CYMARRIOTTSAPPOR", high)],
  "jp-osaoo": [exact("MOXY OSAKA SHIN UMEDA", high)],
  // Confirmed Chinese hotel/operator statement names.
  "cn-dlcdp": [contains("LKL*DALIANFUMAOJIUDIAN", high)],
  "cn-taoqs": [contains("QING DAO LV CHENG HUA CHU", high)],
  "cn-xiyox": [contains("Y P H Y HOTEL MANAGEMENT", high)],
  // Confirmed U.S. statement variants.
  "us-chidb": [contains("HOTEL 55 CHICAGO", high)],
  "us-flgsx": [contains("SKY ROCK INN OF SEDONA", high)],
  "us-psphr": [
    contains("HOTEL RESET TWENTYNINE PALMS JOSHUA TREE NATIONAL PARK", high),
  ],
  // Vinpearl also operates non-Marriott hotels, so the bare operator needs review.
  "vn-sgnak": [
    contains("CTY CP VINPEARL", {
      ...candidate,
      reason: needsReviewReason,
    }),
  ],
  // Common statement spellings and former display names.
  "it-bvlgari-hotel-milano": [contains("BULGARI HOTEL MILANO")],
  "it-bvlgari-hotel-roma": [contains("BULGARI HOTEL ROMA")],
  "it-ortea-palace-hotel-sicily-autograph-collection": [
    contains("ORTEA LUXURY PALACE"),
    contains("ORTEA PALACE"),
  ],
};

export function applyCuratedMarriottPropertyAliases(
  property: MarriottPropertySeed
): MarriottPropertySeed {
  const aliases = curatedMarriottPropertyAliases[property.id];
  if (!aliases) {
    return property;
  }

  return {
    ...property,
    aliases: [...property.aliases, ...aliases],
  };
}
