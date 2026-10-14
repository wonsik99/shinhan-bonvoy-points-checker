import path from "node:path";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { parseArguments, runMarriottCheck } from "@/scripts/marriott/check.mjs";
import { loadLocalMarriottCatalog } from "@/scripts/marriott/catalog.mjs";
import {
  assertMonitoringWritePath, createMonitoringSnapshot, monitorExitCode, validateMonitoringSnapshot,
} from "@/scripts/marriott/snapshot-policy.mjs";
import {
  compareMarriottCatalogs, createOfficialSnapshot, deduplicateOfficialProperties,
} from "@/scripts/marriott/monitor.mjs";

const property = (propertyCode: string, slug = "hotel-name") => ({
  propertyCode, slug, source: "marriott",
  officialUrl: `https://www.marriott.com/en-us/hotels/${propertyCode.toLowerCase()}-${slug}/overview/`,
  sourceUrl: "https://www.marriott.com/content/dam/marriott-hws/sitemap-xmls/us-sitemap-hws-1.xml",
  lastmod: "2026-10-11",
});
const collected = (properties = [property("AAA01")]) => ({
  ...deduplicateOfficialProperties(properties),
  failures: [] as Array<{ source: string; url: string; message: string }>,
  sourceFiles: [], pagesWithoutHotelCode: [],
  sourceStats: { marriott: { shards: 7, properties: properties.length }, ritz_carlton: { shards: 7, properties: 100 }, bvlgari: { destinations: 9, properties: 9 } },
});
const snapshot = (properties = [property("AAA01")], date = "2026-10-11T21:00:00.000Z") => ({
  ...createOfficialSnapshot(collected(properties)), generatedAt: date,
});
const archive = snapshot([property("OLD01")], "2026-07-26T23:48:31.575Z");
const monitoring = createMonitoringSnapshot(snapshot(), archive);

function harness(current = collected(), baseline = monitoring) {
  const options = parseArguments(["--fail-on-official-change"], "/tmp/bonvoy-policy-test");
  const dependencies = {
    loadCatalog: vi.fn(async () => []),
    collect: vi.fn(async () => current),
    loadSnapshot: vi.fn(async (filePath: string) => filePath === options.approvalBaselinePath ? archive : baseline),
    loadHolds: vi.fn(async () => ({ version: 1, properties: [] })),
    loadExceptions: vi.fn(async () => ({ version: 1, properties: [] })),
    compare: vi.fn((...args: Parameters<typeof compareMarriottCatalogs>) => compareMarriottCatalogs(args[0], args[1], args[2], {
      ...args[3], minimumMarriottPropertyCount: 0, minimumRitzPropertyCount: 0,
      minimumBvlgariPropertyCount: 0, maximumOfficialDropRatio: 1,
    })),
    writeReport: vi.fn(async (_result: unknown, _snapshot: unknown, directory: string) => ({
      jsonPath: path.join(directory, "report.json"), markdownPath: path.join(directory, "report.md"), snapshotPath: path.join(directory, "official-snapshot.current.json"),
    })),
    writeSnapshot: vi.fn(async (_snapshot: unknown, filePath: string) => filePath),
    log: vi.fn(),
  };
  return { options, dependencies };
}

describe("Monitoring snapshot arguments and immutability", () => {
  it("defaults to a separate monitoring file without enabling writes", () => {
    const options = parseArguments([], "/tmp/bonvoy-policy-test");
    expect(options).toMatchObject({ writeMonitorBaseline: false, failOnOfficialChange: false, concurrency: 4 });
    expect(options.baselinePath).toBe("/tmp/bonvoy-policy-test/data/marriott/official-monitor-snapshot.json");
    expect(options.approvalBaselinePath).toBe("/tmp/bonvoy-policy-test/data/marriott/official-property-snapshot.json");
  });
  it("resolves explicit paths relative to the selected workspace", () => {
    expect(parseArguments(["--output-dir", "reports", "--baseline", "monitor.json", "--approval-baseline", "archive.json", "--review-holds", "holds.json", "--source-exceptions", "exceptions.json", "--concurrency", "2"], "/tmp/bonvoy-policy-test")).toMatchObject({
      outputDirectory: "/tmp/bonvoy-policy-test/reports", baselinePath: "/tmp/bonvoy-policy-test/monitor.json",
      approvalBaselinePath: "/tmp/bonvoy-policy-test/archive.json", reviewHoldsPath: "/tmp/bonvoy-policy-test/holds.json",
      sourceExceptionsPath: "/tmp/bonvoy-policy-test/exceptions.json", concurrency: 2,
    });
  });
  it.each(["--output-dir", "--baseline", "--approval-baseline", "--review-holds", "--source-exceptions", "--concurrency"])("rejects a missing value for %s", (flag) => {
    expect(() => parseArguments([flag])).toThrow("Missing value");
    expect(() => parseArguments([flag, "--fail-on-official-change"])).toThrow("Missing value");
  });
  it.each(["0", "-1", "1.5", "NaN", "Infinity"])("rejects invalid concurrency %s", (value) => {
    expect(() => parseArguments(["--concurrency", value])).toThrow("positive integer");
  });
  it("retires the ambiguous legacy write flag and rejects unknown flags", () => {
    expect(() => parseArguments(["--write-baseline"])).toThrow("retired");
    expect(() => parseArguments(["--automatic-approval"])).toThrow("Unknown argument");
  });
  it("rejects writes to both the original and a custom approval archive", () => {
    for (const approvalPath of ["data/marriott/official-property-snapshot.json", "archive.json"]) {
      expect(() => parseArguments(["--baseline", approvalPath, "--approval-baseline", approvalPath, "--write-monitor-baseline"], "/tmp/bonvoy-policy-test")).toThrow("immutable");
    }
    expect(() => parseArguments(["--baseline", "data/marriott/official-property-snapshot.json", "--approval-baseline", "other-archive.json", "--write-monitor-baseline"], "/tmp/bonvoy-policy-test")).toThrow("immutable");
    const options = parseArguments(["--write-monitor-baseline"], "/tmp/bonvoy-policy-test");
    expect(() => assertMonitoringWritePath(options)).not.toThrow();
  });
});

describe("Observation is separate from hotel activation", () => {
  it("creates a non-mutating acknowledgement with no registration approval", () => {
    const source = snapshot();
    const before = JSON.stringify(source);
    const result = createMonitoringSnapshot(source, archive);
    expect(result.monitoring).toMatchObject({ purpose: "upstream_observation_only", hotelRegistrationApproval: false, automaticUpdates: false, approvalArchiveGeneratedAt: archive.generatedAt });
    expect(result.properties).toEqual(source.properties);
    expect(JSON.stringify(source)).toBe(before);
    expect(validateMonitoringSnapshot(result)).toBe(result);
  });
  it.each([
    { purpose: "hotel_activation" }, { hotelRegistrationApproval: true },
    { automaticUpdates: true }, { acknowledgedAt: "not-a-date" },
  ])("rejects unsafe monitoring metadata %j", (overrides) => {
    expect(() => validateMonitoringSnapshot({ ...monitoring, monitoring: { ...monitoring.monitoring, ...overrides } })).toThrow("Invalid monitoring snapshot");
  });
  it("does not silently accept an unmarked archive or malformed source rows", () => {
    expect(() => validateMonitoringSnapshot(archive)).toThrow("Invalid monitoring snapshot");
    expect(() => createMonitoringSnapshot({ ...snapshot(), properties: [property("BAD-CODE")] }, archive)).toThrow("Invalid property row");
  });
  it.each(["officialAdditions", "officialDisappearances", "slugChanges", "sourceChanges"])("keeps new %s as a review failure", (field) => {
    const result = { status: "review_required", summary: { officialAdditions: 0, officialDisappearances: 0, slugChanges: 0, sourceChanges: 0, [field]: 1 } };
    expect(monitorExitCode(result, true)).toBe(2);
    expect(monitorExitCode(result, false)).toBe(0);
  });
  it("passes an unchanged directory with pending local review but never ignores a blocker", () => {
    const result = { status: "review_required", summary: { officialAdditions: 0, officialDisappearances: 0, slugChanges: 0, sourceChanges: 0, registrationCandidates: 42, localOnly: 19 } };
    expect(monitorExitCode(result, true)).toBe(0);
    expect(monitorExitCode({ ...result, status: "blocked" }, false)).toBe(1);
    expect(monitorExitCode({ ...result, status: "blocked" }, true)).toBe(1);
  });
});

describe("Full check driver with deterministic, offline dependencies", () => {
  it("collects once, preserves the historical diff and does not write either baseline", async () => {
    const { options, dependencies } = harness();
    const result = await runMarriottCheck(options, dependencies);
    expect(result.exitCode).toBe(0);
    expect(result.result.summary.registrationCandidates).toBe(1);
    expect(result.result.summary.officialAdditions).toBe(0);
    expect(result.approvalResult.summary.officialAdditions).toBe(1);
    expect(result.approvalResult.comparison.gatesWeeklyRun).toBe(false);
    expect(result.result.comparison.gatesWeeklyRun).toBe(true);
    expect(dependencies.collect).toHaveBeenCalledExactlyOnceWith({ concurrency: 4 });
    expect(dependencies.compare).toHaveBeenCalledTimes(2);
    expect(dependencies.writeReport).toHaveBeenCalledTimes(2);
    expect(dependencies.writeReport.mock.calls[1][2]).toBe(path.join(options.outputDirectory, "approval-history"));
    expect(dependencies.writeSnapshot).not.toHaveBeenCalled();
  });
  it("detects a new code without automatically acknowledging or activating it", async () => {
    const { options, dependencies } = harness(collected([property("AAA01"), property("NEW01")]));
    const result = await runMarriottCheck(options, dependencies);
    expect(result.exitCode).toBe(2);
    expect(result.result.officialAdditions.map((p: { propertyCode: string }) => p.propertyCode)).toEqual(["NEW01"]);
    expect(dependencies.writeSnapshot).not.toHaveBeenCalled();
  });
  it("does not initialize a missing monitoring baseline during normal checks", async () => {
    const { options, dependencies } = harness();
    dependencies.loadSnapshot.mockImplementation(async (filePath) => {
      if (filePath === options.approvalBaselinePath) return archive;
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    });
    await expect(runMarriottCheck(options, dependencies)).rejects.toThrow("모니터 snapshot");
    expect(dependencies.writeSnapshot).not.toHaveBeenCalled();
    expect(dependencies.writeReport).not.toHaveBeenCalled();
  });
  it("allows explicitly acknowledged first-time creation without touching the archive", async () => {
    const { options, dependencies } = harness();
    options.writeMonitorBaseline = true;
    dependencies.loadSnapshot.mockImplementation(async (filePath) => {
      if (filePath === options.approvalBaselinePath) return archive;
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    });
    expect((await runMarriottCheck(options, dependencies)).exitCode).toBe(0);
    expect(dependencies.writeSnapshot).toHaveBeenCalledTimes(1);
    expect(dependencies.writeSnapshot.mock.calls[0][1]).toBe(options.baselinePath);
    expect(dependencies.writeSnapshot.mock.calls[0][0]).toMatchObject({ monitoring: { hotelRegistrationApproval: false, automaticUpdates: false } });
  });
  it.each(["EACCES", "malformed"])("does not replace an inaccessible or invalid baseline (%s)", async (cause) => {
    const { options, dependencies } = harness();
    options.writeMonitorBaseline = true;
    dependencies.loadSnapshot.mockImplementation(async (filePath) => {
      if (filePath === options.approvalBaselinePath) return archive;
      throw Object.assign(new Error(cause), { code: cause });
    });
    await expect(runMarriottCheck(options, dependencies)).rejects.toThrow("모니터 snapshot");
    expect(dependencies.writeSnapshot).not.toHaveBeenCalled();
  });
  it("keeps source failures blocked and refuses to update the monitoring baseline", async () => {
    const current = collected();
    current.failures.push({ source: "marriott", url: "https://www.marriott.com/sitemap-index.xml", message: "HTTP 503" });
    const { options, dependencies } = harness(current);
    expect((await runMarriottCheck(options, dependencies)).exitCode).toBe(1);
    options.writeMonitorBaseline = true;
    await expect(runMarriottCheck(options, dependencies)).rejects.toThrow("무결성");
    expect(dependencies.writeSnapshot).not.toHaveBeenCalled();
  });
  it("validates write paths again when called programmatically", async () => {
    const { options, dependencies } = harness();
    options.baselinePath = options.approvalBaselinePath;
    options.writeMonitorBaseline = true;
    await expect(runMarriottCheck(options, dependencies)).rejects.toThrow("immutable");
    expect(dependencies.collect).not.toHaveBeenCalled();
  });
});

describe("Repository monitoring policy boundaries", () => {
  it("marks the real monitor file as observation-only, not an activation list", () => {
    const monitor = JSON.parse(readFileSync("data/marriott/official-monitor-snapshot.json", "utf8"));
    expect(validateMonitoringSnapshot(monitor)).toBe(monitor);
    expect(monitor.monitoring).toMatchObject({ hotelRegistrationApproval: false, automaticUpdates: false, approvalArchiveGeneratedAt: "2026-07-26T23:48:31.575Z" });
    expect(monitor.properties.length).toBeGreaterThan(9000);
  });

  it("uses the real directory baseline without discarding the local review backlog", async () => {
    const monitor = JSON.parse(readFileSync("data/marriott/official-monitor-snapshot.json", "utf8"));
    const current = {
      ...deduplicateOfficialProperties(monitor.properties), failures: [],
      sourceStats: monitor.sourceStats, sourceFiles: monitor.sourceFiles, pagesWithoutHotelCode: monitor.pagesWithoutHotelCode,
    };
    const holds = JSON.parse(readFileSync("data/marriott/property-review-holds.json", "utf8"));
    const exceptions = JSON.parse(readFileSync("data/marriott/property-source-exceptions.json", "utf8"));
    const result = compareMarriottCatalogs(await loadLocalMarriottCatalog(process.cwd()), current, monitor, {
      propertyReviewHolds: holds.properties, propertySourceExceptions: exceptions.properties,
    });
    expect(result.blockers).toEqual([]);
    expect(result.summary).toMatchObject({ officialAdditions: 0, officialDisappearances: 0, slugChanges: 0, sourceChanges: 0 });
    expect(result.summary.propertyReviewHolds).toBe(holds.properties.length);
    expect(monitorExitCode(result, true)).toBe(0);
  });

  it("retains the July archive hash and a read-only weekly workflow", () => {
    expect(createHash("sha256").update(readFileSync("data/marriott/official-property-snapshot.json")).digest("hex")).toBe("d383fa1d6c8e9520ad704aa657c9b3aaffcc6a2f01644ba3e886be71dc12c1d8");
    const workflow = readFileSync(".github/workflows/marriott-db-check.yml", "utf8");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("--baseline data/marriott/official-monitor-snapshot.json");
    expect(workflow).toContain("--fail-on-official-change");
    expect(workflow).toContain("retention-days: 30");
    expect(workflow).not.toContain("--write-monitor-baseline");
    expect(workflow).not.toContain("git push");
  });
});
