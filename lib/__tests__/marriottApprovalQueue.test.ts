import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import queue from "@/data/marriott/reviews/2026-10-04-approval-queue.json";
import localApproval from "@/data/marriott/reviews/2026-10-11-local-approved-three.json";
import a from "@/data/marriott/reviews/2026-10-04-new-candidates-a.json";
import b from "@/data/marriott/reviews/2026-10-04-new-candidates-b.json";
import priority from "@/data/marriott/reviews/2026-10-04-priority-evidence.json";
import previousNew from "@/data/marriott/reviews/2026-10-01-new-candidates.json";
import { marriottProperties, marriottPropertyReviewHolds } from "@/rules/marriott";
import { marriottPropertyTransitions } from "@/rules/marriottPropertyTransitions";

const sortedCodes = (rows: { propertyCode: string }[]) => rows.map((row) => row.propertyCode).sort();
const digest = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const newRows = queue.records.filter((row) => row.category === "new_candidate");

describe("October 4 approval-only Marriott queue", () => {
  it("preserves the exact 55-property scope and separates the earlier full review", () => {
    expect(queue.records).toHaveLength(55);
    expect(new Set(sortedCodes(queue.records)).size).toBe(55);
    expect(queue.scope).toMatchObject({ activeUncertain: 3, heldReleaseReview: 7, newCandidates: 45, allActiveHotelsIndividuallyChecked: false, otherPreviousReviewsRefreshed: false });
    expect(sortedCodes(newRows)).toEqual(sortedCodes(previousNew.records));
    expect(sortedCodes(newRows)).toEqual([...queue.officialCollection.registrationCandidateCodes].sort());
    expect(sortedCodes(queue.records.filter((row) => row.category !== "new_candidate"))).toEqual(sortedCodes(priority.records));
  });

  it("accounts for all 45 individual URL attempts including access failures", () => {
    const evidence = [...a.records, ...b.records];
    expect(evidence.map((row) => row.sourceIndex).sort((x, y) => x - y)).toEqual(Array.from({ length: 45 }, (_, i) => i));
    expect(sortedCodes(evidence)).toEqual(sortedCodes(newRows));
    expect(evidence.filter((row) => row.method === "web_open_failed")).toHaveLength(7);
    expect(evidence.filter((row) => row.method === "web_open_cached_official_page")).toHaveLength(38);
    expect(evidence.filter((row) => row.recommendation === "reservations_unavailable")).toHaveLength(20);
    expect(evidence.filter((row) => row.recommendation === "verification_required")).toHaveLength(25);
    expect(queue.summary).toMatchObject({ newIndividualOfficialUrlAttempts: 45, newOfficialBodiesReturned: 38, newOfficialBodyAccessFailures: 7, newReservationsUnavailable: 20, newVerificationRequired: 25 });
  });

  it("preserves evidence lineage and does not relabel old evidence as fresh", () => {
    for (const [path, hash] of Object.entries(queue.evidenceFileSha256)) expect(digest(path), path).toBe(hash);
    for (const row of [...a.records, ...b.records]) {
      expect(row.previousEvidence.pageCheckedAt, row.propertyCode).toBe("2026-10-01");
      expect(row.previousEvidence.reviewCompletedAt).toBe("2026-10-03");
      expect(row.previousEvidence.collectedAt).toMatch(/^2026-10-01T/);
      for (const evidence of row.evidence) expect(evidence.checkedAt).toBe("2026-10-04");
    }
    for (const row of queue.records) {
      expect(row.checkedAt).toBe("2026-10-04");
      expect(row.evidenceRecordCode).toBe(row.propertyCode);
      expect(row.propertyCode).toMatch(/^[A-Z0-9]{5}$/);
      const url = new URL(row.officialUrl);
      expect(url.protocol).toBe("https:");
      expect(url.username + url.password).toBe("");
      expect(row.facts.length).toBeGreaterThan(0);
      expect(row.unresolved.length).toBeGreaterThan(0);
    }
  });

  it("preserves the pre-approval snapshot and allows only the later explicit human-approved delta", () => {
    expect(queue.summary).toMatchObject({ readyForActivation: 0, confirmationRequired: 55, activationApplied: 0, deletionApplied: 0, holdReleaseApplied: 0 });
    for (const row of queue.records) {
      expect(row.decisionLane).toBe("확인 필요");
      expect(row.approvalRequired).toBe(true);
      expect(row.readyForActivation).toBe(false);
      expect(row.activationApplied || row.deletionApplied || row.holdReleaseApplied).toBe(false);
      expect(row.currentRoomRateVerified).toBe(false);
    }
    for (const row of newRows) {
      const laterApproved = localApproval.records.some((property) => property.propertyCode === row.propertyCode);
      expect(marriottProperties.some((property) => property.propertyCode === row.propertyCode)).toBe(laterApproved);
      expect(marriottPropertyReviewHolds.some((hold) => hold.propertyCode === row.propertyCode)).toBe(false);
    }
  });

  it("does not confuse the three uncertain active hotels with ended affiliations", () => {
    const rows = queue.records.filter((row) => row.category === "active_uncertain");
    expect(sortedCodes(rows)).toEqual(["HGHHA", "SHAFO", "SZXLP"]);
    for (const row of rows) {
      expect(row.recommendedAction).toBe("prepare_confirmation_guard");
      expect(row.actualTransitionDate).toBeNull();
      expect(row.officialSourcePresent).toBe(false);
      expect(marriottProperties.some((property) => property.propertyCode === row.propertyCode)).toBe(true);
      expect(marriottPropertyReviewHolds.some((hold) => hold.propertyCode === row.propertyCode)).toBe(false);
      expect(marriottPropertyTransitions.some((transition) => transition.propertyCode === row.propertyCode)).toBe(false);
    }
    expect(marriottProperties).toHaveLength(localApproval.registryBefore.activeHotels + localApproval.records.length);
    expect(marriottPropertyReviewHolds).toHaveLength(88);
  });

  it("keeps the seven release reviews held, including the conflicting HGHFU evidence", () => {
    const rows = queue.records.filter((row) => row.category === "held_release_review");
    expect(sortedCodes(rows)).toEqual(["BNACR", "HGHFU", "IXMRT", "MGMSS", "MRYCO", "SFOPS", "UKBCY"]);
    expect(sortedCodes(rows.filter((row) => row.recommendation === "release_candidate"))).toEqual(["MRYCO", "SFOPS", "UKBCY"]);
    expect(sortedCodes(rows.filter((row) => row.recommendation === "conditional_release_candidate"))).toEqual(["BNACR", "IXMRT", "MGMSS"]);
    expect(rows.find((row) => row.propertyCode === "HGHFU")?.recommendedAction).toBe("retain_hold");
    for (const row of rows) {
      expect(row.officialSourcePresent).toBe(true);
      expect(marriottPropertyReviewHolds.some((hold) => hold.propertyCode === row.propertyCode)).toBe(true);
      expect(marriottProperties.some((property) => property.propertyCode === row.propertyCode)).toBe(false);
    }
  });

  it("records the fresh source check without overwriting the approved July snapshot", () => {
    expect(queue.officialCollection.status).toBe("review_required");
    expect(queue.officialCollection.blockers).toEqual([]);
    expect(queue.officialCollection.summary).toMatchObject({ officialProperties: 10399, safeOfficialProperties: 10390, registrationCandidates: 45, propertyReviewHolds: 88, sourceFiles: 17, sourceFailures: 0 });
    expect(queue.officialCollection.identityProjection).toMatchObject({ equalToPrevious: true, fields: ["propertyCode", "slug", "source"], previousGeneratedAt: "2026-10-03T05:47:21.734Z" });
    expect(queue.officialCollection.snapshotGeneratedAt).toBe("2026-10-04T23:50:37.096Z");
    expect(digest(queue.officialCollection.approvedBaseline.path)).toBe("d383fa1d6c8e9520ad704aa657c9b3aaffcc6a2f01644ba3e886be71dc12c1d8");
    expect(queue.officialCollection.approvedBaseline.updated).toBe(false);
    expect(queue.mutationPolicy).toMatchObject({ automaticRegistration: false, automaticHoldRelease: false, automaticDeletion: false, approvedBaselineUpdated: false, appClassificationChangedByThisReview: false, committed: false, pushed: false, deployed: false });
  });

  it("makes every decision visible in the human-readable approval report", () => {
    const report = readFileSync("docs/hotel-db-approval-2026-10-04.md", "utf8");
    for (const row of queue.records) expect(report, row.propertyCode).toContain(`| ${row.propertyCode} |`);
    expect(report).toContain("활성 10,306개 전체의 운영 확인을 뜻하지 않습니다");
    expect(report).toContain("현재 예약 가능 객실을 확인한 호텔은 0개");
  });
});
