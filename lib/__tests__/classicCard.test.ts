import { describe, expect, it } from "vitest";
import {
  actualGradeLabel,
  actualPointsTotal,
  analyzeTransactions,
  applyFeedback,
  expectedMarriottPoints,
  isHotelAccrualLocked,
  reviewReasonLabel,
  summarizeResults,
} from "@/lib/analyzeTransactions";
import { buildAutomaticAliasFeedback } from "@/lib/feedback";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { normalizePointType, normalizeRows } from "@/lib/normalizeTransaction";
import { theClassicProfile } from "@/rules/cardProfiles";
import type { NormalizedTransaction } from "@/types/transaction";

const CLASSIC_CARD = "5555-****-****-8888";
const BEST_CARD = "1111-****-****-4444";

// Synthetic rows. Merchant names are public test names whose classification
// is pinned elsewhere; amounts and points follow each grade's accrual rate.
function tx(overrides: Partial<NormalizedTransaction> = {}): NormalizedTransaction {
  return {
    id: "classic-base",
    rowIndex: 0,
    transactionDate: "2026-09-10",
    merchantName: "QINHUANGDAO MARRIOTT RESO",
    originalAmount: 100000,
    eligibleAmount: 100000,
    pointType: "C1",
    actualPoints: 100,
    isCanceled: false,
    cardNumberMasked: CLASSIC_CARD,
    merchantSource: "overseas",
    raw: {},
    ...overrides,
  };
}

function bonus(overrides: Partial<NormalizedTransaction> = {}): NormalizedTransaction {
  return tx({ id: "classic-bonus", rowIndex: 1, pointType: "C4", actualPoints: 50, ...overrides });
}

describe("The Classic grade normalization", () => {
  it.each([
    ["C1", "C1"],
    ["c 3", "C3"],
    ["C1 일반적립", "C1"],
    [" C 4 추가적립 ", "C4"],
    ["마이신한포인트 L2", "L2"],
  ])("extracts %s as %s", (raw, grade) => {
    expect(normalizePointType(raw)).toBe(grade);
  });

  it("reads the slip number and the merchant column the name came from", () => {
    const { transactions } = normalizeRows([
      {
        매출전표번호: " SLIP-1 ",
        가맹점명: "VISA해외사용일시불",
        해외가맹점명: "QINHUANGDAO MARRIOTT RESO",
        원매출금액: 100000,
        포인트종류상세: "C3",
        포인트적립금액: 400,
      },
      {
        매출전표번호: "",
        가맹점명: "판교테크노밸리호텔",
        해외가맹점명: "",
        원매출금액: 100000,
        포인트종류상세: "C2",
        포인트적립금액: 400,
      },
    ]);
    expect(transactions[0]).toMatchObject({ slipNumber: "SLIP-1", merchantSource: "overseas", pointType: "C3" });
    expect(transactions[1]).toMatchObject({ merchantSource: "domestic", pointType: "C2" });
    expect(transactions[1].slipNumber).toBeUndefined();
  });
});

describe("The Classic accrual analysis", () => {
  it("uses the 4P rate for The Classic and keeps 5P as the default", () => {
    expect(expectedMarriottPoints(100000, theClassicProfile)).toBe(400);
    expect(expectedMarriottPoints(123456, theClassicProfile)).toBe(494);
    expect(expectedMarriottPoints(100000)).toBe(500);
  });

  it.each([
    ["C3", "QINHUANGDAO MARRIOTT RESO", "overseas"],
    ["C2", "판교테크노밸리호텔", "domestic"],
  ] as const)("treats %s as normal special accrual", (pointType, merchantName, merchantSource) => {
    const [result] = analyzeTransactions([
      tx({ pointType, merchantName, merchantSource, actualPoints: 400 }),
    ]);
    expect(result).toMatchObject({
      analysisStatus: "ok_l5",
      gradeConfirmedMarriott: true,
      cardProfileId: "the_classic",
      effectiveIncluded: false,
    });
    expect(result.difference).toBeUndefined();
  });

  it("preselects an unmapped C3 merchant as an alias report like L5", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "OPAQUE MERCHANT CO LTD", pointType: "C3", actualPoints: 400 }),
    ]);
    expect(buildAutomaticAliasFeedback(results)).toEqual({ "classic-base": "include" });
  });

  it("flags an overseas C1 Marriott payment as a missing C3 accrual", () => {
    const [result] = analyzeTransactions([tx()]);
    expect(result).toMatchObject({
      analysisStatus: "missing_suspected",
      cardProfileId: "the_classic",
      expectedPointType: "C3",
      expectedPoints: 400,
      difference: 300,
      effectiveIncluded: true,
    });
    expect(result.classification.reason).toContain(
      "더 클래식 해외 Marriott 결제는 C3(1,000원당 4P) 적립이 정상입니다."
    );
  });

  it("flags a domestic C1 Marriott payment as a missing C2 accrual", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "코트야드메리어트판교", merchantSource: "domestic" }),
    ]);
    expect(result).toMatchObject({
      analysisStatus: "missing_suspected",
      expectedPointType: "C2",
      difference: 300,
    });
    expect(result.classification.reason).toContain("더 클래식 국내 Marriott 결제는 C2");
  });

  it("keeps a medium-confidence C1 merchant in review until the user includes it", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "THE PLAZA", merchantSource: "domestic" }),
    ]);
    expect(results[0]).toMatchObject({
      analysisStatus: "needs_review",
      expectedPointType: "C2",
      difference: 300,
      effectiveIncluded: false,
    });
    const included = applyFeedback(results, { "classic-base": "include" });
    expect(summarizeResults(included).totalExpectedAdditionalPoints).toBe(300);
  });

  it.each([
    ["overseas", "C3"],
    ["domestic", "C2"],
  ] as const)(
    "uses the %s merchant column when the classification has no region",
    (merchantSource, expectedPointType) => {
      const [result] = analyzeTransactions([
        tx({ merchantName: "ISTANBUL BOUTIQUE HOTEL", merchantSource }),
      ]);
      expect(result).toMatchObject({ analysisStatus: "needs_review", expectedPointType });
    }
  );

  it("still excludes a points purchase carried on a Classic grade", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "Marriott by Points", actualPoints: 100 }),
    ]);
    expect(result).toMatchObject({ analysisStatus: "not_marriott", effectiveIncluded: false });
  });

  it("lets cancellation win over every Classic grade", () => {
    const results = analyzeTransactions([
      tx({ isCanceled: true }),
      bonus({ isCanceled: true }),
    ]);
    expect(results.map((r) => r.analysisStatus)).toEqual(["canceled", "canceled"]);
    expect(results[0].bonusPoints).toBeUndefined();
  });
});

describe("The Classic C4 top-up lines", () => {
  it("pairs C4 with its C1 payment by slip number and counts both points", () => {
    const results = analyzeTransactions([
      tx({ slipNumber: "S-1" }),
      bonus({ slipNumber: "S-1", transactionDate: "2026-09-11" }),
    ]);
    expect(results[0]).toMatchObject({
      analysisStatus: "missing_suspected",
      bonusPoints: 50,
      bonusRowId: "classic-bonus",
      expectedPoints: 400,
      difference: 250,
    });
    expect(results[1]).toMatchObject({
      analysisStatus: "not_marriott",
      accrualRole: "bonus",
      bonusBaseRowId: "classic-base",
      effectiveIncluded: false,
    });
    expect(actualGradeLabel(results[0])).toBe("C1+C4");
    expect(actualPointsTotal(results[0])).toBe(150);
    expect(summarizeResults(results)).toMatchObject({
      marriottCount: 1,
      missingSuspectedCount: 1,
      totalExpectedAdditionalPoints: 250,
    });
  });

  it("pairs by card, date, merchant and amount when the slip number is missing", () => {
    const results = analyzeTransactions([tx(), bonus()]);
    expect(results[0]).toMatchObject({ bonusRowId: "classic-bonus", difference: 250 });
    expect(results[1].bonusBaseRowId).toBe("classic-base");
  });

  it("does not pair lines whose slip numbers differ", () => {
    const results = analyzeTransactions([
      tx({ slipNumber: "S-1" }),
      bonus({ slipNumber: "S-2" }),
    ]);
    expect(results[0].bonusRowId).toBeUndefined();
    expect(results[0]).toMatchObject({ analysisStatus: "needs_review", effectiveIncluded: false });
    expect(results[1].bonusBaseRowId).toBeUndefined();
  });

  it("keeps the payment in review when a same-day C4 line has another amount", () => {
    const results = analyzeTransactions([tx(), bonus({ eligibleAmount: 90000 })]);
    expect(results[0]).toMatchObject({
      analysisStatus: "needs_review",
      bonusAmountMismatch: true,
      difference: 300,
      effectiveIncluded: false,
    });
    expect(reviewReasonLabel(results[0])).toBe("추가적립 금액이 맞지 않아요");
    expect(results[0].classification.reason).toContain(
      "같은 날짜·가맹점의 C4 추가적립 행과 금액이 달라 함께 계산하지 못했습니다."
    );
  });

  it("does not pair across cards", () => {
    const results = analyzeTransactions([tx(), bonus({ cardNumberMasked: BEST_CARD })]);
    expect(results[0]).toMatchObject({ analysisStatus: "missing_suspected", difference: 300 });
    expect(results[0].bonusRowId).toBeUndefined();
  });

  it("never counts or designates an unpaired C4 line", () => {
    const results = analyzeTransactions([
      bonus({ merchantName: "SAMMAEBONG CO LTD", transactionDate: "2026-09-12" }),
    ]);
    expect(results[0]).toMatchObject({ accrualRole: "bonus", analysisStatus: "not_marriott" });
    expect(results[0].bonusBaseRowId).toBeUndefined();
    expect(isHotelAccrualLocked(results[0])).toBe(true);
    const included = applyFeedback(results, { "classic-bonus": "include" });
    expect(included[0]).toMatchObject({ effectiveIncluded: false });
    expect(included[0].userFeedback).toBeUndefined();
    expect(included[0].userDesignatedMarriott).toBeUndefined();
  });
});

describe("The Classic user designation", () => {
  it.each([
    ["domestic", "C2"],
    ["overseas", "C3"],
  ] as const)("uses the 4P rate and the %s grade", (merchantSource, expectedPointType) => {
    const results = analyzeTransactions([
      tx({
        merchantName: "SAMMAEBONG CO LTD",
        merchantSource,
        originalAmount: 600000,
        eligibleAmount: 600000,
        actualPoints: 600,
      }),
    ]);
    expect(results[0].analysisStatus).toBe("not_marriott");
    const [designated] = applyFeedback(results, { "classic-base": "include" });
    expect(designated).toMatchObject({
      userDesignatedMarriott: true,
      expectedPointType,
      expectedPoints: 2400,
      difference: 1800,
      effectiveIncluded: true,
    });
  });

  it("subtracts a paired top-up line from a designated payment", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "SAMMAEBONG CO LTD" }),
      bonus({ merchantName: "SAMMAEBONG CO LTD" }),
    ]);
    const [designated] = applyFeedback(results, { "classic-base": "include" });
    expect(designated).toMatchObject({ expectedPoints: 400, difference: 250 });
  });
});

describe("unsupported grade codes", () => {
  it("keeps a Marriott row with an undefined code in review without estimating", () => {
    const results = analyzeTransactions([tx({ pointType: "C5" })]);
    expect(results[0]).toMatchObject({
      analysisStatus: "needs_review",
      unsupportedGrade: true,
      effectiveIncluded: false,
    });
    expect(results[0].cardProfileId).toBeUndefined();
    expect(results[0].expectedPoints).toBeUndefined();
    expect(results[0].classification.reason).toContain("명세서 등급 C5은 지원하지 않는 카드 등급");
  });

  it("auto-reports a Marriott row with an undefined code as unsure", () => {
    const results = analyzeTransactions([
      tx({ pointType: "C5" }),
      tx({ id: "plain", merchantName: "SAMMAEBONG CO LTD", pointType: "X1" }),
    ]);
    expect(buildAutomaticAliasFeedback(results)).toEqual({ "classic-base": "unsure" });
    const [reported] = applyFeedback(results, buildAutomaticAliasFeedback(results));
    expect(reported).toMatchObject({ userFeedback: "unsure", effectiveIncluded: false });
  });

  it("lets the user include an undefined code as a check request without points", () => {
    const results = applyFeedback(
      analyzeTransactions([tx({ pointType: "C5" }), tx({ id: "classic-missing", transactionDate: "2026-09-11" })]),
      { "classic-base": "include" }
    );
    expect(results[0]).toMatchObject({ userFeedback: "include", effectiveIncluded: true });
    expect(results[0].difference).toBeUndefined();
    expect(summarizeResults(results)).toMatchObject({
      includedCount: 2,
      totalExpectedAdditionalPoints: 300,
    });
    const message = buildInquiryMessage(results.filter((r) => r.effectiveIncluded));
    expect(message).toContain(
      [
        "- 2026-09-11 / QINHUANGDAO MARRIOTT RESO / 100,000원 / 실제 C1 → C3 예상 / 차이 300P",
        "",
        "[적립 등급 확인 요청]",
        "- 2026-09-10 / QINHUANGDAO MARRIOTT RESO / 100,000원 / 실제 C5 → 특별적립 대상 여부 확인 요청",
      ].join("\n")
    );
    expect(message).toContain("총 300포인트가 덜 적립된 것으로 보입니다.");
    expect(message).toContain("(적립 등급을 확인하지 못한 1건은 포인트 차이에서 제외했습니다.)");
  });

  it("writes a check-request-only inquiry when no estimated row is included", () => {
    const results = applyFeedback(analyzeTransactions([tx({ pointType: "C5" })]), {
      "classic-base": "include",
    });
    const message = buildInquiryMessage(results.filter((r) => r.effectiveIncluded));
    expect(message).toContain("일부 거래의 적립 등급을 확인하기 어렵습니다.");
    expect(message).toContain("실제 C5 → 특별적립 대상 여부 확인 요청");
    expect(message).not.toContain("포인트가 덜 적립된 것으로 보입니다");
  });

  it("never designates a non-Marriott row with an undefined code", () => {
    const results = analyzeTransactions([
      tx({ merchantName: "SAMMAEBONG CO LTD", pointType: "X1" }),
    ]);
    expect(results[0]).toMatchObject({ analysisStatus: "not_marriott", unsupportedGrade: true });
    const [included] = applyFeedback(results, { "classic-base": "include" });
    expect(included.userDesignatedMarriott).toBeUndefined();
    expect(included.effectiveIncluded).toBe(false);
    expect(summarizeResults([included])).toMatchObject({
      unsupportedGradeCount: 1,
      cardProfileCounts: { the_best: 0, the_classic: 0 },
    });
  });
});

describe("mixed The Best and The Classic exports", () => {
  const rows = [
    tx({
      id: "best-missing",
      merchantName: "COURTYARD BY MARRIOTT",
      pointType: "L2",
      originalAmount: 234068,
      eligibleAmount: 234068,
      actualPoints: 702,
      cardNumberMasked: BEST_CARD,
    }),
    tx({ id: "classic-missing", slipNumber: "S-9" }),
    bonus({ id: "classic-top-up", slipNumber: "S-9" }),
    tx({ id: "classic-ok", pointType: "C3", actualPoints: 400, transactionDate: "2026-09-12" }),
  ];

  it("analyzes each row with its own card profile", () => {
    const results = analyzeTransactions(rows);
    expect(results.map((r) => [r.id, r.cardProfileId, r.analysisStatus])).toEqual([
      ["best-missing", "the_best", "missing_suspected"],
      ["classic-missing", "the_classic", "missing_suspected"],
      ["classic-top-up", "the_classic", "not_marriott"],
      ["classic-ok", "the_classic", "ok_l5"],
    ]);
    expect(results[0]).toMatchObject({ expectedPointType: "L5", expectedPoints: 1170, difference: 468 });
    expect(summarizeResults(results)).toMatchObject({
      totalCount: 4,
      marriottCount: 3,
      okL5Count: 1,
      missingSuspectedCount: 2,
      totalExpectedAdditionalPoints: 468 + 250,
      cardProfileCounts: { the_best: 1, the_classic: 3 },
      unsupportedGradeCount: 0,
    });
  });

  it("groups the inquiry message by card", () => {
    const message = buildInquiryMessage(
      analyzeTransactions(rows).filter((r) => r.effectiveIncluded)
    );
    expect(message).toContain(
      "정상 특별적립 등급(더 베스트: 해외 L5·국내 L4 / 더 클래식: 해외 C3·국내 C2)"
    );
    expect(message).toContain(
      [
        "[메리어트 본보이™ 더 베스트 신한카드]",
        "- 2026-09-10 / COURTYARD BY MARRIOTT / 234,068원 / 실제 L2 → L5 예상 / 차이 468P",
        "",
        "[메리어트 본보이™ 더 클래식 신한카드]",
        "- 2026-09-10 / QINHUANGDAO MARRIOTT RESO / 100,000원 / 실제 C1+C4(150P) → C3 예상 / 차이 250P",
      ].join("\n")
    );
    expect(message).toContain("총 718포인트가 덜 적립된 것으로 보입니다");
  });

  it("names only The Classic grades when no The Best row is included", () => {
    const message = buildInquiryMessage(
      analyzeTransactions([tx()]).filter((r) => r.effectiveIncluded)
    );
    expect(message).toContain("정상 특별적립 등급(더 클래식: 해외 C3, 국내 C2)");
    expect(message).toContain("실제 C1 → C3 예상 / 차이 300P");
    expect(message).not.toContain("[메리어트 본보이");
  });
});

describe("review reason labels", () => {
  it("names an unsupported grade", () => {
    const [result] = analyzeTransactions([tx({ pointType: "C5" })]);
    expect(reviewReasonLabel(result)).toBe("지원하지 않는 적립 등급이에요");
  });

  it("names a confident Marriott payment on an unexpected grade", () => {
    const [result] = analyzeTransactions([
      tx({
        merchantName: "COURTYARD BY MARRIOTT",
        pointType: "L3",
        actualPoints: 300,
        cardNumberMasked: BEST_CARD,
      }),
    ]);
    expect(result).toMatchObject({ analysisStatus: "needs_review", difference: 200 });
    expect(reviewReasonLabel(result)).toBe("메리어트 결제지만 적립 등급이 평소와 달라요");
  });

  it("names a confident Marriott payment with no positive gap", () => {
    const [result] = analyzeTransactions([tx({ actualPoints: 400 })]);
    expect(result).toMatchObject({ analysisStatus: "needs_review", difference: 0 });
    expect(reviewReasonLabel(result)).toBe("추가로 받을 포인트가 없어 보여요");
  });

  it("keeps the uncertain-merchant label for lower confidence", () => {
    const [result] = analyzeTransactions([
      tx({ merchantName: "THE PLAZA", merchantSource: "domestic" }),
    ]);
    expect(reviewReasonLabel(result)).toBe("메리어트인지 확실하지 않아요");
  });
});
