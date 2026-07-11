import type { MerchantRule } from "@/types/transaction";

/**
 * Overseas merchant overrides used to live here (TIAD, Hotel 55, etc.).
 * Those now live as:
 * - derived property aliases (e.g. TIAD from "TIAD, Autograph Collection")
 * - `us.ts` alias: Hotel 55 Chicago
 * - brand keywords: POSTCARD CABINS
 * Keep this export empty so older imports keep working.
 */
export const knownMerchantRules: MerchantRule[] = [];

/** Known domestic Marriott-family properties whose names carry no brand keyword. */
export const koreanKnownMerchantRules: MerchantRule[] = [
  {
    pattern: "조선팰리스",
    normalizedName: "조선 팰리스 서울 강남, 럭셔리 컬렉션",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "조선 팰리스는 Marriott 럭셔리 컬렉션 호텔입니다.",
  },
  {
    pattern: "그래비티",
    normalizedName: "그래비티 서울 판교, 오토그래프 컬렉션",
    brandGroup: "marriott",
    confidence: "high",
    status: "active",
    reason: "그래비티 서울 판교는 Marriott 오토그래프 컬렉션 호텔입니다.",
  },
  {
    pattern: "라이즈",
    normalizedName: "라이즈, 오토그래프 컬렉션 (홍대)",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "라이즈(RYSE)는 Marriott 오토그래프 컬렉션 호텔이지만, 상호가 짧아 다른 가맹점과 겹칠 수 있어 확인이 필요합니다.",
  },
  {
    pattern: "오노마",
    normalizedName: "호텔 오노마 대전, 오토그래프 컬렉션",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "호텔 오노마 대전은 Marriott 오토그래프 컬렉션 호텔입니다. 명세서 상호가 다를 수 있어 확인이 필요합니다.",
  },
  {
    pattern: "더플라자",
    normalizedName: "더 플라자 서울, 오토그래프 컬렉션",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "더 플라자 서울(명동)은 Marriott 오토그래프 컬렉션 호텔입니다. '플라자'는 다른 가맹점과 겹칠 수 있어 확인이 필요합니다.",
  },
  {
    pattern: "더링크",
    normalizedName: "더 링크 서울, 트리뷰트 포트폴리오",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "더 링크 서울(신도림)은 Marriott 트리뷰트 포트폴리오 호텔입니다. '링크'는 다른 가맹점과 겹칠 수 있어 확인이 필요합니다.",
  },
  {
    pattern: "네스트호텔",
    normalizedName: "네스트 호텔, 디자인 호텔스 멤버 (인천 영종도)",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "네스트 호텔(인천)은 Marriott 본보이 계열인 Design Hotels 멤버입니다. 명세서 상호가 다를 수 있어 확인이 필요합니다.",
  },
  // 운영사(신세계조선호텔/조선호텔앤리조트) 이름으로 찍히는 경우. 이 운영사는
  // 메리어트(웨스틴조선·조선팰리스·그래비티)와 비메리어트(그랜드조선)를 모두
  // 운영하므로 자동 확정하지 않고 반드시 확인이 필요하다.
  {
    pattern: "신세계조선호텔",
    normalizedName: "신세계조선호텔(조선호텔앤리조트) 운영 호텔",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "신세계조선호텔은 메리어트 계열(웨스틴조선·조선팰리스·그래비티)과 비계열(그랜드조선)을 함께 운영합니다. 어느 호텔인지 확인이 필요합니다.",
  },
  {
    pattern: "조선호텔앤리조트",
    normalizedName: "조선호텔앤리조트 운영 호텔",
    brandGroup: "marriott_candidate",
    confidence: "medium",
    status: "needs_review",
    reason:
      "조선호텔앤리조트는 메리어트 계열과 비계열 호텔을 함께 운영합니다. 어느 호텔인지 확인이 필요합니다.",
  },
];
