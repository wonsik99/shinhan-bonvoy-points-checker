import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott hotel sitemap property codes, July 2026.
const denmarkMarriottOfficialRows = [
  { id: "CPHDS", officialName: "Nobis Hotel Copenhagen, a Member of Design Hotels™" },
  { id: "CPHDK", officialName: "Copenhagen Marriott Hotel" },
  { id: "CPHAC", officialName: "AC Hotel Bella Sky Copenhagen" },
  { id: "CPHFI", officialName: "Fairfield by Marriott Copenhagen Nordhavn" },
  { id: "AARSF", officialName: "Four Points Flex by Sheraton Aarhus Skejby" },
  { id: "AALXF", officialName: "Four Points Flex by Sheraton Aalborg" },
  { id: "AARVF", officialName: "Four Points Flex by Sheraton Aarhus Viby" },
  { id: "BLLVF", officialName: "Four Points Flex by Sheraton Vejle" },
  { id: "BLLHF", officialName: "Four Points Flex by Sheraton Horsens" },
  { id: "CPHNF", officialName: "Four Points Flex by Sheraton Copenhagen Arena" },
  { id: "CPHLF", officialName: "Four Points Flex by Sheraton Lyngby" },
  { id: "CPHHF", officialName: "Four Points Flex by Sheraton Hillerod" },
  { id: "CPHCF", officialName: "Four Points Flex by Sheraton Copenhagen City" },
  { id: "CPHAF", officialName: "Four Points Flex by Sheraton Copenhagen Airport" },
  { id: "CPHIF", officialName: "Four Points Flex by Sheraton Ishoj" },
  { id: "CPHKF", officialName: "Four Points Flex by Sheraton Koge" },
  { id: "CPHRF", officialName: "Four Points Flex by Sheraton Roskilde" },
  { id: "CPHBF", officialName: "Four Points Flex by Sheraton Ballerup" },
  { id: "AAROX", officialName: "Moxy Aarhus" },
  { id: "CPHOX", officialName: "Moxy Copenhagen" },
  { id: "EBJEL", officialName: "A Place To Hotel Esbjerg" },
  { id: "CPHRI", officialName: "Residence Inn by Marriott Copenhagen Nordhavn" },
  { id: "CPHRP", officialName: "citizenM Copenhagen Rådhuspladsen" },
] as const;

export const denmarkMarriottProperties: MarriottPropertySeed[] = denmarkMarriottOfficialRows.map(
  ({ id, officialName }) => ({
    id,
    country: "DK",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  })
);
