import path from "node:path";
import { validateOfficialSnapshot } from "./monitor.mjs";

/** Observing the upstream directory is not approval to activate its hotels. */
export function createMonitoringSnapshot(snapshot, approvalArchive) {
  validateOfficialSnapshot(snapshot);
  validateOfficialSnapshot(approvalArchive);
  return validateMonitoringSnapshot({
    ...snapshot,
    monitoring: {
      purpose: "upstream_observation_only",
      acknowledgedAt: snapshot.generatedAt,
      hotelRegistrationApproval: false,
      automaticUpdates: false,
      approvalArchiveGeneratedAt: approvalArchive.generatedAt,
    },
  });
}

export function validateMonitoringSnapshot(snapshot) {
  validateOfficialSnapshot(snapshot);
  if (
    snapshot.monitoring?.purpose !== "upstream_observation_only" ||
    snapshot.monitoring.hotelRegistrationApproval !== false ||
    snapshot.monitoring.automaticUpdates !== false ||
    !Number.isFinite(Date.parse(snapshot.monitoring.acknowledgedAt))
  ) {
    throw new Error("Invalid monitoring snapshot: explicit observation-only acknowledgement is required");
  }
  return snapshot;
}

export function assertMonitoringWritePath(options) {
  const protectedPaths = [
    options.approvalBaselinePath,
    path.join(options.workspaceRoot, "data/marriott/official-property-snapshot.json"),
  ].map((filePath) => path.resolve(filePath));
  if (protectedPaths.includes(path.resolve(options.baselinePath))) {
    throw new Error("The approval snapshot is immutable; choose a separate monitoring baseline");
  }
}

/** Local review backlog is retained in the report, not treated as new drift. */
export function monitorExitCode(result, failOnOfficialChange) {
  if (result.status === "blocked") return 1;
  const changes = result.summary.officialAdditions +
    result.summary.officialDisappearances +
    result.summary.slugChanges +
    result.summary.sourceChanges;
  return failOnOfficialChange && changes > 0 ? 2 : 0;
}
