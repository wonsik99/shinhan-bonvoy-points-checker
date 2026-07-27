import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const egyptMarriottOfficialRows = [
  { id: "CAIJW", officialName: "JW Marriott Hotel Cairo" },
  { id: "CAIXR", officialName: "The St. Regis Cairo" },
  { id: "CAIXA", officialName: "The St. Regis New Capital, Cairo" },
  { id: "CAIAM", officialName: "Le Méridien Cairo Airport" },
  { id: "CAIMD", officialName: "Le Méridien Pyramids Hotel & Spa" },
  { id: "CAIEG", officialName: "Cairo Marriott Hotel" },
  { id: "CAIMN", officialName: "Marriott Mena House, Cairo" },
  { id: "HRGEG", officialName: "Hurghada Marriott Beach Resort" },
  { id: "CAIBR", officialName: "Renaissance Cairo Mirage City Hotel" },
  { id: "SSHBR", officialName: "Renaissance Sharm El Sheikh Golden View Beach Resort" },
  { id: "ALYSI", officialName: "Sheraton Montazah Hotel" },
  { id: "CAISI", officialName: "Sheraton Cairo Hotel & Casino" },
  { id: "HRGSI", officialName: "Sheraton Miramar Resort El Gouna" },
  { id: "HRGSS", officialName: "Sheraton Soma Bay Resort" },
  { id: "SSHSI", officialName: "Sheraton Sharm Hotel, Resort, Villas & Spa" },
  { id: "CAIWI", officialName: "The Westin Cairo Golf Resort & Spa, Katameya Dunes" },
  // Ritz-Carlton HWS XML property codes, July 2026.
  { id: "CAIRZ", officialName: "The Nile Ritz-Carlton, Cairo" },
] as const;

export const egyptMarriottProperties: MarriottPropertySeed[] = egyptMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "EG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
