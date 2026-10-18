import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import approval from "@/data/marriott/reviews/2026-10-11-local-approved-three.json";
import operatingReviewApproval from "@/data/marriott/reviews/2026-10-11-shafo-operating-review.json";
import review from "@/data/marriott/reviews/2026-10-11-new-candidates.json";
import { marriottProperties, marriottPropertyReviewHolds } from "@/rules/marriott";
import { classifyMerchant } from "@/lib/classifyMerchant";
import { analyzeTransactions } from "@/lib/analyzeTransactions";
import type { NormalizedTransaction } from "@/types/transaction";
import { loadLocalMarriottCatalog } from "../../scripts/marriott/catalog.mjs";
import { approvedFrameworkDependencyChanges } from "./helpers/frameworkDependencyApproval";
import { approvedMerchantAliasChanges } from "./helpers/merchantAliasApproval";
import { approvedPointsPurchaseChanges } from "./helpers/pointsPurchaseApproval";
import { approvedApostropheNormalizationChanges } from "./helpers/apostropheNormalizationApproval";

const selectedCodes = ["BLRXR", "IXKRS", "UTPMA"];
const selected = marriottProperties.filter((p) => selectedCodes.includes(p.propertyCode));
const currentNames = [
  ["BLRXR", "ARTEZIA BENGALURU"],
  ["IXKRS", "THE FERN RESIDENCY SOMNATH, SERIES BY MARRIOTT"],
  ["UTPMA", "MASON, A MEMBER OF DESIGN HOTELS"],
] as const;
const ambiguousNames = ["ARTEZIA", "MASON", "THE FERN RESIDENCY SOMNATH", "THE FERN RESIDENCY SOMNATH FOH"];
const tx = (merchantName: string, overrides: Partial<NormalizedTransaction> = {}): NormalizedTransaction => ({
  id: `approved-three-${merchantName}`,
  rowIndex: 0,
  merchantName,
  originalAmount: 100000,
  eligibleAmount: 100000,
  pointType: "L2",
  actualPoints: 300,
  isCanceled: false,
  raw: {},
  ...overrides,
});

describe("Human-approved local registration of three October candidates", () => {
  it("adds exactly the three approved codes and defers the other 42 without new formal holds", () => {
    expect(approval.approval.source).toBe("explicit_human_user_request");
    expect(approval.records.map((r) => r.propertyCode).sort()).toEqual(selectedCodes);
    expect(selected.map((p) => p.propertyCode).sort()).toEqual(selectedCodes);
    expect(approval.registryBefore).toMatchObject({ activeHotels: 10306, heldHotels: 88 });
    expect(approval.registryAfter).toMatchObject({ activeHotels: 10309, heldHotels: 88, newActiveRegistrations: 3, newFormalHolds: 0, holdReleases: 0, deletions: 0 });
    expect(marriottProperties).toHaveLength(10309);
    expect(marriottPropertyReviewHolds).toHaveLength(88);
    const registeredCandidates = review.records.filter((r) => marriottProperties.some((p) => p.propertyCode === r.propertyCode));
    expect(registeredCandidates.map((r) => r.propertyCode).sort()).toEqual(selectedCodes);
    const deferred = review.records.filter((r) => !selectedCodes.includes(r.propertyCode)).map((r) => r.propertyCode).sort();
    expect(deferred).toHaveLength(42);
    expect([...approval.deferredCandidateCodes].sort()).toEqual(deferred);
    for (const code of deferred) {
      expect(marriottProperties.some((p) => p.propertyCode === code)).toBe(false);
      expect(marriottPropertyReviewHolds.some((p) => p.propertyCode === code)).toBe(false);
    }
    for (const code of approval.excludedHoldReleaseCodes) expect(marriottPropertyReviewHolds.some((p) => p.propertyCode === code)).toBe(true);
  });

  it("preserves the identities of all earlier 10,306 properties in the offline updater catalog", async () => {
    const catalog = await loadLocalMarriottCatalog(process.cwd());
    expect(catalog).toHaveLength(10309);
    expect(new Set(catalog.map((r) => r.propertyCode)).size).toBe(10309);
    const previous = catalog.filter((r) => !selectedCodes.includes(r.propertyCode)).map((r) => ({ localId: r.localId, propertyCode: r.propertyCode, country: r.country, officialName: r.officialName }));
    expect(previous).toHaveLength(10306);
    expect(createHash("sha256").update(JSON.stringify(previous)).digest("hex")).toBe(approval.registryBefore.activeIdentitySha256);
    for (const r of approval.records) expect(catalog.find((p) => p.propertyCode === r.propertyCode)).toMatchObject({ localId: r.localId, country: r.country, officialName: r.officialName, sourceFile: r.sourceFile });
  });

  it("assigns India/Thailand and overseas brands without inventing a St. Regis affiliation", () => {
    const expected = [
      { propertyCode: "BLRXR", id: "in-blrxr", country: "IN", brand: "Independent" },
      { propertyCode: "IXKRS", id: "in-ixkrs", country: "IN", brand: "Series by Marriott" },
      { propertyCode: "UTPMA", id: "th-utpma", country: "TH", brand: "Design Hotels" },
    ];
    for (const p of expected) expect(selected.find((r) => r.propertyCode === p.propertyCode)).toMatchObject({ ...p, region: "overseas", brandGroup: "marriott", confidence: "high", status: "active" });
    const artezia = selected.find((p) => p.propertyCode === "BLRXR")!;
    expect(artezia.aliases.some((a) => /SHANGRI|ST\.? REGIS|AUTOGRAPH/i.test(a.value))).toBe(false);
    expect(artezia.reason).toContain("확인 필요");
  });

  it.each(currentNames)("recognizes the current property-specific name for %s", (code, name) => {
    const property = selected.find((p) => p.propertyCode === code)!;
    expect(classifyMerchant(name)).toMatchObject({ isLikelyMarriott: true, confidence: "high", status: "active", normalizedName: property.officialName, region: "overseas" });
    const [r] = analyzeTransactions([tx(name)]);
    expect(r).toMatchObject({ analysisStatus: "missing_suspected", expectedPointType: "L5", expectedPoints: 500, difference: 200, effectiveIncluded: true });
  });

  it.each([
    "ARTEZIA BENGALURU FOH",
    "THE FERN RESIDENCY SOMNATH SERIES BY MARRIOTT FOH",
    "THE FERN RESIDENCY SOMNATH, SERIES BY MARRIOTT FOH",
    "MASON A MEMBER OF DESIGN HOTELS FOH",
    "MASON, A MEMBER OF DESIGN HOTELS FOH",
    "MASON PATTAYA FOH",
  ])("retains high-confidence recognition for qualified descriptor %s", (name) => {
    expect(classifyMerchant(name)).toMatchObject({ isLikelyMarriott: true, confidence: "high", status: "active", region: "overseas" });
    expect(analyzeTransactions([tx(name)])[0].analysisStatus).toBe("missing_suspected");
  });

  it.each(ambiguousNames)("keeps ambiguous or pre-conversion name %s review-only", (name) => {
    expect(classifyMerchant(name)).toMatchObject({ isLikelyMarriott: false, confidence: "medium", status: "needs_review", region: "overseas" });
    expect(analyzeTransactions([tx(name)])[0]).toMatchObject({ analysisStatus: "needs_review", effectiveIncluded: false });
  });

  it("does not derive an active high-confidence MASON-only alias", () => {
    const mason = selected.find((p) => p.propertyCode === "UTPMA")!;
    const aliases = mason.aliases.filter((a) => a.value.toUpperCase() === "MASON");
    expect(aliases).toHaveLength(1);
    expect(aliases[0]).toMatchObject({ match: "exact", brandGroup: "marriott_candidate", confidence: "medium", status: "needs_review" });
    for (const name of ["MASONRY SUPPLY", "MASON CONSTRUCTION", "SHANGRI LA BANGALORE"]) expect(analyzeTransactions([tx(name)])[0].analysisStatus).not.toBe("missing_suspected");
    for (const name of ["SHANGRI LA BANGALORE", "ST REGIS BENGALURU"]) expect(classifyMerchant(name).normalizedName).not.toBe("Artezia Bengaluru");
  });

  it.each(["CVGCM", "CVGMP", "CVGMS", "CVGRE"])("does not hijack an existing U.S. Mason property %s", (code) => {
    const property = marriottProperties.find((p) => p.propertyCode === code)!;
    expect(property.country).toBe("US");
    expect(classifyMerchant(property.officialName).normalizedName).toBe(property.officialName);
  });

  it.each(currentNames)("preserves grade and cancellation precedence for %s", (_code, name) => {
    for (const pointType of ["L4", "L5"]) expect(analyzeTransactions([tx(name, { pointType, actualPoints: 500 })])[0]).toMatchObject({ analysisStatus: "ok_l5", effectiveIncluded: false });
    expect(analyzeTransactions([tx(name, { isCanceled: true })])[0]).toMatchObject({ analysisStatus: "canceled", effectiveIncluded: false });
    expect(analyzeTransactions([tx(name, { pointType: "L1", actualPoints: 100 })])[0]).toMatchObject({ analysisStatus: "needs_review", effectiveIncluded: false });
  });

  it("keeps L4/L5 confirmations intact even for ambiguous short names", () => {
    for (const name of ambiguousNames) {
      for (const pointType of ["L4", "L5"]) expect(analyzeTransactions([tx(name, { pointType, actualPoints: 500 })])[0]).toMatchObject({ analysisStatus: "ok_l5", effectiveIncluded: false });
    }
  });

  it("preserves the frozen review, holds, privacy constraints and manual-approval audit trail", () => {
    // Keep this approval immutable. Only the separately approved SHAFO
    // classifier delta, exact framework dependency patch, and recorded
    // merchant alias chain may supersede hashes; other files stay unchanged.
    expect(operatingReviewApproval.approvedCodeChanges.map((change) => change.path)).toEqual(["lib/classifyMerchant.ts"]);
    expect(operatingReviewApproval.approval.source).toBe("explicit_human_user_request");
    expect(operatingReviewApproval.records.map((record) => record.propertyCode)).toEqual(["SHAFO"]);
    for (const [path, hash] of Object.entries(approval.protectedFileSha256)) {
      const approvedChange = operatingReviewApproval.approvedCodeChanges.find((change) => change.path === path);
      const dependencyChange = approvedFrameworkDependencyChanges.find((change) => change.path === path);
      const aliasChanges = approvedMerchantAliasChanges.filter((change) => change.path === path);
      if (approvedChange) expect(approvedChange.beforeSha256, path).toBe(hash);
      if (dependencyChange) expect(dependencyChange.beforeSha256, path).toBe(hash);
      let expectedHash = dependencyChange?.afterSha256 ?? approvedChange?.afterSha256 ?? hash;
      for (const change of aliasChanges) {
        expect(change.beforeSha256, path).toBe(expectedHash);
        expectedHash = change.afterSha256;
      }
      const purchaseChange = approvedPointsPurchaseChanges.find((change) => change.path === path);
      if (purchaseChange) {
        expect(purchaseChange.beforeSha256, path).toBe(expectedHash);
        expectedHash = purchaseChange.afterSha256;
      }
      const apostropheChange = approvedApostropheNormalizationChanges.find((change) => change.path === path);
      if (apostropheChange) {
        expect(apostropheChange.beforeSha256, path).toBe(expectedHash);
        expectedHash = apostropheChange.afterSha256;
      }
      expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(expectedHash);
    }
    expect(createHash("sha256").update(readFileSync(approval.sourceReview.path)).digest("hex")).toBe(approval.sourceReview.sha256);
    expect(approval.mutationPolicy).toMatchObject({ automaticRegistration: false, humanApprovedLocalRegistration: true, automaticHoldRelease: false, automaticDeletion: false, approvedBaselineUpdated: false, committed: false, pushed: false, deployed: false, collectorChanged: false, uploadPrivacyChanged: false });
    for (const r of approval.records) {
      expect(r).toMatchObject({ manuallyApproved: true, appliedLocally: true, actualOpeningDate: null, marriottParticipationStartDate: null });
      expect(review.records.find((p) => p.propertyCode === r.propertyCode)?.approvalCandidate).toBe(true);
    }
  });
});
