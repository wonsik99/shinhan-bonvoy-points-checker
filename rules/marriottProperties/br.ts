import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const brazilMarriottOfficialRows = [
  { id: "RIOMC", officialName: "JW Marriott Hotel Rio de Janeiro" },
  { id: "SAOJW", officialName: "JW Marriott Hotel Sao Paulo" },
  { id: "SAOWH", officialName: "W São Paulo" },
  { id: "SAOAP", officialName: "Sao Paulo Airport Marriott Hotel" },
  { id: "SAOBR", officialName: "Renaissance Sao Paulo Hotel" },
  { id: "RIOSI", officialName: "Sheraton Grand Rio Hotel & Resort" },
  { id: "SAOSI", officialName: "Sheraton Sao Paulo WTC Hotel" },
  { id: "SAOSS", officialName: "Sheraton Santos Hotel" },
  { id: "VIXSI", officialName: "Sheraton Vitoria Hotel" },
  { id: "MAOTX", officialName: "Tropical Hotel da Amazonia, a Tribute Portfolio Hotel" },
  { id: "RECPG", officialName: "The Westin Porto de Galinhas, an All-Inclusive Resort" },
  { id: "SAOWI", officialName: "The Westin Sao Paulo" },
  { id: "RIOCX", officialName: "City Express Rio de Janeiro Barra da Tijuca" },
  { id: "RIOCY", officialName: "Courtyard by Marriott Rio de Janeiro Barra da Tijuca" },
  { id: "SAOER", officialName: "Marriott Executive Apartments Sao Paulo" },
  { id: "RIORI", officialName: "Residence Inn by Marriott Rio de Janeiro Barra da Tijuca" },
] as const;

export const brazilMarriottProperties: MarriottProperty[] = brazilMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "BR",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
