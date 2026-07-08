import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const tanzaniaMarriottOfficialRows = [
  { id: "JROSK", officialName: "Mapito Safari Camp, Serengeti, Autograph Collection" },
  { id: "ZNZAK", officialName: "Le Mersenne Zanzibar, Autograph Collection" },
  { id: "DARDE", officialName: "Delta Hotels Dar es Salaam" },
  { id: "ARKNT", officialName: "Turaco Ngorongoro Valley, a Tribute Portfolio Lodge" },
  { id: "ZNZST", officialName: "Turaco Spice Tree, a Tribute Portfolio Hotel" },
  { id: "ZNZNT", officialName: "Turaco Nungwi Resort, a Tribute Portfolio Hotel" },
  { id: "DARFP", officialName: "Four Points by Sheraton Dar es Salaam New Africa" },
  { id: "JROFP", officialName: "Four Points by Sheraton Arusha, The Arusha Hotel" },
  { id: "DARCO", officialName: "Protea Hotel Dar es Salaam Courtyard" },
  { id: "DARDA", officialName: "Protea Hotel Dar es Salaam Oyster Bay" },
  { id: "DAREL", officialName: "Element by Marriott Dar es Salaam" },
] as const;

export const tanzaniaMarriottProperties: MarriottProperty[] = tanzaniaMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "TZ",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
