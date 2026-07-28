import {
  candidate,
  contains,
  exact,
  high,
  needsReviewReason,
} from "./helpers";
import type { MarriottPropertySeed, MarriottPropertyAlias } from "./types";

const korea = (
  id: string,
  officialName: string,
  brand: string,
  aliases: MarriottPropertyAlias[],
  options?: Pick<
    MarriottPropertySeed,
    "localName" | "brandGroup" | "confidence" | "status" | "reason"
  >
): MarriottPropertySeed => ({
  id,
  country: "KR",
  region: "domestic",
  officialName,
  brand,
  brandGroup: options?.brandGroup ?? high.brandGroup,
  confidence: options?.confidence ?? high.confidence,
  status: options?.status ?? high.status,
  localName: options?.localName,
  aliases,
  reason:
    options?.reason ??
    `${officialName}은 Marriott Bonvoy 계열 호텔로 확인된 국내 호텔입니다.`,
});

export const koreaMarriottProperties: MarriottPropertySeed[] = [
  korea("kr-le-meridien-seoul-myeongdong", "Le Meridien Seoul, Myeongdong", "Le Meridien", [
    contains("LE MERIDIEN SEOUL"),
    contains("LE MERIDIEN SEOUL MYEONGDONG"),
    contains("르메르디앙서울"),
    contains("르메르디앙명동"),
  ]),
  korea("kr-moxy-seoul-myeongdong", "Moxy Seoul, Myeongdong", "Moxy", [
    contains("MOXY SEOUL MYEONGDONG"),
    contains("목시서울명동"),
  ]),
  korea("kr-four-points-josun-seoul-myeongdong", "Four Points by Sheraton Josun, Seoul Myeongdong", "Four Points by Sheraton", [
    contains("FOUR POINTS SHERATON JOSUN SEOUL MYEONGDONG"),
    contains("FOUR POINTS JOSUN MYEONGDONG"),
    contains("포포인츠조선서울명동"),
    contains("포포인츠명동"),
  ]),
  korea("kr-aloft-seoul-myeongdong", "Aloft Seoul Myeongdong", "Aloft", [
    contains("ALOFT SEOUL MYEONGDONG"),
    contains("알로프트서울명동"),
  ]),
  korea("kr-lescape-seoul-myeongdong", "L'Escape, a Luxury Collection Hotel, Seoul Myeongdong", "The Luxury Collection", [
    contains("L ESCAPE"),
    contains("레스케이프"),
  ]),
  korea("kr-four-points-josun-seoul-station", "Four Points by Sheraton Josun, Seoul Station", "Four Points by Sheraton", [
    contains("FOUR POINTS SHERATON JOSUN SEOUL STATION"),
    contains("FOUR POINTS JOSUN SEOUL STATION"),
    contains("포포인츠조선서울역"),
    contains("포포인츠서울역"),
  ]),
  korea("kr-courtyard-seoul-myeongdong", "Courtyard by Marriott Seoul Myeongdong", "Courtyard by Marriott", [
    contains("COURTYARD MARRIOTT SEOUL MYEONGDONG"),
    contains("COURTYARD BY MARRIOTT SEOUL MYEONGDONG"),
    contains("코트야드메리어트서울명동"),
  ]),
  korea("kr-westin-josun-seoul", "The Westin Josun Seoul", "Westin", [
    contains("WESTIN JOSUN SEOUL"),
    contains("웨스틴조선서울"),
    contains("웨스틴조선호텔서울"),
  ]),
  korea("kr-the-plaza-seoul", "THE PLAZA Seoul, Autograph Collection", "Autograph Collection", [
    contains("THE PLAZA SEOUL"),
    exact("THE PLAZA", { ...candidate, reason: needsReviewReason }),
    contains("더플라자서울"),
    contains("더플라자", { ...candidate, reason: needsReviewReason }),
    // Shinhan statement merchant for THE PLAZA Seoul
    contains("한화호텔앤드리조트"),
  ]),
  korea("kr-jw-marriott-dongdaemun-square-seoul", "JW Marriott Dongdaemun Square Seoul", "JW Marriott", [
    contains("JW MARRIOTT DONGDAEMUN"),
    contains("JW 메리어트 동대문"),
    contains("제이더블유메리어트동대문"),
  ]),
  korea("kr-moxy-seoul-insadong", "Moxy Seoul Insadong", "Moxy", [
    contains("MOXY SEOUL INSADONG"),
    contains("목시서울인사동"),
  ]),
  korea("kr-four-points-seoul-gangnam", "Four Points by Sheraton Seoul, Gangnam", "Four Points by Sheraton", [
    contains("FOUR POINTS SHERATON SEOUL GANGNAM"),
    contains("FOUR POINTS SEOUL GANGNAM"),
    contains("포포인츠서울강남"),
    // Shinhan statement merchant for Four Points Seoul Gangnam
    contains("서우제이앤디"),
  ]),
  korea("kr-jw-marriott-hotel-seoul", "JW Marriott Hotel Seoul", "JW Marriott", [
    contains("JW MARRIOTT HOTEL SEOUL"),
    contains("JW 메리어트 호텔 서울"),
    contains("제이더블유메리어트호텔서울"),
    // Shinhan statement merchant for JW Marriott Hotel Seoul
    contains("신세계센트럴호텔부문"),
  ]),
  korea("kr-aloft-seoul-gangnam", "Aloft Seoul Gangnam", "Aloft", [
    contains("ALOFT SEOUL GANGNAM"),
    contains("알로프트서울강남"),
    // Shinhan statement merchant for Aloft Seoul Gangnam
    contains("대신투자개발"),
  ]),
  korea("kr-ac-hotel-seoul-gangnam", "AC Hotel Seoul Gangnam", "AC Hotels", [
    contains("AC HOTEL SEOUL GANGNAM"),
    contains("AC호텔서울강남"),
    contains("에이씨호텔서울강남"),
    // Shinhan statement merchant for AC Hotel Seoul Gangnam
    contains("희앤썬"),
  ]),
  korea("kr-josun-palace-seoul-gangnam", "Josun Palace, a Luxury Collection Hotel, Seoul Gangnam", "The Luxury Collection", [
    contains("JOSUN PALACE"),
    contains("조선팰리스"),
  ]),
  korea(
    "kr-ryse-seoul",
    "RYSE, Autograph Collection",
    "Autograph Collection",
    [
      exact("RYSE", { ...candidate, reason: needsReviewReason }),
      contains("RYSE HOTEL", { ...candidate, reason: needsReviewReason }),
      contains("라이즈", { ...candidate, reason: needsReviewReason }),
      // Shinhan statement merchant for RYSE Autograph Collection
      contains("아주호텔서교", high),
    ],
    {
      brandGroup: candidate.brandGroup,
      confidence: candidate.confidence,
      status: candidate.status,
      reason: needsReviewReason,
    }
  ),
  korea("kr-westin-seoul-parnas", "The Westin Seoul Parnas", "Westin", [
    contains("WESTIN SEOUL PARNAS"),
    contains("웨스틴서울파르나스"),
    contains("웨스틴파르나스"),
    // Operator group also runs IHG/자체 브랜드 — bare name needs review
    contains("파르나스", { ...candidate, reason: needsReviewReason }),
  ]),
  korea("kr-yeouido-park-centre-seoul", "Yeouido Park Centre, Seoul - Marriott Executive Apartments", "Marriott Executive Apartments", [
    contains("YEOUIDO PARK CENTRE"),
    contains("MARRIOTT EXECUTIVE APARTMENTS SEOUL"),
    contains("여의도파크센터"),
    contains("메리어트이그제큐티브아파트먼트"),
  ]),
  korea("kr-fairfield-seoul", "Fairfield by Marriott Seoul", "Fairfield by Marriott", [
    contains("FAIRFIELD MARRIOTT SEOUL"),
    contains("FAIRFIELD BY MARRIOTT SEOUL"),
    contains("페어필드메리어트서울"),
  ]),
  korea("kr-courtyard-seoul-times-square", "Courtyard by Marriott Seoul Times Square", "Courtyard by Marriott", [
    contains("COURTYARD MARRIOTT SEOUL TIMES SQUARE"),
    contains("COURTYARD BY MARRIOTT SEOUL TIMES SQUARE"),
    contains("코트야드메리어트타임스퀘어"),
    contains("코트야드서울타임스퀘어"),
    // Shinhan statement merchant for Courtyard by Marriott Seoul Times Square
    contains("경방"),
  ]),
  korea("kr-the-link-seoul", "The Link Seoul, a Tribute Portfolio Hotel", "Tribute Portfolio", [
    contains("THE LINK SEOUL"),
    exact("THE LINK", { ...candidate, reason: needsReviewReason }),
    contains("더링크서울"),
    contains("더링크", { ...candidate, reason: needsReviewReason }),
  ]),
  korea("kr-four-points-seoul-guro", "Four Points by Sheraton Seoul, Guro", "Four Points by Sheraton", [
    contains("FOUR POINTS SHERATON SEOUL GURO"),
    contains("FOUR POINTS SEOUL GURO"),
    contains("포포인츠서울구로"),
    // Shinhan statement merchant for Four Points by Sheraton Seoul, Guro
    contains("와이씨앤티"),
  ]),
  korea("kr-courtyard-seoul-botanic-park", "Courtyard by Marriott Seoul Botanic Park", "Courtyard by Marriott", [
    contains("COURTYARD MARRIOTT SEOUL BOTANIC PARK"),
    contains("COURTYARD BY MARRIOTT SEOUL BOTANIC PARK"),
    contains("코트야드메리어트서울보타닉파크"),
    contains("코트야드보타닉파크"),
    // Shinhan statement merchant for Courtyard by Marriott Seoul Botanic Park
    contains("미래엠"),
  ]),
  korea("kr-courtyard-seoul-pangyo", "Courtyard by Marriott Seoul Pangyo", "Courtyard by Marriott", [
    contains("COURTYARD MARRIOTT SEOUL PANGYO"),
    contains("COURTYARD BY MARRIOTT SEOUL PANGYO"),
    contains("코트야드메리어트판교"),
    contains("코트야드서울판교"),
  ]),
  korea("kr-gravity-josun-seoul-pangyo", "GRAVITY JOSUN Seoul Pangyo, Autograph Collection", "Autograph Collection", [
    contains("GRAVITY JOSUN SEOUL PANGYO"),
    contains("GRAVITY SEOUL PANGYO"),
    contains("그래비티서울판교"),
    contains("그래비티판교"),
  ]),
  korea("kr-ac-hotel-seoul-geumjeong", "AC Hotel Seoul Geumjeong", "AC Hotels", [
    contains("AC HOTEL SEOUL GEUMJEONG"),
    contains("AC호텔서울금정"),
    contains("에이씨호텔서울금정"),
    // Shinhan statement merchant for AC Hotel Seoul Geumjeong
    contains("프라임아이티"),
  ]),
  korea("kr-courtyard-suwon", "Courtyard by Marriott Suwon", "Courtyard by Marriott", [
    contains("COURTYARD MARRIOTT SUWON"),
    contains("COURTYARD BY MARRIOTT SUWON"),
    contains("코트야드메리어트수원"),
    // Shinhan statement merchant for Courtyard by Marriott Suwon
    contains("에스엘지수원"),
  ]),
  korea("kr-four-points-suwon", "Four Points by Sheraton Suwon", "Four Points by Sheraton", [
    contains("FOUR POINTS SHERATON SUWON"),
    contains("FOUR POINTS SUWON"),
    contains("포포인츠수원"),
    // Shinhan statement merchant for Four Points by Sheraton Suwon
    contains("성문더플레이스"),
  ]),
  korea("kr-sheraton-grand-incheon", "Sheraton Grand Incheon Hotel", "Sheraton", [
    contains("SHERATON GRAND INCHEON"),
    contains("쉐라톤그랜드인천"),
    contains("셰라톤그랜드인천"),
    // Shinhan statement merchant for Sheraton Grand Incheon Hotel
    contains("대우송도호텔"),
  ]),
  korea("kr-nest-hotel-incheon", "Nest Hotel, a Member of Design Hotels", "Design Hotels", [
    contains("NEST HOTEL"),
    contains("네스트호텔"),
    // Short forms only — keep review so "네스트" alone is not auto-included.
    exact("NEST", { ...candidate, reason: needsReviewReason }),
    contains("네스트", { ...candidate, reason: needsReviewReason }),
  ]),
  korea("kr-courtyard-pyeongtaek", "Courtyard by Marriott Pyeongtaek", "Courtyard by Marriott", [
    contains("COURTYARD MARRIOTT PYEONGTAEK"),
    contains("COURTYARD BY MARRIOTT PYEONGTAEK"),
    contains("코트야드메리어트평택"),
  ]),
  korea("kr-westin-josun-busan", "The Westin Josun Busan", "Westin", [
    contains("WESTIN JOSUN BUSAN"),
    contains("웨스틴조선부산"),
    contains("웨스틴조선호텔부산"),
  ]),
  korea("kr-fairfield-busan", "Fairfield by Marriott Busan", "Fairfield by Marriott", [
    contains("FAIRFIELD MARRIOTT BUSAN"),
    contains("FAIRFIELD BY MARRIOTT BUSAN"),
    contains("페어필드메리어트부산"),
    // Shinhan statement merchant for Fairfield by Marriott Busan
    contains("제이엔에스인부산"),
  ]),
  korea("kr-fairfield-busan-songdo-beach", "Fairfield by Marriott Busan Songdo Beach", "Fairfield by Marriott", [
    contains("FAIRFIELD MARRIOTT BUSAN SONGDO"),
    contains("FAIRFIELD BY MARRIOTT BUSAN SONGDO"),
    contains("페어필드 바이 메리어트 부산 송도"),
    contains("페어필드메리어트부산송도"),
    contains("페어필드부산송도"),
    // Shinhan statement merchant for Fairfield Busan Songdo Beach
    contains("케이알에스"),
  ]),
  korea("kr-jw-marriott-jeju", "JW Marriott Jeju Resort & Spa", "JW Marriott", [
    contains("JW MARRIOTT JEJU"),
    contains("JW 메리어트 제주"),
    contains("제이더블유메리어트제주"),
    // Shinhan statement merchant for JW Marriott Jeju
    contains("삼매봉개발"),
  ]),
  korea("kr-sheraton-jeju", "Sheraton Jeju Hotel", "Sheraton", [
    contains("SHERATON JEJU"),
    contains("쉐라톤제주"),
    contains("셰라톤제주"),
  ]),
  korea("kr-jeju-shinhwa-world-marriott-resort", "Jeju Shinhwa World Marriott Resort", "Marriott Hotels", [
    contains("JEJU SHINHWA WORLD MARRIOTT"),
    contains("SHINHWA WORLD MARRIOTT"),
    contains("제주신화월드"),
    // Shinhan statement merchant for Jeju Shinhwa World Marriott
    contains("람정제주개발"),
  ]),
  korea("kr-daegu-marriott", "Daegu Marriott Hotel", "Marriott Hotels", [
    contains("DAEGU MARRIOTT"),
    contains("대구메리어트"),
    // Shinhan statement merchant for Daegu Marriott Hotel
    contains("비에스떠블유파트너스"),
  ]),
  korea("kr-hotel-onoma-daejeon", "Hotel Onoma, Daejeon, Autograph Collection", "Autograph Collection", [
    contains("HOTEL ONOMA DAEJEON"),
    contains("HOTEL ONOMA"),
    contains("오노마", { ...candidate, reason: needsReviewReason }),
  ]),
  korea("kr-courtyard-sejong", "Courtyard by Marriott Sejong", "Courtyard by Marriott", [
    contains("COURTYARD MARRIOTT SEJONG"),
    contains("COURTYARD BY MARRIOTT SEJONG"),
    contains("코트야드메리어트세종"),
    // Shinhan statement merchant for Courtyard by Marriott Sejong
    contains("세경호텔"),
  ]),
];
