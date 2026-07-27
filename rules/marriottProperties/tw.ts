import { high, inferBrand } from "./helpers";
import type { MarriottPropertySeed } from "./types";

// Source: Marriott Taiwan destination page property codes, July 2026.
const taiwanOfficialRows = [
  { id: "TPEBE", officialName: "Aloft Taipei Beitou" },
  { id: "TPECD", officialName: "Courtyard by Marriott Taipei Downtown" },
  { id: "HUNMD", officialName: "Le Méridien Hualien Resort" },
  { id: "MZGFP", officialName: "Four Points by Sheraton Penghu" },
  { id: "KHHGM", officialName: "Gloria Manor, a Member of Design Hotels" },
  { id: "TPECM", officialName: "citizenM Taipei North Gate" },
  { id: "TPECY", officialName: "Courtyard by Marriott Taipei" },
  { id: "KHHLC", officialName: "THE AMNIS, a Luxury Collection Hotel, Kaohsiung" },
  { id: "RMQTL", officialName: "Aloft Taichung" },
  { id: "TPESX", officialName: "Sheraton New Taipei Xinzhuang" },
  { id: "TPESY", officialName: "Sheraton Taoyuan Hotel" },
  { id: "TPEDM", officialName: "Le Méridien Taipei" },
  { id: "TPEDS", officialName: "Hotel Proverbs Taipei, a Member of Design Hotels™" },
  { id: "TPELF", officialName: "Four Points by Sheraton Linkou" },
  { id: "RMQMD", officialName: "Le Méridien Taichung" },
  { id: "TPEMB", officialName: "Le Méridien Taipei Banqiao" },
  { id: "TPEAL", officialName: "Aloft Taipei Zhongshan" },
  { id: "KHHMC", officialName: "Kaohsiung Marriott Hotel" },
  { id: "TPESC", officialName: "Suz & Catorze Taipei, a Tribute Portfolio Hotel" },
  { id: "TPEHS", officialName: "Sheraton Hsinchu Hotel" },
  { id: "RMQOX", officialName: "Moxy Taichung" },
  { id: "RMQFI", officialName: "Fairfield by Marriott Taichung" },
  { id: "TPESH", officialName: "Renaissance Taipei Shihlin Hotel" },
  { id: "TPEYR", officialName: "The Westin Yilan Resort" },
  { id: "TPEWH", officialName: "W Taipei" },
  { id: "TPETW", officialName: "The Westin Tashee Resort, Taoyuan" },
  { id: "TNNAL", officialName: "Aloft Tainan Anping" },
  { id: "TPETM", officialName: "Taipei Marriott Hotel" },
  { id: "TPEPJ", officialName: "Four Points by Sheraton Yilan Jiaoxi" },
  { id: "RMQLB", officialName: "Yong Le Lukang, a Tribute Portfolio Hotel" },
  { id: "TPEST", officialName: "Sheraton Grand Taipei Hotel" },
  { id: "TTTSI", officialName: "Sheraton Taitung Hotel" },
  { id: "TPEFT", officialName: "Four Points by Sheraton Taipei Bali" },
  { id: "TPEMT", officialName: "Madison Taipei, a Tribute Portfolio Hotel" },
];

export const taiwanMarriottProperties: MarriottPropertySeed[] =
  taiwanOfficialRows.map(({ id, officialName }) => ({
    id: `tw-${id.toLowerCase()}`,
    country: "TW",
    region: "overseas",
    officialName,
    brand: inferBrand(officialName),
    brandGroup: high.brandGroup,
    confidence: high.confidence,
    status: high.status,
    aliases: [],
    reason: `${officialName}은 Marriott Bonvoy 계열 호텔로 확인된 대만 호텔입니다.`,
  }));
