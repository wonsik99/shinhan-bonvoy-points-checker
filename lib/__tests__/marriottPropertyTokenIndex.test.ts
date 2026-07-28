import { describe, expect, it } from "vitest";
import {
  createMarriottPropertyTokenMatcher,
  tokenizeMarriottPropertyText,
} from "@/lib/marriottPropertyTokenIndex";
import type { MarriottProperty } from "@/rules/marriott";

function property(
  id: string,
  officialName: string,
  overrides: Partial<MarriottProperty> = {}
): MarriottProperty {
  return {
    id,
    propertyCode: id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8),
    country: "US",
    region: "overseas",
    officialName,
    brand: "Marriott Bonvoy",
    aliases: [],
    ...overrides,
  };
}

const wSingapore = property(
  "w-singapore",
  "W Singapore - Sentosa Cove",
  { brand: "W Hotels" }
);
const wDubaiPalm = property("w-dubai-palm", "W Dubai - The Palm", {
  brand: "W Hotels",
});
const wDubaiMina = property("w-dubai-mina", "W Dubai - Mina Seyahi", {
  brand: "W Hotels",
});
const crystalGateway = property(
  "crystal-gateway",
  "Crystal Gateway Marriott"
);

describe("tokenizeMarriottPropertyText", () => {
  it("normalizes accents and punctuation and removes structural grammar", () => {
    expect(tokenizeMarriottPropertyText("The Hôtel & Spa by Marriott")).toEqual([
      "HOTEL",
      "SPA",
      "MARRIOTT",
    ]);
  });
});

describe("createMarriottPropertyTokenMatcher", () => {
  it("returns property candidates without deciding confidence or status", () => {
    const match = createMarriottPropertyTokenMatcher([
      wDubaiPalm,
      wDubaiMina,
      wSingapore,
    ]);
    const result = match("W SINGAPORE");

    expect(result).toMatchObject({
      inputTokens: ["W", "SINGAPORE"],
      candidates: [
        {
          property: { id: wSingapore.id },
          matchedTokens: ["W", "SINGAPORE"],
          unexplainedTokens: [],
          inputCoverage: 1,
          matchedTokenOwnerCounts: { W: 3, SINGAPORE: 1 },
        },
      ],
    });
    expect(result).not.toHaveProperty("classification");
  });

  it("reports every token that the specific candidate does not explain", () => {
    const medicalCampus = property(
      "medical-campus",
      "SpringHill Medical Campus"
    );
    const result = createMarriottPropertyTokenMatcher([
      wSingapore,
      medicalCampus,
    ])("W STORE SINGAPORE CAMPUS UMICH");

    expect(result?.candidates[0]).toMatchObject({
      property: { id: wSingapore.id },
      matchedTokens: ["W", "SINGAPORE"],
      unexplainedTokens: ["STORE", "CAMPUS", "UMICH"],
      inputCoverage: 0.4,
    });
  });

  it("keeps a brandless unique token candidate as evidence", () => {
    const result = createMarriottPropertyTokenMatcher([crystalGateway])(
      "CRYSTAL GATEWAY"
    );

    expect(result?.candidates).toHaveLength(1);
    expect(result?.candidates[0]).toMatchObject({
      property: { id: crystalGateway.id },
      matchedTokens: ["CRYSTAL", "GATEWAY"],
      unexplainedTokens: [],
    });
  });

  it("returns every same-score candidate instead of selecting one", () => {
    const result = createMarriottPropertyTokenMatcher([
      wDubaiPalm,
      wDubaiMina,
    ])("W DUBAI");

    expect(result?.candidates.map(({ property }) => property.id)).toEqual([
      "w-dubai-mina",
      "w-dubai-palm",
    ]);
    expect(result?.candidates.every((candidate) => candidate.inputCoverage === 1))
      .toBe(true);
  });

  it("does not create a candidate from one matching token", () => {
    const match = createMarriottPropertyTokenMatcher([
      crystalGateway,
      wSingapore,
    ]);

    expect(match("CRYSTAL STORE")).toBeUndefined();
    expect(match("UNRELATED MERCHANT")).toBeUndefined();
  });

  it("indexes local names as property evidence", () => {
    const localized = property("localized", "Blue Palace Madrid", {
      localName: "Palacio Azul Madrid",
    });
    const result = createMarriottPropertyTokenMatcher([localized])(
      "AZUL MADRID"
    );

    expect(result?.candidates[0]).toMatchObject({
      property: { id: localized.id },
      matchedTokens: ["AZUL", "MADRID"],
    });
  });

  it("does not mix explicit aliases into the property-name token index", () => {
    const aliased = property("aliased", "Alpha Harbor Hotel", {
      aliases: [{ value: "SECRET MERCHANT", match: "exact" }],
    });
    const match = createMarriottPropertyTokenMatcher([aliased]);

    expect(match("SECRET MERCHANT")).toBeUndefined();
  });

  it("preserves property review metadata without interpreting it", () => {
    const candidate = property("candidate", "W Candidate Harbor", {
      brand: "W Hotels",
      brandGroup: "marriott_candidate",
      confidence: "medium",
      status: "needs_review",
    });
    const result = createMarriottPropertyTokenMatcher([candidate])(
      "W CANDIDATE HARBOR"
    );

    expect(result?.candidates[0].property).toMatchObject({
      id: candidate.id,
      brandGroup: "marriott_candidate",
      confidence: "medium",
      status: "needs_review",
    });
  });

  it("keeps candidate output independent of source property order", () => {
    const forward = createMarriottPropertyTokenMatcher([
      wDubaiPalm,
      wDubaiMina,
    ])("W DUBAI");
    const reversed = createMarriottPropertyTokenMatcher([
      wDubaiMina,
      wDubaiPalm,
    ])("W DUBAI");

    expect(reversed).toEqual(forward);
  });
});
