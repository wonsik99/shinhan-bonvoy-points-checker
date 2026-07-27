import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott HWS property XML, July 2026.
const madagascarMarriottOfficialRows = [
  { id: "SMSVO", officialName: "Voaara a Member of Design Hotels™" },
  { id: "TNRDE", officialName: "Delta Hotels Antananarivo" },
] as const;

export const madagascarMarriottProperties: MarriottPropertySeed[] =
  madagascarMarriottOfficialRows.map(({ id, officialName }) => ({
    id,
    country: "MG",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    ...high,
    aliases: [],
  }));
