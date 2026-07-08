import { high, inferBrand } from "./helpers";
import type { MarriottProperty } from "./types";

// Source: Marriott Vietnam destination page property codes, July 2026.
const vietnamOfficialRows = [
  { id: "DADFP", officialName: "Four Points by Sheraton Danang" },
  { id: "DADCY", officialName: "Courtyard by Marriott Danang Han River" },
  { id: "DADER", officialName: "Marriott Executive Apartments Danang, Han River" },
  { id: "DADMC", officialName: "Hoi An Marriott Resort & Spa" },
  { id: "DADMR", officialName: "Danang Marriott Resort & Spa" },
  { id: "HANHS", officialName: "Sheraton Hanoi Hotel" },
  { id: "HANJW", officialName: "JW Marriott Hotel Hanoi" },
  { id: "HANSW", officialName: "Sheraton Hanoi West" },
  { id: "HANLP", officialName: "Four Points by Sheraton Lang Son" },
  { id: "DADSI", officialName: "Sheraton Grand Danang Beach Resort & Spa" },
  { id: "HPHSI", officialName: "Sheraton Hai Phong" },
  { id: "CXRHT", officialName: "Nha Trang Marriott Resort & Spa, Hon Tre Island" },
  { id: "CXRWI", officialName: "The Westin Resort & Spa Cam Ranh" },
  { id: "CXRJW", officialName: "JW Marriott Cam Ranh Bay Resort & Spa" },
  { id: "VCASI", officialName: "Sheraton Can Tho" },
  { id: "SGNJT", officialName: "JW Marriott Hotel & Suites Saigon, The Apartments" },
  { id: "SGNJS", officialName: "JW Marriott Hotel & Suites Saigon" },
  { id: "SGNSI", officialName: "Sheraton Saigon Grand Opera Hotel" },
  { id: "NHASI", officialName: "Sheraton Nha Trang Hotel & Spa" },
  { id: "HANHP", officialName: "Four Points by Sheraton Ha Giang" },
  { id: "DADNN", officialName: "Danang Marriott Resort & Spa, Non Nuoc Beach Villas" },
  { id: "VIISI", officialName: "Sheraton Vinh" },
  { id: "PQCJW", officialName: "JW Marriott Phu Quoc Emerald Bay Resort & Spa" },
  { id: "SGNBS", officialName: "Bach Suites Saigon, a Member of Design Hotels™" },
  { id: "SGNMD", officialName: "Le Méridien Saigon" },
  { id: "VCALM", officialName: "Legacy Mekong, Can Tho, Autograph Collection®" },
  { id: "DADHA", officialName: "Renaissance Danang Hoi An Resort & Spa" },
  { id: "PQCSR", officialName: "Sheraton Phu Quoc Long Beach Resort" },
  { id: "CXRNP", officialName: "Four Points by Sheraton Nha Trang" },
  { id: "SGNBR", officialName: "Renaissance Riverside Hotel Saigon" },
  { id: "SGNFI", officialName: "Fairfield by Marriott South Binh Duong" },
  { id: "SGNAK", officialName: "Vinpearl Landmark 81, Autograph Collection" },
];

export const vietnamMarriottProperties: MarriottProperty[] =
  vietnamOfficialRows.map(({ id, officialName }) => ({
    id: `vn-${id.toLowerCase()}`,
    country: "VN",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    brandGroup: high.brandGroup,
    confidence: high.confidence,
    status: high.status,
    aliases: [],
    reason: `${officialName}은 Marriott Bonvoy 계열 호텔로 확인된 베트남 호텔입니다.`,
  }));
