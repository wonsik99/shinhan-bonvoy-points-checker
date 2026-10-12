export interface MarriottPropertyOperatingReview {
  propertyCode: string;
  officialName: string;
  country: string;
  region: "domestic" | "overseas";
  aliases: readonly string[];
  reason: string;
  reviewedAt: string;
  evidenceUrls: readonly string[];
}

/**
 * Review-only operating uncertainty for records retained in the hotel DB.
 * Separate from both registration holds and confirmed affiliation transitions.
 * Review dates are not closure dates; these rules have no inferred date cutoff.
 */
export const marriottPropertyOperatingReviews: readonly MarriottPropertyOperatingReview[] = [
  {
    propertyCode: "SHAFO",
    officialName: "Fairfield by Marriott Shanghai Hongqiao NECC",
    country: "CN",
    region: "overseas",
    aliases: [
      "Fairfield Shanghai Hongqiao NECC",
      "Fairfield by Marriott Hongqiao NECC",
      "Fairfield Hongqiao NECC",
      "페어필드 바이 메리어트 상하이 홍차오 NECC",
      "페어필드 상하이 홍차오 NECC",
    ],
    reason:
      "공식 페이지 검색 캐시에 휴업 안내가 남아 있습니다. 현재 운영·Marriott 참여 상태와 휴업·재개 시점은 확인이 필요하며, 캐시 안내만으로 영구 폐업·제휴 종료를 단정하지 않습니다. 기간이 미확인이라 과거 거래도 결제 당시 상태 확인이 필요합니다.",
    reviewedAt: "2026-10-11",
    evidenceUrls: [
      "https://www.marriott.com/en-us/hotels/shafo-fairfield-shanghai-hongqiao-necc/overview/",
      "https://www.marriott.com/en-us/hotels/shafo-fairfield-shanghai-hongqiao-necc/rooms/",
    ],
  },
];
