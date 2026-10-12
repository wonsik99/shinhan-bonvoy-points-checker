import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import review from "@/data/marriott/reviews/2026-10-03-verification.json";
import previousReview from "@/data/marriott/reviews/2026-09-07-verification.json";
import newCandidates from "@/data/marriott/reviews/2026-10-01-new-candidates.json";
import localApproval from "@/data/marriott/reviews/2026-10-11-local-approved-three.json";
import { marriottProperties, marriottPropertyReviewHolds } from "@/rules/marriott";
import { marriottPropertyTransitions } from "@/rules/marriottPropertyTransitions";
import { classifyMerchant } from "@/lib/classifyMerchant";

const records = review.records;
const count = (values: string[]) => values.reduce<Record<string, number>>((counts, key) => {
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});
const digest = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

describe("Marriott latest individual review and local patch", () => {
  it("rechecks the identical user-requested 104-hotel scope without omissions", () => {
    const original = records.filter((row) => row.scopeOrigin === "requested_104");
    expect(original).toHaveLength(104);
    const actual = original.map((row) => `${row.category}:${row.propertyCode}`).sort();
    const previous = previousReview.records.map((row) => `${row.category}:${row.propertyCode}`).sort();
    expect(actual).toEqual(previous);
    expect(createHash("sha256").update(actual.join("\n")).digest("hex")).toBe(
      "9e198f35a7e878f6d457e4e611f9bb94d5efa292019c95d429943ec45dae0b78"
    );
    expect(review.inputState.originalScopeManifest).toEqual(previousReview.inputState.scopeManifest);
  });

  it("separates the three later source gaps from the original scope", () => {
    expect(records).toHaveLength(107);
    expect(new Set(records.map((row) => row.propertyCode)).size).toBe(107);
    expect(records.filter((row) => row.scopeOrigin === "additional_source_gap").map((row) => row.propertyCode).sort()).toEqual(["LTNDE", "OKCCA", "SHAFO"]);
    expect(records.filter((row) => row.category === "hold")).toHaveLength(88);
    expect(records.filter((row) => row.category === "source_gap")).toHaveLength(19);
  });

  it("keeps dated evidence, access limitations and unresolved questions for every hotel", () => {
    for (const row of records) {
      expect(row.reviewedAt, row.propertyCode).toBe("2026-10-03");
      expect(row.propertyCode).toMatch(/^[A-Z0-9]{5}$/);
      expect(row.country).toMatch(/^[A-Z]{2}$/);
      expect(row.detail.length).toBeGreaterThan(30);
      expect(row.unresolved.length).toBeGreaterThan(0);
      expect(row.evidence.length).toBeGreaterThan(0);
      expect(new URL(row.accessCheck.url).protocol).toBe("https:");
      expect(["content_returned", "fetch_error"]).toContain(row.accessCheck.result);
      for (const evidence of row.evidence) {
        const url = new URL(evidence.url);
        expect(url.protocol).toBe("https:");
        expect(url.username).toBe("");
        expect(url.password).toBe("");
        expect(evidence.checkedAt).toBe("2026-10-03");
        expect(evidence.observation.length).toBeGreaterThan(10);
        expect(evidence.freshness.length).toBeGreaterThan(0);
      }
    }
    expect(records.filter((row) => row.accessCheck.result === "content_returned")).toHaveLength(82);
    expect(records.filter((row) => row.accessCheck.result === "fetch_error")).toHaveLength(25);
    expect(records.filter((row) => row.accessCheck.hotelSpecificBody)).toHaveLength(75);
    expect(records.find((row) => row.propertyCode === "STNCD")?.accessCheck.softNotFound).toBe(true);
  });

  it("makes recommendation counts reproducible and never silently applies an activation or deletion", () => {
    expect(count(records.map((row) => row.recommendation))).toEqual(review.summary.byRecommendation);
    expect(review.summary.byRecommendation).toEqual({
      keep_hold: 81,
      conditional_release_candidate: 4,
      release_candidate: 3,
      keep_active_pending_review: 11,
      move_to_hold_candidate: 3,
      retirement_candidate: 5,
    });
    for (const row of records) {
      expect(row.activationApplied).toBe(false);
      expect(row.deletionApplied).toBe(false);
      expect(row.holdMetadataRefreshed).toBe(row.category === "hold");
    }
    expect(review.summary.newActiveRegistrations).toBe(0);
    expect(review.summary.deletedPropertyRows).toBe(0);
    expect(review.summary.holdReleasesApplied).toBe(0);
    expect(review.summary.newSourceExceptionsApproved).toBe(0);
  });

  it("refreshes all hold metadata but keeps the held inventory out of active seeds", () => {
    expect(marriottProperties).toHaveLength(localApproval.registryBefore.activeHotels + localApproval.records.length);
    expect(marriottPropertyReviewHolds).toHaveLength(88);
    expect(count(marriottPropertyReviewHolds.map((hold) => hold.status))).toEqual({
      verification_required: 68, reservations_unavailable: 16, not_yet_open: 4,
    });
    for (const hold of marriottPropertyReviewHolds) {
      const row = records.find((record) => record.propertyCode === hold.propertyCode);
      expect(row, hold.propertyCode).toBeDefined();
      expect(hold.lastReviewedAt).toBe("2026-10-03");
      expect(hold.status).toBe(row?.proposedStatus);
      expect(hold.reason).toBe(row?.detail);
      expect(marriottProperties.some((property) => property.propertyCode === hold.propertyCode)).toBe(false);
    }
    expect(digest(review.inputState.holdFile)).toBe(review.inputState.holdFileSha256AfterPatch);
  });

  it("keeps release candidates held and preserves the renamed Selma hotel's old alias", () => {
    expect(records.filter((row) => row.recommendation === "release_candidate").map((row) => row.propertyCode).sort()).toEqual(["MRYCO", "SFOPS", "UKBCY"]);
    for (const row of records.filter((record) => record.recommendation.includes("release_candidate"))) {
      expect(classifyMerchant(row.officialName)).toMatchObject({ isLikelyMarriott: false, status: "needs_review" });
    }
    const selma = marriottPropertyReviewHolds.find((hold) => hold.propertyCode === "MGMSS");
    expect(selma?.officialName).toBe("The St. James Hotel, Selma, Series by Marriott");
    expect(selma?.aliases).toContain("St James Hotel, Selma, Series by Marriott");
  });

  it("does not mistake the start of Q4 for completion of an opening", () => {
    expect(marriottPropertyReviewHolds.filter((hold) => hold.status === "not_yet_open").map((hold) => hold.propertyCode).sort()).toEqual(["DPSCL", "DPSUJ", "PQCFI", "PQCOX"]);
    expect(marriottPropertyReviewHolds.find((hold) => hold.propertyCode === "UKBCY")?.status).toBe("verification_required");
    expect(records.find((row) => row.propertyCode === "UKBCY")?.evidence.some((evidence) => evidence.type === "marriott_opening_announcement")).toBe(true);
    expect(records.find((row) => row.propertyCode === "IXMRT")?.detail).toContain("목록에서 빠진 것 자체");
  });

  it("keeps the transition patch separate from destructive retirement decisions", () => {
    const guards = records.filter((row) => row.transitionGuardPatchPrepared).map((row) => row.propertyCode).sort();
    expect(guards).toEqual(marriottPropertyTransitions.map((row) => row.propertyCode).sort());
    expect(guards).toEqual(["ATLBH", "DAYLM", "JANCY", "MIAWS", "OKCCA"]);
    expect(records.filter((row) => row.recommendation === "move_to_hold_candidate").map((row) => row.propertyCode).sort()).toEqual(["HGHHA", "SHAFO", "SZXLP"]);
    for (const code of ["HGHHA", "SHAFO", "SZXLP"]) {
      expect(marriottPropertyReviewHolds.some((hold) => hold.propertyCode === code)).toBe(false);
      expect(marriottProperties.some((property) => property.propertyCode === code)).toBe(true);
    }
  });

  it("preserves the historical 45-candidate queue and permits only the later user-approved registrations", () => {
    expect(newCandidates.records).toHaveLength(45);
    expect(new Set(newCandidates.records.map((row) => row.propertyCode)).size).toBe(45);
    expect(newCandidates.reviewedAt).toBe("2026-10-01");
    expect(newCandidates.summary).toMatchObject({ individualUrlAttempts: 45, officialPagesRead: 35, accessFailures: 10, automaticallyApplied: 0 });
    expect(digest(review.newCandidatesQueue.path)).toBe(review.newCandidatesQueue.sha256);
    expect(newCandidates.records.map((row) => row.propertyCode).sort()).toEqual(review.newCandidatesQueue.propertyCodes);
    for (const row of newCandidates.records) {
      expect(row.applied).toBe(false);
      expect(records.some((record) => record.propertyCode === row.propertyCode)).toBe(false);
      const laterApproved = localApproval.records.some((property) => property.propertyCode === row.propertyCode);
      expect(marriottProperties.some((property) => property.propertyCode === row.propertyCode)).toBe(laterApproved);
      expect(marriottPropertyReviewHolds.some((hold) => hold.propertyCode === row.propertyCode)).toBe(false);
      for (const evidence of row.evidence) expect(evidence.checkedAt).toBe("2026-10-01");
    }
  });

  it("keeps the approved July baseline unchanged and preserves official collection safety", () => {
    expect(digest(review.approvedBaseline.path)).toBe("d383fa1d6c8e9520ad704aa657c9b3aaffcc6a2f01644ba3e886be71dc12c1d8");
    expect(review.approvedBaseline.updated).toBe(false);
    expect(review.officialSourceCollection.status).toBe("review_required");
    expect(review.officialSourceCollection.blockers).toEqual([]);
    expect(review.officialSourceCollection.summary).toMatchObject({ officialProperties: 10399, safeOfficialProperties: 10390, officialAdditions: 124, officialDisappearances: 23, slugChanges: 45, registrationCandidates: 45, localOnly: 19, sourceFailures: 0, sourceFiles: 17 });
    expect(records.filter((row) => row.officialSourcePresent).map((row) => row.propertyCode).sort()).toEqual(review.officialSourceCollection.heldOfficialCodes);
    expect(review.preparedPatch).toMatchObject({ dependenciesUpdated: false, approvedBaselineUpdated: false, committed: false, pushed: false, deployed: false });
  });

  it("keeps every hotel's review row and evidence visible in the human-readable report", () => {
    const report = readFileSync("docs/hotel-db-verification-2026-10-03.md", "utf8");
    for (const code of [...records.map((row) => row.propertyCode), ...newCandidates.records.map((row) => row.propertyCode)]) {
      expect(report, code).toContain(`| ${code} |`);
    }
    expect(report).toContain("활성 10,306개 전체의 운영 확인을 뜻하지 않습니다");
    expect(report).toContain("2026-10-01");
  });
});
