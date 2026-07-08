import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const puertoRicoMarriottOfficialRows = [
  { id: "SJULC", officialName: "La Concha Resort, Puerto Rico, Autograph Collection" },
  { id: "SJUAO", officialName: "Alma San Juan, Puerto Rico, Autograph Collection" },
  { id: "SJUPR", officialName: "San Juan Marriott Resort & Stellaris Casino" },
  { id: "SJUSI", officialName: "Sheraton Puerto Rico Resort & Casino" },
  { id: "SJUTX", officialName: "Hotel Rumbao, a Tribute Portfolio Hotel" },
  { id: "SJUAC", officialName: "AC Hotel San Juan Condado" },
  { id: "PSEAL", officialName: "Aloft by Marriott Ponce Hotel & Casino" },
  { id: "SJUAL", officialName: "Aloft by Marriott San Juan" },
  { id: "BQNCY", officialName: "Courtyard by Marriott Aguadilla" },
  { id: "SJUIV", officialName: "Courtyard by Marriott Isla Verde Beach Resort" },
  { id: "SJUMR", officialName: "Courtyard by Marriott San Juan Miramar" },
  { id: "SJULU", officialName: "Fairfield by Marriott Luquillo Beach" },
  { id: "SJUFP", officialName: "Four Points by Sheraton Caguas Real Hotel & Casino" },
  { id: "SJUTJ", officialName: "Casa Costera, Isla Verde Beach, Apartments by Marriott Bonvoy" },
  { id: "SJURV", officialName: "Residence Inn by Marriott San Juan Isla Verde" },
] as const;

export const puertoRicoMarriottProperties: MarriottProperty[] = puertoRicoMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "PR",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
