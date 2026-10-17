import { describe, expect, it } from "vitest";
import {
  classifyMerchant,
  createPropertyAliasMatcher,
  createSharedMerchantRuleMatcher,
  normalizeMerchantName,
} from "@/lib/classifyMerchant";
import { analyzeTransactions, applyFeedback } from "@/lib/analyzeTransactions";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { buildAutomaticAliasFeedback } from "@/lib/feedback";
import {
  buildSafeDerivedAliases,
  compactAliasKey,
  defaultPropertyAliasMatch,
  foldInternalPropertyApostrophes,
  literalCompactAliasKey,
} from "@/rules/marriottProperties/helpers";
import { marriottProperties, marriottPropertyReviewHolds } from "@/rules/marriott";
import { marriottPropertyTransitions } from "@/rules/marriottPropertyTransitions";
import type { MarriottProperty } from "@/rules/marriottProperties/types";
import type { NormalizedTransaction } from "@/types/transaction";

const quotes = ["'", "‘", "’", "＇"];
const officialName = "Le Dokhan's, Paris Arc de Triomphe, a Tribute Portfolio Hotel";
const tx = (overrides: Partial<NormalizedTransaction> = {}): NormalizedTransaction => ({
  id: "synthetic-dokhans", rowIndex: 0, merchantName: "LE DOKHANS HOTEL FOH",
  originalAmount: 100000, eligibleAmount: 100000, actualPoints: 300,
  pointType: "L2", isCanceled: false, raw: {}, ...overrides,
});
const property = (id: string, name: string, aliases: MarriottProperty["aliases"] = []): MarriottProperty => ({
  id, propertyCode: id, country: "FR", region: "overseas", officialName: name,
  brand: "Tribute Portfolio", brandGroup: "marriott", confidence: "high", status: "active", aliases,
});

describe("Narrow hotel-apostrophe normalization", () => {
  it.each(quotes)("joins only internal Latin apostrophes (%s)", (quote) => {
    expect(compactAliasKey(`Le Dokhan${quote}s`)).toBe("LEDOKHANS");
    expect(compactAliasKey(`L${quote}Escape`)).toBe("LESCAPE");
    expect(compactAliasKey(`Xi${quote}an`)).toBe("XIAN");
    expect(compactAliasKey(`Étoile${quote}s`)).toBe("ETOILES");
    expect(literalCompactAliasKey(`Le Dokhan${quote}s`)).toBe(`LEDOKHAN${quote}S`);
    expect(defaultPropertyAliasMatch(`L${quote}Escape`)).toBe("exact");
  });

  it.each(["'HOTEL'", "DOKHAN 'S", "DOKHAN' S", "DOKHAN''S", 'DOKHAN"S', "DOKHAN`S", "DOKHANʼS", "12'34", "호텔'서울"])(
    "does not generalize unsupported punctuation (%s)", (name) => {
      expect(foldInternalPropertyApostrophes(name)).toBe(name);
      expect(compactAliasKey(name)).toBe(literalCompactAliasKey(name));
    }
  );

  it("retains existing accents, invisible-space and punctuation handling", () => {
    expect(compactAliasKey(" Le\u00a0Dokhan’s\u200b ")).toBe("LEDOKHANS");
    expect(compactAliasKey("W Dubai – The Palm")).toBe("WDUBAITHEPALM");
    expect(compactAliasKey("Hôtel & Spa St. Croix")).toBe("HOTELANDSPASTCROIX");
    expect(normalizeMerchantName("Le Dokhan’s")).toBe("LE DOKHAN’S");
  });

  it("uses folded keys to block newly ambiguous derived aliases", () => {
    const built = buildSafeDerivedAliases([
      property("alpha", "Queen's Retreat, City Alpha"),
      property("beta", "Queens Retreat, City Beta"),
    ]);
    expect(built.map(p => p.aliases)).toEqual([[], []]);
  });

  it("does not derive a duplicate alias or a different property's official name", () => {
    const built = buildSafeDerivedAliases([
      property("alpha", "Queen's Retreat, City Alpha", [{value: "Queens Retreat", match: "exact"}]),
      property("beta", "King's Retreat, City Beta"),
      property("gamma", "Kings Retreat"),
    ]);
    expect(built[0].aliases).toHaveLength(1);
    expect(built[1].aliases).toHaveLength(0);
  });

  it("keeps explicit exact aliases exact and short contains aliases bounded", () => {
    const exactMatch = createPropertyAliasMatcher([property("alpha", "Synthetic Test Property", [{value: "O'NEIL", match: "exact"}])]);
    const containsMatch = createPropertyAliasMatcher([property("alpha", "Synthetic Test Property", [{value: "O'NEIL", match: "contains"}])]);
    expect(exactMatch("ONEIL")?.confidence).toBe("high");
    expect(exactMatch("ONEIL HOTEL")).toBeUndefined();
    expect(containsMatch("VISA*O’NEIL FOH")?.confidence).toBe("high");
    for (const name of ["STONEIL", "ONEILS", "FOOONEIL", "ONEIL2", "2ONEIL", "서울ONEIL"]) {
      expect(containsMatch(name), name).toBeUndefined();
    }
  });

  it("preserves literal full-match priority without picking an arbitrary folded collision", () => {
    const alpha = property("alpha", "Alpha Test Property", [{value: "QUEEN'S RETREAT", match: "contains", source: "derived"}]);
    const beta = property("beta", "Beta Test Property", [{value: "QUEENS RETREAT", match: "contains", source: "explicit"}]);
    for (const properties of [[alpha, beta], [beta, alpha]]) {
      const match = createPropertyAliasMatcher(properties);
      expect(match("QUEEN'S RETREAT")?.normalizedName).toBe(alpha.officialName);
      expect(match("QUEENS RETREAT")?.normalizedName).toBe(beta.officialName);
      for (const name of ["QUEEN’S RETREAT", "QUEENS RETREAT FOH"]) {
        expect(match(name)).toMatchObject({status: "needs_review", confidence: "medium", normalizedName: "Alpha Test Property / Beta Test Property"});
        expect(match(name)?.reason).toContain("작은따옴표");
      }
    }
  });

  it("does not expand shared operator descriptors", () => {
    const match = createSharedMerchantRuleMatcher([{
      pattern: "QUEEN'S OPERATIONS", normalizedName: "Shared operator", propertyIds: ["a", "b"],
      region: "overseas", match: "exact", brandGroup: "marriott_candidate", confidence: "medium",
      status: "needs_review", reason: "Synthetic shared descriptor",
    }]);
    expect(match("QUEEN'S OPERATIONS")?.status).toBe("needs_review");
    expect(match("QUEENS OPERATIONS")).toBeUndefined();
  });
});

describe("Hotel recognition and accrual boundaries", () => {
  it.each([...quotes.map(q => `LE DOKHAN${q}S HOTEL FOH`), "LE DOKHANS HOTEL FOH", "  le   dokhans hotel foh  "])(
    "recognizes the existing PARTX hotel without adding an alias (%s)", (name) => {
      expect(classifyMerchant(name)).toMatchObject({isLikelyMarriott: true, confidence: "high", status: "active", normalizedName: officialName, region: "overseas"});
      const p = marriottProperties.find(p => p.propertyCode === "PARTX")!;
      expect(p.aliases).toEqual([{value: "Le Dokhan's", match: "contains", source: "derived"}]);
    }
  );

  it.each(["LE DOKHANX HOTEL FOH", "DOKHANS", "LE DOKHAN HOTEL FOH", "DOKHANS RESTAURANT"])(
    "does not promote a different or insufficient name to an active hotel (%s)", (name) => {
      expect(classifyMerchant(name).status).not.toBe("active");
      expect(classifyMerchant(name).confidence).not.toBe("high");
    }
  );

  it("preserves the raw descriptor and uses existing L2 inquiry and feedback rules", () => {
    const input = tx();
    const [result] = analyzeTransactions([input]);
    expect(result).toMatchObject({merchantName: input.merchantName, actualPoints: 300, pointType: "L2", analysisStatus: "missing_suspected", difference: 200, effectiveIncluded: true});
    expect(buildInquiryMessage([result])).toContain(input.merchantName);
    expect(applyFeedback([result], {[result.id]: "exclude"})[0].effectiveIncluded).toBe(false);
    expect(input).not.toHaveProperty("classification");
  });

  it.each(["L4", "L5"])("preserves observed %s and cancellation priority", (pointType) => {
    expect(analyzeTransactions([tx({pointType})])[0].analysisStatus).toBe("ok_l5");
    expect(analyzeTransactions([tx({pointType, isCanceled: true})])[0].analysisStatus).toBe("canceled");
  });

  it("keeps unfamiliar L1 grades in review and points purchases excluded", () => {
    expect(analyzeTransactions([tx({pointType: "L1"})])[0].analysisStatus).toBe("needs_review");
    const purchases = analyzeTransactions([tx({merchantName: "Marriott by Points"})]);
    expect(purchases[0]).toMatchObject({analysisStatus: "not_marriott", effectiveIncluded: false, classification: {hotelAccrualExclusion: "points_purchase"}});
    expect(buildAutomaticAliasFeedback(purchases)).toEqual({});
    expect(applyFeedback(purchases, {[purchases[0].id]: "include"})[0].effectiveIncluded).toBe(false);
  });

  it("does not let inserted apostrophes bypass registration or operating holds", () => {
    for (const hold of marriottPropertyReviewHolds) {
      const variant = hold.officialName.replace(/([A-Za-z])(?=[A-Za-z])/, "$1’");
      expect(classifyMerchant(variant), variant).toMatchObject({status: "needs_review", normalizedName: hold.officialName});
    }
    expect(classifyMerchant("FAIRF’IELD BY MARRIOTT SHANGHAI HONGQIAO NECC")).toMatchObject({status: "needs_review", confidence: "medium", normalizedName: "Fairfield by Marriott Shanghai Hongqiao NECC"});
  });

  it("keeps date-based transitions and their exclusions ahead of folded matching", () => {
    for (const transition of marriottPropertyTransitions) {
      const variant = transition.officialName.replace(/([A-Za-z])(?=[A-Za-z])/, "$1’");
      expect(classifyMerchant(variant, "2026-10-17"), variant).toMatchObject({status: "needs_review", normalizedName: transition.officialName});
    }
    expect(classifyMerchant("W SOU’TH BEACH", "2026-08-19").status).toBe("active");
    expect(classifyMerchant("W SOU’TH BEACH", "2026-08-20").status).toBe("needs_review");
    expect(classifyMerchant("W SOU’TH BEACH").status).toBe("needs_review");
    expect(classifyMerchant("RESIDENCE INN BY MARRIOTT ATLANTA BUCK’HEAD/LENOX PARK").status).toBe("active");
  });

  it("retains the current corpus size and has no newly merged full-name keys", () => {
    expect(marriottProperties).toHaveLength(10309);
    const owners = new Map<string, Array<{id: string; literal: string}>>();
    for (const p of marriottProperties) {
      for (const name of [p.officialName, ...(p.localName ? [p.localName] : []), ...p.aliases.map(a => a.value)]) {
        const key = compactAliasKey(name);
        owners.set(key, [...(owners.get(key) ?? []), {id: p.id, literal: literalCompactAliasKey(name)}]);
      }
    }
    const collisions = [...owners].filter(([, rows]) => new Set(rows.map(r => r.id)).size > 1 && new Set(rows.map(r => r.literal)).size > 1);
    expect(collisions).toEqual([]);
  });

  it("keeps every quoted official-name variant on the same hotel and policy", () => {
    const quote = /([A-Za-z])['‘’＇](?=[A-Za-z])/g;
    for (const p of marriottProperties) {
      if (p.officialName.replace(quote, "$1") === p.officialName) continue;
      const original = classifyMerchant(p.officialName);
      for (const q of [...quotes, ""]) {
        const name = p.officialName.replace(quote, (_, left) => left + q);
        expect(classifyMerchant(name), name).toMatchObject({
          normalizedName: original.normalizedName, status: original.status,
          confidence: original.confidence, isLikelyMarriott: original.isLikelyMarriott,
          ...(original.region ? {region: original.region} : {}),
        });
      }
    }
  });
});
