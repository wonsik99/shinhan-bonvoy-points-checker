import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import previousReview from "@/data/marriott/reviews/2026-09-06.json";
import review from "@/data/marriott/reviews/2026-09-07-verification.json";
import { classifyMerchant } from "@/lib/classifyMerchant";

const records = review.records;
const manifest = review.inputState.scopeManifest;
const report = readFileSync(
  path.resolve("docs/hotel-db-verification-2026-09-07.md"),
  "utf8"
);

function record(propertyCode: string) {
  const found = records.find((row) => row.propertyCode === propertyCode);
  if (!found) throw new Error(`Missing individual review: ${propertyCode}`);
  return found;
}

function codesFor(recommendation: string) {
  return records
    .filter((row) => row.recommendation === recommendation)
    .map((row) => row.propertyCode)
    .sort();
}

describe("Marriott 2026-09-07 individual review evidence", () => {
  it("covers the frozen 104-hotel scope exactly once", () => {
    expect(records).toHaveLength(104);
    expect(new Set(records.map((row) => row.propertyCode)).size).toBe(104);
    const actualScope = records
      .map((row) => `${row.category}:${row.propertyCode}`)
      .sort();
    const expectedScope = [
      ...manifest.holds.map((code) => `hold:${code}`),
      ...manifest.sourceGaps.map((code) => `source_gap:${code}`),
    ].sort();
    expect(actualScope).toEqual(expectedScope);
    const digest = createHash("sha256")
      .update(actualScope.join("\n"))
      .digest("hex");
    expect(digest).toBe(review.inputState.targetScopeSha256);
    // Freeze the input identity independently of the generated manifest.
    expect(digest).toBe(
      "9e198f35a7e878f6d457e4e611f9bb94d5efa292019c95d429943ec45dae0b78"
    );
  });

  it("reviews all 88 holds and the same 16 source gaps as the earlier patch", () => {
    expect(manifest.holds).toHaveLength(88);
    expect(manifest.sourceGaps).toHaveLength(16);
    expect(manifest.sourceGaps).toEqual(
      previousReview.unreviewedSourceGaps
        .map((row) => row.propertyCode)
        .sort()
    );
    expect(review.summary.holdsReviewed).toBe(88);
    expect(review.summary.sourceGapsReviewed).toBe(16);
  });

  it("keeps identifiable, dated evidence and unresolved questions for every hotel", () => {
    for (const row of records) {
      expect(row.propertyCode).toMatch(/^[A-Z0-9]{5}$/);
      expect(row.country, row.propertyCode).toMatch(/^[A-Z]{2}$/);
      expect(row.officialName.length, row.propertyCode).toBeGreaterThan(5);
      expect(row.reviewedAt).toBe("2026-09-07");
      expect(row.detail.length, row.propertyCode).toBeGreaterThan(30);
      expect(row.unresolved.length, row.propertyCode).toBeGreaterThan(0);
      expect(row.evidence.length, row.propertyCode).toBeGreaterThan(0);
      for (const evidence of row.evidence) {
        const url = new URL(evidence.url);
        expect(url.protocol, row.propertyCode).toBe("https:");
        expect(url.username).toBe("");
        expect(url.password).toBe("");
        expect(evidence.observation.length, row.propertyCode).toBeGreaterThan(10);
        expect(evidence.freshness.length, row.propertyCode).toBeGreaterThan(0);
        expect(["web_index_or_page", "web_page"]).toContain(evidence.method);
      }
      expect(new URL(row.accessCheck.url).protocol).toBe("https:");
      expect(["fetch_error", "content_returned"]).toContain(row.accessCheck.result);
    }
  });

  it("records suggestions without silently approving any runtime mutation", () => {
    expect(review.reviewOnly).toBe(true);
    expect(review.requiresUserApproval).toBe(true);
    expect(review.runtimeChangesApplied).toBe(false);
    expect(review.approvedBaseline.updated).toBe(false);
    for (const row of records) {
      expect(row.applied, row.propertyCode).toBe(false);
      expect(row.requiresUserApproval, row.propertyCode).toBe(true);
    }
  });

  it("keeps recommendation counts consistent with all records", () => {
    const counts = records.reduce<Record<string, number>>((result, row) => {
      result[row.recommendation] = (result[row.recommendation] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual(review.summary.byRecommendation);
    expect(counts).toEqual({
      release_candidate: 3,
      conditional_release_candidate: 2,
      keep_hold: 83,
      retirement_candidate: 2,
      move_to_hold_candidate: 2,
      retention_candidate: 6,
      keep_active_pending_review: 6,
    });
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(
      review.summary.totalReviewed
    );
  });

  it("does not describe cached pages or review completion as live inventory checks", () => {
    expect(review.summary.liveInventoryChecks).toBe(0);
    expect(review.summary.initialHotelPageFetchErrors).toBe(
      records.filter((row) => row.accessCheck.result === "fetch_error").length
    );
    expect(review.summary.recordsWithFollowUpNeeded).toBe(104);
    expect(review.limitations.join(" ")).toContain("검색 색인·캐시");
    expect(review.limitations.join(" ")).toContain("104개 모두 현재 숙박 운영");
    expect(report).toContain("104개 모두 현재 운영·예약 가능을 확인했다는 뜻은 아닙니다");
  });

  it("separates source presence from operation and retains all 16 source gaps", () => {
    expect(
      records.filter((row) => row.category === "hold" && row.inCurrentOfficialSnapshot)
    ).toHaveLength(79);
    for (const row of records.filter((row) => row.category === "source_gap")) {
      expect(row.inCurrentOfficialSnapshot, row.propertyCode).toBe(false);
      expect(row.localId, row.propertyCode).toBeTruthy();
      expect(row.currentStatus).toBe("active_source_gap");
    }
  });

  it("distinguishes a successful collection requiring review from a source failure", () => {
    expect(review.sourceCheck.status).toBe("review_required");
    expect(review.sourceCheck.blockers).toEqual([]);
    expect(review.sourceCheck.summary.sourceFailures).toBe(0);
    expect(review.sourceCheck.summary.sourceFiles).toBe(17);
    expect(review.sourceCheck.summary.registrationCandidates).toBe(0);
    expect(review.sourceCheck.summary.localOnly).toBe(16);
    expect(review.approvedBaseline.sha256).toBe(previousReview.approvedBaseline.sha256);
    expect(review.sourceCheck.snapshotSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses hold decisions only for the corresponding input category", () => {
    for (const row of records) {
      if (row.category === "hold") {
        expect([
          "keep_hold",
          "release_candidate",
          "conditional_release_candidate",
        ]).toContain(row.recommendation);
        if (row.recommendation === "release_candidate") {
          expect(row.proposedHoldStatus).toBeNull();
        } else {
          expect([
            "not_yet_open",
            "reservations_unavailable",
            "verification_required",
          ]).toContain(row.proposedHoldStatus);
        }
      } else {
        expect([
          "retirement_candidate",
          "move_to_hold_candidate",
          "retention_candidate",
          "keep_active_pending_review",
        ]).toContain(row.recommendation);
      }
    }
  });

  it("requires both Marriott rates and operator or brand evidence for the three release candidates", () => {
    expect(codesFor("release_candidate")).toEqual(["BNACR", "MRYCO", "SFOPS"]);
    for (const code of codesFor("release_candidate")) {
      const row = record(code);
      expect(row.outcome).toBe("booking_and_operation_evidence");
      expect(row.evidence.some((e) => e.type === "marriott_destination")).toBe(true);
      expect(
        row.evidence.some((e) => ["operator_announcement", "brand_property"].includes(e.type))
      ).toBe(true);
      expect(new Set(row.evidence.map((e) => new URL(e.url).hostname)).size).toBeGreaterThan(1);
    }
  });

  it("does not promote conflicting Raleigh and Thekkady evidence to release approval", () => {
    expect(codesFor("conditional_release_candidate")).toEqual(["IXMRT", "RDURS"]);
    for (const code of ["IXMRT", "RDURS"]) {
      expect(record(code).outcome).toBe("conflicting_evidence");
      expect(record(code).proposedHoldStatus).toBe("verification_required");
      expect(record(code).unresolved.length).toBeGreaterThanOrEqual(2);
    }
    expect(record("IXMRT").evidence.some((e) => e.type === "marriott_opening_schedule")).toBe(true);
    expect(record("RDURS").evidence.some((e) => e.type === "operator_recruitment")).toBe(true);
  });

  it("keeps stale or incomplete future-opening evidence as verification-required hold proposals", () => {
    expect(codesFor("move_to_hold_candidate")).toEqual(["HGHHA", "SZXLP"]);
    for (const code of ["HGHHA", "SZXLP"]) {
      expect(record(code).proposedHoldStatus).toBe("verification_required");
    }
    expect(record("HGHHA").evidence.some((e) => e.type === "marriott_historical_schedule")).toBe(true);
    expect(record("HGHHA").unresolved.join(" ")).toContain("현재 유효성");
    expect(record("SZXLP").unresolved.join(" ")).toContain("날짜 없는");
  });

  it("requires independent transition evidence and historical-transaction safeguards for retirement candidates", () => {
    expect(codesFor("retirement_candidate")).toEqual(["ATLBH", "MIAWS"]);
    const southBeach = record("MIAWS");
    expect("effectiveDate" in southBeach && southBeach.effectiveDate).toBe("2026-08-19");
    expect(southBeach.evidence.some((e) => e.url === "https://2201collins.org/")).toBe(true);
    expect(southBeach.evidence.some((e) => e.type === "successor_brand_announcement")).toBe(true);
    expect(southBeach.unresolved.join(" ")).toContain("일반 W 브랜드");
    const buckhead = record("ATLBH");
    expect("effectiveDate" in buckhead && buckhead.effectiveDate).toBeFalsy();
    expect(buckhead.evidence.some((e) => e.type === "property_manager_listing")).toBe(true);
    expect(buckhead.detail).toContain("2960 Piedmont Road NE");
    expect(buckhead.detail).toContain("2220 Lake Boulevard NE");
    expect(buckhead.unresolved.join(" ")).toContain("ATLLP");
    for (const row of [southBeach, buckhead]) {
      expect(row.unresolved.join(" ")).toContain("과거");
    }
  });

  it("retains historical rates as supporting evidence rather than approving new source exceptions", () => {
    expect(codesFor("retention_candidate")).toEqual([
      "BOMFP", "CULXC", "JANCY", "LWCKS", "MUCAT", "SRQSH",
    ]);
    for (const code of codesFor("retention_candidate")) {
      const row = record(code);
      expect(row.outcome).toBe("property_evidence_with_stale_rates");
      expect(row.evidence.some((e) => e.type === "marriott_historical_rate")).toBe(true);
      expect(row.unresolved.join(" ")).toContain("현재 Marriott 예약·제휴 상태");
      expect(row.applied).toBe(false);
    }
  });

  it("leaves inconclusive source gaps unresolved instead of deleting them for unavailable pages", () => {
    expect(codesFor("keep_active_pending_review")).toEqual([
      "BJSLY", "DAYLM", "NBOMM", "RSWNS", "TAOZY", "XIYCW",
    ]);
    for (const code of codesFor("keep_active_pending_review")) {
      expect(record(code).outcome).toBe("verification_required");
    }
    expect(record("XIYCW").detail).toContain("200 CNY는 공항 이동 비용");
    expect(record("DAYLM").detail).toContain("수영장 휴장을 호텔 폐업으로 간주하지 않습니다");
    expect(record("SRQSH").detail).toContain("거래 종료 표현");
  });

  it("does not carry forward unverified old hold reasons as newly confirmed facts", () => {
    const reasonChanges = records.filter(
      (row) => row.category === "hold" && row.recommendation === "keep_hold" &&
        row.proposedHoldStatus !== row.currentStatus
    );
    expect(reasonChanges).toHaveLength(36);
    for (const code of ["CTUFF", "CTUWF", "NUMAK", "NUMLC", "NUMSA", "NUMSL", "VCEOX"]) {
      expect(record(code).proposedHoldStatus).toBe("verification_required");
    }
    expect(record("CTUWF").detail).toContain("오늘 재확인한 것으로 기록하지 않습니다");
    expect(record("UDRNH").evidence.some((e) => e.type === "marriott_opening_schedule")).toBe(true);
  });

  it("renders every reviewed hotel and every cited evidence URL in the human-readable report", () => {
    const renderedCodes = [...report.matchAll(/\| \*\*([A-Z0-9]{5})\*\* · /g)]
      .map((match) => match[1]);
    expect(renderedCodes.sort()).toEqual(records.map((row) => row.propertyCode).sort());
    for (const row of records) {
      for (const evidence of row.evidence) {
        expect(report, row.propertyCode).toContain(`](${evidence.url})`);
      }
    }
  });

  it("keeps unapproved release suggestions from changing current merchant classification", () => {
    // Approval gate for this pending patch: change this assertion only together
    // with a separately approved seed/hold patch, not during evidence refresh.
    for (const code of ["BNACR", "MRYCO", "SFOPS", "RDURS", "IXMRT"]) {
      expect(classifyMerchant(record(code).officialName)).toMatchObject({
        isLikelyMarriott: false,
        confidence: "medium",
        status: "needs_review",
      });
    }
  });
});
