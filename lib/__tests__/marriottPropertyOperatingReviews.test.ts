import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import approval from "@/data/marriott/reviews/2026-10-11-shafo-operating-review.json";
import { classifyMerchant, normalizeMerchantName } from "@/lib/classifyMerchant";
import { analyzeTransactions, applyFeedback, summarizeResults } from "@/lib/analyzeTransactions";
import { buildInquiryMessage } from "@/lib/inquiryMessage";
import { matchMarriottPropertyOperatingReview, reviewMarriottPropertyOperatingStatus } from "@/lib/marriottPropertyOperatingReviews";
import { marriottPropertyOperatingReviews } from "@/rules/marriottPropertyOperatingReviews";
import { marriottProperties, marriottPropertyReviewHolds } from "@/rules/marriott";
import { marriottPropertyTransitions } from "@/rules/marriottPropertyTransitions";
import type { NormalizedTransaction } from "@/types/transaction";
import { loadLocalMarriottCatalog } from "../../scripts/marriott/catalog.mjs";
import { approvedFrameworkDependencyChanges } from "./helpers/frameworkDependencyApproval";
import { approvedMerchantAliasChanges } from "./helpers/merchantAliasApproval";

const officialName = "Fairfield by Marriott Shanghai Hongqiao NECC";
const tx = (overrides: Partial<NormalizedTransaction> = {}): NormalizedTransaction => ({
  id: "shafo-operating-review", rowIndex: 0, merchantName: officialName,
  transactionDate: "2026-10-11", originalAmount: 100000, eligibleAmount: 100000,
  pointType: "L2", actualPoints: 300, isCanceled: false, raw: {}, ...overrides,
});

describe("SHAFO retained record with a human-approved operating review", () => {
  it("protects only SHAFO without deleting its record or inventing a closure date", () => {
    expect(marriottPropertyOperatingReviews.map((r) => r.propertyCode)).toEqual(["SHAFO"]);
    expect(marriottPropertyOperatingReviews[0]).toMatchObject({
      officialName, country: "CN", region: "overseas", reviewedAt: "2026-10-11",
    });
    expect(marriottPropertyOperatingReviews[0]).not.toHaveProperty("lastMarriottOperatingDate");
    expect(marriottPropertyOperatingReviews[0].reason).toContain("캐시");
    expect(marriottProperties.find((p) => p.propertyCode === "SHAFO")).toMatchObject({
      id: "cn-shafo", country: "CN", region: "overseas", officialName, status: "active",
    });
    expect(marriottProperties).toHaveLength(10309);
    expect(marriottPropertyReviewHolds).toHaveLength(88);
    expect(marriottPropertyReviewHolds.some((p) => p.propertyCode === "SHAFO")).toBe(false);
    expect(marriottPropertyTransitions.some((p) => p.propertyCode === "SHAFO")).toBe(false);
  });

  it.each([
    officialName,
    "FAIRFIELD SHANGHAI HONGQIAO NECC",
    "FAIRFIELD BY MARRIOTT HONGQIAO NECC",
    "FAIRFIELD HONGQIAO NECC",
    "VISA*Fairfield-Shanghai-Hongqiao-NECC FOH",
    "FAIRFIELDBYMARRIOTTSHANGHAIHONGQIAONECC",
    "FAIRFIELD BY MARRIOT SHANGHAI HONGQIAO NECC",
    "페어필드 바이 메리어트 상하이 홍차오 NECC",
    "페어필드바이메리어트상하이홍차오NECC",
    "페어필드 상하이 홍차오 NECC",
  ])("keeps the property-specific descriptor %s out of automatic missing-point totals", (merchantName) => {
    const classification = classifyMerchant(merchantName, "2026-10-11");
    expect(classification).toMatchObject({
      isLikelyMarriott: false, confidence: "medium", status: "needs_review", normalizedName: officialName, region: "overseas",
    });
    const [result] = analyzeTransactions([tx({ merchantName })]);
    expect(result).toMatchObject({
      analysisStatus: "needs_review", effectiveIncluded: false,
      expectedPointType: "L5", expectedPoints: 500, difference: 200,
    });
    expect(summarizeResults([result]).totalExpectedAdditionalPoints).toBe(0);
    expect(buildInquiryMessage([result].filter((r) => r.effectiveIncluded))).toBe("");
  });

  it.each(["2020-01-01", "2026-07-26", "2026-10-11", "2027-01-01", undefined, "", "2026-13-01"])(
    "does not infer an operating period from transaction date %s", (transactionDate) => {
      expect(analyzeTransactions([tx({ transactionDate })])[0]).toMatchObject({ analysisStatus: "needs_review", effectiveIncluded: false });
    }
  );

  it("also protects property-code matches reached through the tolerant property index", () => {
    expect(reviewMarriottPropertyOperatingStatus("SHAFO", "NECC FAIRFIELD SHANGHAI HONGQIAO")).toMatchObject({
      normalizedName: officialName, matchedPattern: "NECC FAIRFIELD SHANGHAI HONGQIAO", status: "needs_review",
    });
    expect(classifyMerchant("NECC FAIRFIELD SHANGHAI HONGQIAO")).toMatchObject({ normalizedName: officialName, status: "needs_review" });
    expect(reviewMarriottPropertyOperatingStatus("SHAHF", "FAIRFIELD SHANGHAI HONGQIAO")).toBeUndefined();
  });

  it.each(["L1", "L2", "L3", "", "UNKNOWN"])("keeps grade %s review-only", (pointType) => {
    expect(analyzeTransactions([tx({ pointType })])[0]).toMatchObject({ analysisStatus: "needs_review", effectiveIncluded: false });
  });

  it.each(["L4", "L5"])("preserves statement-confirmed %s", (pointType) => {
    const [result] = analyzeTransactions([tx({ pointType, actualPoints: 500 })]);
    expect(result).toMatchObject({ analysisStatus: "ok_l5", gradeConfirmedMarriott: true, effectiveIncluded: false });
    expect(result.classification.status).toBe("needs_review");
  });

  it.each(["L2", "L4", "L5"])("preserves cancellation priority for %s", (pointType) => {
    expect(analyzeTransactions([tx({ pointType, isCanceled: true })])[0]).toMatchObject({ analysisStatus: "canceled", effectiveIncluded: false });
  });

  it("requires explicit local inclusion before adding the review row to totals and inquiry text", () => {
    const base = analyzeTransactions([tx()]);
    const included = applyFeedback(base, { [base[0].id]: "include" });
    expect(included[0]).toMatchObject({ analysisStatus: "needs_review", effectiveIncluded: true, difference: 200 });
    expect(summarizeResults(included).totalExpectedAdditionalPoints).toBe(200);
    expect(buildInquiryMessage(included.filter((r) => r.effectiveIncluded))).toContain(officialName);
    for (const feedback of ["exclude", "unsure"] as const) {
      const excluded = applyFeedback(included, { [base[0].id]: feedback });
      expect(excluded[0].effectiveIncluded).toBe(false);
      expect(summarizeResults(excluded).totalExpectedAdditionalPoints).toBe(0);
      expect(buildInquiryMessage(excluded.filter((r) => r.effectiveIncluded))).toBe("");
    }
    expect(base[0].effectiveIncluded).toBe(false);
  });

  it.each([500, 600])("does not add a nonpositive point gap after user inclusion (%s)", (actualPoints) => {
    const base = analyzeTransactions([tx({ actualPoints })]);
    expect(applyFeedback(base, { [base[0].id]: "include" })[0].effectiveIncluded).toBe(false);
  });

  it.each(["SHAHF", "SHAOX", "HGHHA", "SZXLP"])("does not change the neighboring or separately retained hotel %s", (code) => {
    const property = marriottProperties.find((p) => p.propertyCode === code)!;
    expect(matchMarriottPropertyOperatingReview(normalizeMerchantName(property.officialName))).toBeUndefined();
    expect(classifyMerchant(property.officialName)).toMatchObject({ isLikelyMarriott: true, status: "active", normalizedName: property.officialName });
  });

  it.each(["FAIRFIELD BY MARRIOTT SHANGHAI HONGQIAO AIRPORT QIBAO", "MOXY SHANGHAI HONGQIAO NECC", "페어필드 바이 메리어트 서울", "FAIRFIELD SHANGHAI HONGQIAO NECCNORTH", "UNFAIRFIELD SHANGHAI HONGQIAO NECC", "", "SHAFO"])(
    "does not broaden the name guard to %s", (merchantName) => {
      expect(matchMarriottPropertyOperatingReview(normalizeMerchantName(merchantName))).toBeUndefined();
    }
  );

  it("retains all seven holds and the three separately approved registrations", () => {
    for (const code of ["BNACR", "HGHFU", "IXMRT", "MGMSS", "MRYCO", "SFOPS", "UKBCY"]) {
      expect(marriottPropertyReviewHolds.some((p) => p.propertyCode === code)).toBe(true);
      expect(marriottProperties.some((p) => p.propertyCode === code)).toBe(false);
    }
    for (const code of ["BLRXR", "IXKRS", "UTPMA"]) expect(marriottProperties.some((p) => p.propertyCode === code)).toBe(true);
  });

  it("records a SHAFO-only manual approval and preserves frozen records, holds and privacy boundaries", () => {
    expect(approval.approval).toMatchObject({ source: "explicit_human_user_request", request: "좋아 그렇게 하자" });
    expect(approval.records.map((r) => r.propertyCode)).toEqual(["SHAFO"]);
    expect(approval.records[0]).toMatchObject({
      localId: "cn-shafo", manuallyApproved: true, appliedLocally: true,
      retainedRegistryState: "active", effectiveClassificationState: "needs_review",
      defaultIncludedInPointTotals: false, explicitLocalInclusionAllowed: true,
      closureStartDate: null, reopeningDate: null, marriottAffiliationEndDate: null,
      permanentClosureConfirmed: false, liveOperatingStatusVerified: false,
    });
    expect(approval.registryAfter).toMatchObject({ retainedHotels: 10309, heldHotels: 88, newRegistrations: 0, newFormalHolds: 0, holdReleases: 0, deletions: 0 });
    expect(approval.approvedCodeChanges.map((change) => change.path)).toEqual(["lib/classifyMerchant.ts"]);
    expect(approval.approvedCodeChanges[0].beforeSha256).toBe("d9505a6bfc5b7884bd853b801655e120f20a172eb2eebee616de7fa0fd5fedc2");
    for (const [path, hash] of Object.entries({ ...approval.protectedFileSha256, ...approval.runtimeFileSha256 })) {
      const dependencyChange = approvedFrameworkDependencyChanges.find((change) => change.path === path);
      const aliasChanges = approvedMerchantAliasChanges.filter((change) => change.path === path);
      if (dependencyChange) expect(dependencyChange.beforeSha256, path).toBe(hash);
      let expectedHash = dependencyChange?.afterSha256 ?? hash;
      for (const change of aliasChanges) {
        expect(change.beforeSha256, path).toBe(expectedHash);
        expectedHash = change.afterSha256;
      }
      expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(expectedHash);
    }
    expect(approval.mutationPolicy).toMatchObject({
      automaticRegistration: false, humanApprovedOperatingReview: true, automaticHoldRelease: false,
      automaticDeletion: false, approvedBaselineUpdated: false, committed: false, pushed: false,
      deployed: false, collectorChanged: false, uploadPrivacyChanged: false,
    });
  });

  it("retains every property code, stable ID, country and official name in the offline catalog", async () => {
    const catalog = await loadLocalMarriottCatalog(process.cwd());
    const projection = catalog.map((r) => ({ localId: r.localId, propertyCode: r.propertyCode, country: r.country, officialName: r.officialName }));
    expect(catalog).toHaveLength(approval.registryBefore.retainedHotels);
    expect(createHash("sha256").update(JSON.stringify(projection)).digest("hex")).toBe(approval.registryBefore.identitySha256);
  });

  it("preserves the pre-patch classifications for the other 10,308 official names", () => {
    const others = marriottProperties.filter((p) => p.propertyCode !== "SHAFO");
    const projection = others.map((p) => ({ propertyCode: p.propertyCode, classification: classifyMerchant(p.officialName, "2026-10-11") }));
    expect(others).toHaveLength(approval.unchangedClassificationAudit.propertyCount);
    expect(approval.unchangedClassificationAudit.beforeSha256).toBe("7e70344f70ab29de5ba2fab49b65c58cfa2b8b4e58597c983eaeb033d5f98bce");
    expect(createHash("sha256").update(JSON.stringify(projection)).digest("hex")).toBe(approval.unchangedClassificationAudit.beforeSha256);
  }, 30000);
});
