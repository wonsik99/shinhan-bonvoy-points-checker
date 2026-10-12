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
  // Former display names retained after the August 2026 official rename review.
  MEXJS: [
    contains("CITY EXPRESS JUNIOR BY MARRIOTT CIUDAD DE MEXICO SULLIVAN", high),
  ],
  YYZPX: [contains("CITY EXPRESS BY MARRIOTT PORT HOPE", high)],
  "jp-osaal": [contains("ALOFT BY MARRIOTT OSAKA DOJIMA", high)],
  "cn-zhaxp": [
    contains("FOUR POINTS BY SHERATON ZHANJIANG XIASHAN", high),
  ],
  "cn-szxbr": [contains("RENAISSANCE SHENZHEN LUOHU", high)],
  "us-atlhf": [contains("FAIRFIELD INN & SUITES BETHLEHEM", high)],
  "us-cidwa": [contains("AC BY MARRIOTT CEDAR RAPIDS WEST", high)],
  "us-houmd": [
    contains("COURTYARD BY MARRIOTT HOUSTON MEDICAL CENTER/NRG PARK", high),
  ],
  "us-hourw": [
    contains("RESIDENCE INN BY MARRIOTT HOUSTON MEDICAL CENTER/NRG PARK", high),
  ],
  "us-ilgri": [
    contains("RESIDENCE INN BY MARRIOTT WILMINGTON BRANDYWINE", high),
  ],
  "us-rdmxa": [
    contains("CITY EXPRESS BY MARRIOTT REDMOND BEND AIRPORT", high),
  ],
  "us-savak": [
    contains("THE BOHEMIAN HOTEL SAVANNAH RIVERFRONT", high),
    contains("BOHEMIAN HOTEL SAVANNAH RIVERFRONT, AUTOGRAPH COLLECTION", high),
  ],
  "us-stlal": [contains("ALOFT BY MARRIOTT ST. LOUIS CORTEX", high)],
  "us-xnark": [contains("HOTEL VIN, ROGERS, AUTOGRAPH COLLECTION", high)],
  PUJWH: [contains("W PUNTA CANA ALL-INCLUSIVE", high)],
  // Former display names retained after the September 2026 official review.
  "us-abeeh": [contains("SPRINGHILL SUITES BY MARRIOTT EASTON PA", high)],
  "us-abefa": [contains("FAIRFIELD BY MARRIOTT INN & SUITES BETHLEHEM PA", high)],
  "us-atllp": [contains("RESIDENCE INN BY MARRIOTT ATLANTA BUCKHEAD/LENOX PARK", high)],
  "us-ausfw": [contains("FAIRFIELD INN & SUITES AUSTIN WEST", high)],
  "us-dalfp": [contains("FAIRFIELD BY MARRIOTT INN & SUITES DALLAS PLANO", high)],
  "us-mcoak": [contains("GRAND BOHEMIAN ORLANDO, AUTOGRAPH COLLECTION", high)],
  "us-miasp": [contains("UNFRAMED, AUTOGRAPH COLLECTION", high)],
  "us-phxmr": [contains("STUDIORES BY MARRIOTT MESA", high)],
  "us-sbyot": [contains("ASHORE OCEANFRONT HOTEL", high)],
  "us-stfct": [contains("STAMFORD MARRIOTT HOTEL & SPA", high)],
  PSECX: [contains("CITY CENTRO BY MARRIOTT PONCE PLAZA PUERTO RICO", high)],
  SZKAK: [contains("LEOPARD SANDS, KRUGER PARK", high)],
  // Aliases carried forward when reviewed July holds became active.
  BEGAC: [contains("AC HOTEL BELGRADE AIRPORT CITY", high)],
  ISTXA: [contains("FOUR POINTS FLEX ISTANBUL AIRPORT", high)],
  "cn-csxpf": [contains("FOUR POINTS CHANGSHA SOUTH STATION", high)],
  "cn-xmnxw": [contains("WESTIN XIAMEN XIANG'AN", high)],
  "us-mqtts": [contains("TOWNEPLACE SUITES MARQUETTE", high)],
  "us-snaaf": [exact("FAIRFIELD INN & SUITES ANAHEIM RESORT", high)],
  "us-snaal": [exact("SPRINGHILL SUITES ANAHEIM RESORT", high)],
  "us-waswf": [contains("THE POTOMAC HOTEL", high)],
  // Confirmed Shinhan overseas statement merchants.
  MADPP: [exact("PRINCESA PLAZA MADRID FOH", high)],
  ISTDC: [contains("DECAMONDO HOTEL", high)],
  // Truncated/glued and former Japanese statement names.
  "jp-ctscy": [contains("CYMARRIOTTSAPPOR", high)],
  "jp-ngoxf": [exact("FPF NAGOYA STATION", high)],
  "jp-osaoo": [exact("MOXY OSAKA SHIN UMEDA", high)],
  // Verified Malaysian Shinhan overseas statement spelling.
  "my-kuldt": [exact("JW MARRIOT HOTEL KL", high)],
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
