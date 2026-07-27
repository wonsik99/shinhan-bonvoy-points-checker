import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const colombiaMarriottOfficialRows = [
  { id: "BOGJW", officialName: "JW Marriott Hotel Bogota" },
  { id: "BOGWH", officialName: "W Bogota" },
  { id: "BOGAK", officialName: "The Artisan D.C. Hotel, Autograph Collection" },
  { id: "MDELG", officialName: "The Brown, Guatape, Autograph Collection" },
  { id: "MDEWT", officialName: "Wake BioHotel, a Member of Design Hotels™" },
  { id: "MDEWM", officialName: "Wake Medellin, a Member of Design Hotels™" },
  { id: "BOGMC", officialName: "Bogota Marriott Hotel" },
  { id: "BAQMC", officialName: "Barranquilla Marriott Hotel" },
  { id: "CLOMC", officialName: "Cali Marriott Hotel" },
  { id: "MDEMC", officialName: "Medellin Marriott Hotel" },
  { id: "SMRMC", officialName: "Santa Marta Marriott Resort Playa Dormida" },
  { id: "BOGSI", officialName: "Sheraton Bogota Hotel" },
  { id: "CTGTX", officialName: "Ermita, Cartagena, a Tribute Portfolio Hotel" },
  { id: "MDETX", officialName: "Loma, Medellin, a Tribute Portfolio Hotel" },
  { id: "BOGAR", officialName: "AC Hotel Bogota Zona T" },
  { id: "SMRSM", officialName: "AC Hotel Santa Marta" },
  { id: "BOGAL", officialName: "Aloft by Marriott Bogota Airport" },
  { id: "BOGJO", officialName: "City Express Junior by Marriott Bogota Aeropuerto" },
  { id: "BOGPO", officialName: "City Express Plus by Marriott Bogota Aeropuerto" },
  { id: "CLOPC", officialName: "City Express Plus by Marriott Cali Colombia" },
  { id: "MDEPM", officialName: "City Express Plus by Marriott Medellin Colombia" },
  { id: "BOGCY", officialName: "Courtyard by Marriott Bogota Airport" },
  { id: "SMRCY", officialName: "Courtyard by Marriott Santa Marta Resort" },
  { id: "BOGFI", officialName: "Fairfield by Marriott Bogota Embajada" },
  { id: "MDEFI", officialName: "Fairfield by Marriott Medellin Sabaneta" },
  { id: "BAQFP", officialName: "Four Points by Sheraton Barranquilla" },
  { id: "BOGFP", officialName: "Four Points by Sheraton Bogota" },
  { id: "BOGPT", officialName: "Four Points by Sheraton Tequendama, Bogota" },
  { id: "MDEFP", officialName: "Four Points by Sheraton Medellin" },
  { id: "BOGRI", officialName: "Residence Inn by Marriott Bogota" },
] as const;

export const colombiaMarriottProperties: MarriottPropertySeed[] = colombiaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "CO",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
