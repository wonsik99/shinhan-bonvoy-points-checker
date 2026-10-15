import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  analyzeTransactions,
  applyFeedback,
  summarizeResults,
} from "@/lib/analyzeTransactions";
import { classifyMerchant } from "@/lib/classifyMerchant";
import { buildAutomaticAliasFeedback } from "@/lib/feedback";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { marriottProperties } from "@/rules/marriott";
import type { NormalizedTransaction } from "@/types/transaction";
import { approvedMerchantAliasChanges } from "./helpers/merchantAliasApproval";

const merchantName = "CN CT THQ TTKS - FO";
const officialName = "Sheraton Hanoi West";

function transaction(
  overrides: Partial<NormalizedTransaction> = {}
): NormalizedTransaction {
  return {
    id: "synthetic-hanoi-west",
    rowIndex: 0,
    merchantName,
    originalAmount: 100000,
    eligibleAmount: 100000,
    pointType: "L2",
    actualPoints: 300,
    isCanceled: false,
    raw: {},
    ...overrides,
  };
}

describe("Sheraton Hanoi West candidate statement alias", () => {
  it("preserves every recorded alias revision and limits each delta to its evidence block", () => {
    expect(approvedMerchantAliasChanges.map(({ propertyId }) => propertyId)).toEqual([
      "vn-hansw",
      "jp-osays",
      "us-boswf",
    ]);
    const approval = approvedMerchantAliasChanges[0];
    expect(approval).toMatchObject({
      path: "rules/marriottPropertyOverrides.ts",
      propertyId: "vn-hansw",
      alias: merchantName,
    });
    expect(approvedMerchantAliasChanges[1]).toMatchObject({
      path: approval.path,
      propertyId: "jp-osays",
      alias: "MIYAKO HOTELSSHERATON OSK",
      beforeSha256: approval.afterSha256,
    });
    expect(approvedMerchantAliasChanges[2]).toMatchObject({
      path: approval.path,
      propertyId: "us-boswf",
      alias: "RH SEAPORT DISTRICT",
      beforeSha256: approvedMerchantAliasChanges[1].afterSha256,
    });
    let current = readFileSync(approval.path, "utf8");
    for (const change of [...approvedMerchantAliasChanges].reverse()) {
      expect(change.path).toBe(approval.path);
      expect(createHash("sha256").update(current).digest("hex")).toBe(change.afterSha256);
      const previous = current.replace(change.addedBlockPattern, "");
      expect(previous).not.toBe(current);
      expect(createHash("sha256").update(previous).digest("hex")).toBe(change.beforeSha256);
      current = previous;
    }
  });

  it("adds a review-only exact alias without downgrading the existing hotel", () => {
    const property = marriottProperties.find(({ id }) => id === "vn-hansw");
    expect(property).toMatchObject({
      officialName,
      country: "VN",
      region: "overseas",
      status: "active",
      brandGroup: "marriott",
      aliases: expect.arrayContaining([
        expect.objectContaining({
          value: merchantName,
          match: "exact",
          brandGroup: "marriott_candidate",
          confidence: "medium",
          status: "needs_review",
        }),
      ]),
    });
    expect(classifyMerchant(officialName)).toMatchObject({
      normalizedName: officialName,
      isLikelyMarriott: true,
      status: "active",
      region: "overseas",
    });
  });

  it.each([
    merchantName,
    "  cn ct thq ttks - fo  ",
    "CN CT THQ TTKS FO",
  ])("recognizes only the normalized full descriptor as a candidate (%s)", (name) => {
    expect(classifyMerchant(name)).toMatchObject({
      normalizedName: officialName,
      matchedPattern: merchantName,
      isLikelyMarriott: false,
      confidence: "medium",
      status: "needs_review",
      region: "overseas",
      reason: expect.stringContaining("확인이 필요"),
    });
  });

  it.each([
    "THQ",
    "CN CT THQ TTKS",
    "CN CT THQ TTKS - FD",
    "CN CT THQ TTKS - FO SHOP",
    "OTHER CN CT THQ TTKS - FO",
    "FO CN CT THQ TTKS",
  ])("does not attach partial, extended, or reordered descriptors (%s)", (name) => {
    const result = classifyMerchant(name);
    expect(result.normalizedName).not.toBe(officialName);
    expect(result.matchedPattern).not.toBe(merchantName);
    expect(result.isLikelyMarriott).toBe(false);
  });

  it("keeps L5 normal without promoting the candidate to a confirmed hotel match", () => {
    const results = analyzeTransactions([
      transaction({ pointType: "L5", actualPoints: 500 }),
    ]);
    expect(results[0]).toMatchObject({
      analysisStatus: "ok_l5",
      gradeConfirmedMarriott: true,
      effectiveIncluded: false,
      classification: {
        normalizedName: officialName,
        confidence: "medium",
        status: "needs_review",
        isLikelyMarriott: false,
      },
    });
    expect(results[0].difference).toBeUndefined();
    expect(summarizeResults(results)).toMatchObject({
      okL5Count: 1,
      includedCount: 0,
      totalExpectedAdditionalPoints: 0,
    });
    // Review-only aliases remain eligible for the existing opt-in report queue.
    expect(buildAutomaticAliasFeedback(results)).toEqual({
      "synthetic-hanoi-west": "include",
    });
  });

  it.each(["L1", "L2", "L3"])(
    "keeps %s in review and out of automatic totals and inquiries",
    (pointType) => {
      const results = analyzeTransactions([transaction({ pointType })]);
      expect(results[0]).toMatchObject({
        analysisStatus: "needs_review",
        expectedPointType: "L5",
        effectiveIncluded: false,
        classification: { normalizedName: officialName, confidence: "medium" },
      });
      expect(summarizeResults(results)).toMatchObject({
        missingSuspectedCount: 0,
        needsReviewCount: 1,
        includedCount: 0,
        totalExpectedAdditionalPoints: 0,
      });
      expect(buildAutomaticAliasFeedback(results)).toEqual({});
      expect(buildInquiryMessage(results.filter((row) => row.effectiveIncluded))).toBe("");
    }
  );

  it("requires explicit local inclusion and never promotes the global alias", () => {
    const results = analyzeTransactions([transaction()]);
    const included = applyFeedback(results, { "synthetic-hanoi-west": "include" });
    expect(included[0]).toMatchObject({
      analysisStatus: "needs_review",
      effectiveIncluded: true,
      classification: { confidence: "medium", status: "needs_review" },
    });
    expect(summarizeResults(included).totalExpectedAdditionalPoints).toBe(200);
    expect(analyzeTransactions([transaction()])[0].effectiveIncluded).toBe(false);
    expect(classifyMerchant(merchantName).status).toBe("needs_review");
  });

  it("preserves cancellation precedence even for L5", () => {
    const results = analyzeTransactions([
      transaction({ pointType: "L5", isCanceled: true }),
    ]);
    expect(results[0]).toMatchObject({
      analysisStatus: "canceled",
      effectiveIncluded: false,
    });
    expect(buildAutomaticAliasFeedback(results)).toEqual({});
  });
});
