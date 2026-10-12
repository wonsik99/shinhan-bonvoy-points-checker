import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import original from "@/data/marriott/reviews/2026-10-01-new-candidates.json";
import review from "@/data/marriott/reviews/2026-10-11-new-candidates.json";
import localApproval from "@/data/marriott/reviews/2026-10-11-local-approved-three.json";
import { marriottProperties, marriottPropertyReviewHolds } from "@/rules/marriott";

const codes = (rows: { propertyCode: string }[]) => rows.map((r) => r.propertyCode).sort();
const approved = review.records.filter((r) => r.approvalCandidate);
const current = review.records.map((r) => r.liveOverviewObservations[1]);

describe("October 11 approval-only review of the original 45 new candidates", () => {
  it("preserves the exact input population, unique codes and index lineage", () => {
    expect(review.records).toHaveLength(45);
    expect(new Set(codes(review.records)).size).toBe(45);
    expect(codes(review.records)).toEqual(codes(original.records));
    expect(review.records.map((r) => r.sourceIndex)).toEqual(Array.from({ length: 45 }, (_, i) => i));
    const hash = createHash("sha256").update(readFileSync(review.sourceManifest.path)).digest("hex");
    expect(hash).toBe(review.sourceManifest.sha256);
    expect(review.scope.heldReleaseCandidatesReviewed).toBe(0);
    expect(review.scope.allActiveHotelsIndividuallyChecked).toBe(false);
    for (const r of review.records) expect(review.scope.heldReleaseCandidateCodesExcluded).not.toContain(r.propertyCode);
  });

  it("separates research, fresh page reads and older dated room observations", () => {
    expect(review.researchCheckedAt).toBe("2026-10-10");
    expect(review.reviewCompletedAt).toBe("2026-10-11");
    for (const r of review.records) {
      expect(r.liveOverviewObservations.map((o) => o.checkedAt)).toEqual(["2026-10-10", "2026-10-11"]);
      for (const o of r.liveOverviewObservations) {
        expect(o.observedAtUTC.startsWith(o.checkedAt)).toBe(true);
        expect(o.url).toBe(r.officialUrl);
        if (!o.pageReadSucceeded) {
          expect(o.reservationsNotYetAvailable).toBeNull();
          expect(o.closedNotice).toBeNull();
        }
      }
      for (const e of r.evidence) {
        expect(["2026-10-10", "2026-10-11"]).toContain(e.checkedAt);
        expect(new URL(e.url).protocol).toBe("https:");
      }
      expect(r.actualOpeningDate).toBeNull();
      expect(r.marriottParticipationStartDate).toBeNull();
    }
  });

  it("counts access denial as unknown, not as a missing reservations banner", () => {
    expect(current.filter((o) => o.pageReadSucceeded)).toHaveLength(44);
    expect(current.filter((o) => o.accessDenied)).toHaveLength(1);
    expect(current.filter((o) => o.reservationsNotYetAvailable === true)).toHaveLength(17);
    expect(current.filter((o) => o.reservationsNotYetAvailable === false)).toHaveLength(27);
    expect(current.filter((o) => o.reservationsNotYetAvailable === null)).toHaveLength(1);
    expect(review.summary).toMatchObject({ oct11OverviewAttempts: 45, oct11OverviewBodiesReturned: 44, oct11OverviewAccessDenied: 1, oct11ReservationsNoticePresent: 17, oct11ReservationsNoticeNotObserved: 27, oct11ReservationsNoticeUnknown: 1 });
    expect(review.records.find((r) => r.propertyCode === "YYZBT")?.lastSuccessfulOverviewCheckedAt).toBe("2026-10-10");
    for (const code of ["ATQFM", "TVSLP"]) {
      const r = review.records.find((r) => r.propertyCode === code)!;
      expect(r.liveOverviewObservations[0].reservationsNotYetAvailable).toBe(true);
      expect(r.liveOverviewObservations[1].reservationsNotYetAvailable).toBe(false);
      expect(r.followupLookup).toMatchObject({ status: "access_denied", reservationsNotYetAvailable: null, currentRoomRateVerified: false });
      expect(r.approvalCandidate).toBe(false);
      expect(r.operationStatus).toBe("unverified");
    }
  });

  it("requires both operation and participation evidence for the three review candidates", () => {
    expect(codes(approved)).toEqual(["BLRXR", "IXKRS", "UTPMA"]);
    expect(review.summary.approvalReviewCandidates).toBe(3);
    expect(review.summary.confirmationRequired).toBe(42);
    for (const r of approved) {
      expect(r.operationStatus).toBe("operating_supported");
      expect(r.marriottParticipationStatus).toBe("supported");
      expect(r.decisionLane).toBe("승인 검토");
      expect(r.roomRateObservation).toMatchObject({ propertyCode: r.propertyCode, checkedAt: "2026-10-10", stayStart: "2026-10-17", stayEnd: "2026-10-18", reservationSubmitted: false, roomOrRateSelected: false });
      expect(r.roomRateObservation?.rooms).toHaveLength(2);
      expect(r.unresolved.length).toBeGreaterThan(0);
    }
    for (const r of review.records.filter((r) => !r.approvalCandidate)) expect(r.decisionLane).toBe("확인 필요");
  });

  it("does not equate existing hotel operation or brand templates with participation completion", () => {
    for (const code of ["BZEFG", "CUNRA", "DSABF"]) {
      const r = review.records.find((r) => r.propertyCode === code)!;
      expect(r.operationStatus).toBe("operating_supported");
      expect(r.marriottParticipationStatus).toBe("pending");
      expect(r.approvalCandidate).toBe(false);
    }
    expect(review.records.find((r) => r.propertyCode === "HUZLF")).toMatchObject({ marriottParticipationStatus: "supported", operationStatus: "unverified", approvalCandidate: false });
    const count = (key: "operationStatus" | "marriottParticipationStatus") => Object.fromEntries([...new Set(review.records.map((r) => r[key]))].map((value) => [value, review.records.filter((r) => r[key] === value).length]));
    expect(review.summary.operationStatusCounts).toEqual(count("operationStatus"));
    expect(review.summary.participationStatusCounts).toEqual(count("marriottParticipationStatus"));
  });

  it("retains conflicting cached history without inventing opening dates", () => {
    const sdfrs = review.records.find((r) => r.propertyCode === "SDFRS")!;
    expect(sdfrs.researchAssessmentBeforeParentReview.operationStatus).toBe("reservations_not_started");
    expect(sdfrs.operationStatus).toBe("unverified");
    expect(sdfrs.parentReviewAdjustments.length).toBeGreaterThan(0);
    const somnath = review.records.find((r) => r.propertyCode === "IXKRS")!;
    expect(somnath.researchAssessmentBeforeParentReview.approvalCandidate).toBe(false);
    expect(somnath.approvalCandidate).toBe(true);
    expect(somnath.evidence.some((e) => e.publishedAt === "2026-10-09")).toBe(true);
    expect(somnath.actualOpeningDate).toBeNull();
    for (const code of ["JANFF", "LASHT"]) {
      const r = review.records.find((r) => r.propertyCode === code)!;
      const fdd = r.evidence.find((e) => e.url.includes("fdd-document/2025-"))!;
      expect(fdd.publishedAt).toBe("2025-03-31");
      expect(fdd.observation).toContain("Issuance Date");
      expect(r.actualOpeningDate).toBeNull();
    }
  });

  it("preserves the no-mutation review snapshot while applying only the later human-approved local delta", () => {
    expect(Object.values(review.mutationPolicy).every((value) => value === false)).toBe(true);
    expect(review.summary).toMatchObject({ activated: 0, holdReleased: 0, deleted: 0 });
    for (const r of review.records) {
      expect(r).toMatchObject({ readyForActivation: false, currentRegistryState: "unregistered", approvalRequired: true, applied: false });
      const laterApproved = localApproval.records.some((p) => p.propertyCode === r.propertyCode);
      expect(marriottProperties.some((p) => p.propertyCode === r.propertyCode)).toBe(laterApproved);
      expect(marriottPropertyReviewHolds.some((p) => p.propertyCode === r.propertyCode)).toBe(false);
    }
    for (const code of review.scope.heldReleaseCandidateCodesExcluded) expect(marriottPropertyReviewHolds.some((p) => p.propertyCode === code)).toBe(true);
    expect(marriottProperties).toHaveLength(localApproval.registryBefore.activeHotels + localApproval.records.length);
    expect(marriottPropertyReviewHolds).toHaveLength(88);
  });

  it("makes every decision and freshness limit visible in the human report", () => {
    const report = readFileSync("docs/hotel-new-candidates-2026-10-11.md", "utf8");
    for (const r of review.records) expect(report, r.propertyCode).toContain(`| ${r.propertyCode} |`);
    expect(report).toContain("활성 10,306개 전체의 운영 확인을 뜻하지 않습니다");
    expect(report).toContain("10/11에 새로 객실 재고를 조회한 값도 아닙니다");
    expect(report).toContain("YYZBT 1개");
    expect(report).toContain("42개는 확인 필요");
  });
});
