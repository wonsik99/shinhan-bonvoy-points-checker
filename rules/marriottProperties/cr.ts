import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const costaRicaMarriottOfficialRows = [
  { id: "LIRCJ", officialName: "JW Marriott Costa Elena Resort & Spa, All-Inclusive" },
  { id: "SJOJW", officialName: "JW Marriott Guanacaste Beach Resort" },
  { id: "LIRWH", officialName: "W Costa Rica - Reserva Conchal" },
  { id: "LIRPH", officialName: "Planet Hollywood Costa Rica by Royalton, An Autograph Collection All-Inclusive Resort" },
  { id: "LIREL", officialName: "El Mangroove, Autograph Collection" },
  { id: "SJOSL", officialName: "Santa Lucia Jungle Hacienda, Costa Rica, Autograph Collection" },
  { id: "SJODE", officialName: "Delta Hotels by Marriott San Jose Aurola" },
  { id: "LIRHB", officialName: "Hotel Belmar, a Member of Design Hotels™" },
  { id: "LIREH", officialName: "Esh Hotel & Spa, a Member of Design Hotels™" },
  { id: "SJOCR", officialName: "Costa Rica Marriott Hotel Hacienda Belen" },
  { id: "SJOLS", officialName: "Los Suenos Marriott Ocean & Golf Resort" },
  { id: "SJOMV", officialName: "Marriott Vacation Club at Los Sueños" },
  { id: "SJOSI", officialName: "Sheraton San Jose Hotel, Costa Rica" },
  { id: "LIRWI", officialName: "The Westin Reserva Conchal, an All-Inclusive Golf Resort & Spa" },
  { id: "SJOAR", officialName: "AC Hotel San Jose Escazu" },
  { id: "SJOAA", officialName: "AC Hotel San Jose Airport Belen" },
  { id: "SJOAL", officialName: "Aloft by Marriott San Jose Hotel, Costa Rica" },
  { id: "SJOXC", officialName: "City Express by Marriott San Jose Costa Rica" },
  { id: "SJOAP", officialName: "Courtyard by Marriott San Jose Airport Alajuela" },
  { id: "SJOCY", officialName: "Courtyard by Marriott San Jose Escazu" },
  { id: "SJOFA", officialName: "Fairfield by Marriott San Jose Airport Alajuela" },
  { id: "SJOFP", officialName: "Four Points by Sheraton San Jose Costa Rica" },
  { id: "SJOPH", officialName: "Four Points by Sheraton San Jose Sabana" },
  { id: "SJORI", officialName: "Residence Inn by Marriott San Jose Escazu" },
  { id: "SJOAC", officialName: "Residence Inn by Marriott San Jose Alajuela el Coyol" },
] as const;

export const costaRicaMarriottProperties: MarriottProperty[] = costaRicaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CR",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
