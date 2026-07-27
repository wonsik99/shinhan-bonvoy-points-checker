import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const dominicanRepublicMarriottOfficialRows = [
  { id: "POPLC", officialName: "The Ocean Club, a Luxury Collection Resort, Costa Norte" },
  { id: "PUJLC", officialName: "Sanctuary Cap Cana, a Luxury Collection Resort, Dominican Republic, Adult All-Inclusive" },
  { id: "SDQJW", officialName: "JW Marriott Hotel Santo Domingo" },
  { id: "PUJRX", officialName: "The Residences at The St. Regis Cap Cana Resort" },
  { id: "PUJXR", officialName: "The St. Regis Cap Cana Resort" },
  { id: "PUJWH", officialName: "W Punta Cana, Adult All-Inclusive" },
  { id: "AZSAK", officialName: "Donoma Las Terrenas Beach Resort & Spa, Autograph Collection" },
  { id: "PUJHI", officialName: "Royalton Hideaway Punta Cana, An Autograph Collection All-Inclusive Resort & Casino – Adults Only" },
  { id: "PUJRB", officialName: "Royalton Bavaro, An Autograph Collection All-Inclusive Resort & Casino" },
  { id: "PUJRO", officialName: "Royalton Punta Cana, An Autograph Collection All-Inclusive Resort & Casino" },
  { id: "PUJRS", officialName: "Royalton Splash Punta Cana, An Autograph Collection All-Inclusive Resort & Casino" },
  { id: "PUJRC", officialName: "Royalton CHIC Punta Cana, An Autograph Collection All-Inclusive Resort & Casino - Adults Only" },
  { id: "PUJSM", officialName: "Marriott Miches Beach, An All-Inclusive Resort" },
  { id: "SDQMC", officialName: "Santo Domingo Marriott Hotel Piantini" },
  { id: "SDQGW", officialName: "Renaissance Santo Domingo Jaragua Hotel & Casino" },
  { id: "SDQDS", officialName: "Sheraton Santo Domingo Hotel" },
  { id: "PUJWI", officialName: "The Westin Puntacana Resort" },
  { id: "PUJAC", officialName: "AC Hotel Punta Cana" },
  { id: "STIAC", officialName: "AC Hotel Santiago de los Caballeros" },
  { id: "SDQAL", officialName: "Aloft by Marriott Santo Domingo Piantini" },
  { id: "SDQCY", officialName: "Courtyard by Marriott Santo Domingo" },
  { id: "SDQCD", officialName: "Courtyard by Marriott Santo Domingo Piantini" },
  { id: "PUJFP", officialName: "Four Points by Sheraton Puntacana" },
  { id: "SDQFP", officialName: "Four Points by Sheraton Santo Domingo" },
  { id: "STIRI", officialName: "Residence Inn by Marriott Santiago de los Caballeros" },
] as const;

export const dominicanRepublicMarriottProperties: MarriottPropertySeed[] = dominicanRepublicMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "DO",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
