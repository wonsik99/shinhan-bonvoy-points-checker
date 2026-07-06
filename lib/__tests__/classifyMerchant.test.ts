import { describe, expect, it } from "vitest";
import { classifyMerchant, normalizeMerchantName } from "@/lib/classifyMerchant";

describe("normalizeMerchantName", () => {
  it("uppercases, trims, and collapses spaces", () => {
    expect(normalizeMerchantName("  fairfield   inn  ")).toBe("FAIRFIELD INN");
  });
});

describe("classifyMerchant", () => {
  it.each([
    "COURTYARD BY MARRIOTT",
    "FAIRFIELD INN ANN ARBO",
    "FAIRFIELD INN & SUITES",
    "FAIRFIELD BELLE VERNON",
    "TOWNEPLACE SUITES GENE",
  ])("classifies %s as certain Marriott", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("certain");
    expect(result.status).toBe("active");
  });

  it.each(["TIAD", "POSTCARD CABINS THE TH", "HOTEL CLEVELAND"])(
    "classifies %s as high-confidence Marriott via known rules",
    (name) => {
      const result = classifyMerchant(name);
      expect(result.isLikelyMarriott).toBe(true);
      expect(result.confidence).toBe("high");
      expect(result.status).toBe("active");
      expect(result.normalizedName).toBeTruthy();
    }
  );

  it("classifies HOTEL 55 CHICAGO as medium needs_review", () => {
    const result = classifyMerchant("HOTEL 55 CHICAGO");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("medium");
    expect(result.status).toBe("needs_review");
  });

  it("classifies ZIPPY AUTO WASH - ELLSWO as not Marriott", () => {
    const result = classifyMerchant("ZIPPY AUTO WASH - ELLSWO");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });

  it("sends unknown hotel-like merchants to low-confidence review", () => {
    const result = classifyMerchant("GRAND SUNRISE HOTEL BUSAN");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("low");
    expect(result.status).toBe("needs_review");
  });

  it("does not treat INN inside another word as hotel-like", () => {
    const result = classifyMerchant("DINNER HOUSE SEOUL");
    expect(result.confidence).toBe("none");
  });

  it.each([
    ["FRITZ BURGER CO", "RITZ"],
    ["EXPEDITION SUPPLY", "EDITION"],
    ["ELEMENTARY BOOKS", "ELEMENT"],
  ])("does not match brand keywords inside longer words (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });

  it("does not treat VIEW HOTEL as W HOTEL; falls back to hotel-like review", () => {
    const result = classifyMerchant("VIEW HOTEL SEOUL");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("low");
    expect(result.status).toBe("needs_review");
  });

  it("still matches brand keywords at word boundaries", () => {
    expect(classifyMerchant("THE RITZ-CARLTON SEOUL").confidence).toBe("certain");
    expect(classifyMerchant("ST. REGIS NEW YORK").confidence).toBe("certain");
    expect(classifyMerchant("W HOTEL HOLLYWOOD").confidence).toBe("certain");
  });

  it.each([
    "코트야드메리어트서울남대문",
    "제이더블유메리어트호텔",
    "웨스틴조선서울",
    "알로프트서울명동",
    "(주)목시서울인사동",
  ])("classifies domestic Korean Marriott merchants (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("certain");
    expect(result.region).toBe("domestic");
  });

  it("classifies 조선팰리스 via domestic known rules", () => {
    const result = classifyMerchant("조선팰리스서울강남");
    expect(result.isLikelyMarriott).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.region).toBe("domestic");
  });

  it("marks overseas English matches as overseas region", () => {
    expect(classifyMerchant("COURTYARD BY MARRIOTT").region).toBe("overseas");
  });

  it("does not flag ordinary Korean merchants", () => {
    expect(classifyMerchant("스타벅스 강남점").confidence).toBe("none");
    expect(classifyMerchant("네이버페이").confidence).toBe("none");
  });

  it("handles empty merchant names", () => {
    const result = classifyMerchant("   ");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });
});
