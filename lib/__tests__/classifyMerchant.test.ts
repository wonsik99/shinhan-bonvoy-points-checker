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

  it("handles empty merchant names", () => {
    const result = classifyMerchant("   ");
    expect(result.isLikelyMarriott).toBe(false);
    expect(result.confidence).toBe("none");
  });
});
