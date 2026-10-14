#!/usr/bin/env node

import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadLocalMarriottCatalog } from "./catalog.mjs";
import {
  collectOfficialMarriottCatalog,
  compareMarriottCatalogs,
  createOfficialSnapshot,
  loadOfficialSnapshot,
  loadPropertyReviewHolds,
  loadPropertySourceExceptions,
  writeMarriottUpdateReport,
  writeOfficialSnapshot,
} from "./monitor.mjs";
import {
  assertMonitoringWritePath,
  createMonitoringSnapshot,
  monitorExitCode,
  validateMonitoringSnapshot,
} from "./snapshot-policy.mjs";

export function parseArguments(arguments_, workspaceRoot = process.cwd()) {
  const options = {
    workspaceRoot,
    outputDirectory: path.join(workspaceRoot, ".marriott-reports", "latest"),
    baselinePath: path.join(
      workspaceRoot,
      "data",
      "marriott",
      "official-monitor-snapshot.json"
    ),
    approvalBaselinePath: path.join(workspaceRoot, "data/marriott/official-property-snapshot.json"),
    reviewHoldsPath: path.join(
      workspaceRoot,
      "data",
      "marriott",
      "property-review-holds.json"
    ),
    sourceExceptionsPath: path.join(
      workspaceRoot,
      "data",
      "marriott",
      "property-source-exceptions.json"
    ),
    concurrency: 4,
    writeMonitorBaseline: false,
    failOnOfficialChange: false,
  };

  const nextValue = (index) => {
    const value = arguments_[index + 1];
    if (typeof value !== "string" || !value.trim() || value.startsWith("--")) {
      throw new Error(`Missing value for ${arguments_[index]}`);
    }
    return value;
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--output-dir") {
      options.outputDirectory = path.resolve(workspaceRoot, nextValue(index));
      index += 1;
    } else if (argument === "--baseline") {
      options.baselinePath = path.resolve(workspaceRoot, nextValue(index));
      index += 1;
    } else if (argument === "--approval-baseline") {
      options.approvalBaselinePath = path.resolve(workspaceRoot, nextValue(index));
      index += 1;
    } else if (argument === "--concurrency") {
      options.concurrency = Number(nextValue(index));
      index += 1;
    } else if (argument === "--review-holds") {
      options.reviewHoldsPath = path.resolve(workspaceRoot, nextValue(index));
      index += 1;
    } else if (argument === "--source-exceptions") {
      options.sourceExceptionsPath = path.resolve(workspaceRoot, nextValue(index));
      index += 1;
    } else if (argument === "--write-baseline") {
      throw new Error("--write-baseline is retired; preserve the approval archive and use --write-monitor-baseline after explicit approval");
    } else if (argument === "--write-monitor-baseline") {
      options.writeMonitorBaseline = true;
    } else if (argument === "--fail-on-official-change") {
      options.failOnOfficialChange = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }
  if (options.writeMonitorBaseline) assertMonitoringWritePath(options);
  return options;
}

/** Reuse the original report writer, adding an explicit baseline-role heading. */
export async function writeScopedReport(result, snapshot, outputDirectory) {
  const paths = await writeMarriottUpdateReport(result, snapshot, outputDirectory);
  const markdown = await readFile(paths.markdownPath, "utf8");
  const { role, baselinePath, baselineGeneratedAt } = result.comparison;
  const title = role === "upstream_monitoring"
    ? "주간 변경 감지 / Upstream monitoring"
    : "7월 승인 이력 대비 누적 변화 / Approval history (informational)";
  const header = [
    `# ${title}`,
    "",
    `비교 기준: ${baselinePath} (${baselineGeneratedAt}).`,
    "공식 목록 관찰과 호텔 등록 승인은 별개입니다. 미등록·보류·소스 이탈 검토는 계속 남습니다.",
    role === "upstream_monitoring"
      ? "주간 실패 조건은 이 모니터 기준 대비 새 공식 변경 또는 소스 무결성 차단입니다."
      : "이 누적 비교는 이력 보존용이며 주간 실패 조건이 아닙니다.",
    "",
  ].join("\n");
  await writeFile(paths.markdownPath, `${header}\n${markdown}`, "utf8");
  return paths;
}

export async function runMarriottCheck(options, {
  loadCatalog = loadLocalMarriottCatalog,
  collect = collectOfficialMarriottCatalog,
  loadSnapshot = loadOfficialSnapshot,
  loadHolds = loadPropertyReviewHolds,
  loadExceptions = loadPropertySourceExceptions,
  compare = compareMarriottCatalogs,
  writeReport = writeScopedReport,
  writeSnapshot = writeOfficialSnapshot,
  log = console.log,
} = {}) {
  if (options.writeMonitorBaseline) assertMonitoringWritePath(options);
  const [
    localRecords,
    collection,
    reviewHoldDocument,
    sourceExceptionDocument,
    approvalBaseline,
  ] = await Promise.all([
    loadCatalog(options.workspaceRoot),
    collect({ concurrency: options.concurrency }),
    loadHolds(options.reviewHoldsPath),
    loadExceptions(options.sourceExceptionsPath),
    loadSnapshot(options.approvalBaselinePath),
  ]);
  const currentSnapshot = createOfficialSnapshot(collection);
  let baseline;

  try {
    baseline = validateMonitoringSnapshot(await loadSnapshot(options.baselinePath));
  } catch (error) {
    // Only an explicitly approved first-time creation may handle ENOENT.
    // Malformed or inaccessible baselines must never be silently replaced.
    if (!options.writeMonitorBaseline || error?.code !== "ENOENT") {
      throw new Error(
        `모니터 snapshot을 읽을 수 없습니다. 원인을 확인하고 최초 생성은 명시 승인 후 --write-monitor-baseline으로 진행하세요: ${options.baselinePath}`,
        { cause: error }
      );
    }
    baseline = createMonitoringSnapshot(currentSnapshot, approvalBaseline);
  }

  const comparisonOptions = {
    propertyReviewHolds: reviewHoldDocument.properties,
    propertySourceExceptions: sourceExceptionDocument.properties,
  };
  const withContext = (result, snapshot, baselinePath, role) => ({
    ...result,
    comparison: {
      role,
      baselinePath: path.relative(options.workspaceRoot, baselinePath),
      baselineGeneratedAt: snapshot.generatedAt,
      gatesWeeklyRun: role === "upstream_monitoring",
      hotelRegistrationApproval: false,
      exitCode: role === "upstream_monitoring"
        ? monitorExitCode(result, options.failOnOfficialChange)
        : null,
    },
  });
  const result = withContext(
    compare(localRecords, collection, baseline, comparisonOptions),
    baseline, options.baselinePath, "upstream_monitoring"
  );
  const approvalResult = withContext(
    compare(localRecords, collection, approvalBaseline, comparisonOptions),
    approvalBaseline, options.approvalBaselinePath, "approval_history"
  );
  const paths = await writeReport(
    result,
    currentSnapshot,
    options.outputDirectory
  );
  const approvalPaths = await writeReport(
    approvalResult, currentSnapshot, path.join(options.outputDirectory, "approval-history")
  );

  if (options.writeMonitorBaseline) {
    if (result.status === "blocked" || approvalResult.status === "blocked") {
      throw new Error("공식 소스 무결성 검사가 실패해 모니터 snapshot을 갱신하지 않았습니다.");
    }
    await writeSnapshot(createMonitoringSnapshot(currentSnapshot, approvalBaseline), options.baselinePath);
    log(`Monitoring baseline snapshot: ${options.baselinePath}`);
  }

  log(`Marriott DB monitor: ${result.status}`);
  log(`Markdown report: ${paths.markdownPath}`);
  log(`JSON report: ${paths.jsonPath}`);
  log(`Current snapshot: ${paths.snapshotPath}`);
  log(`Approval history report (informational): ${approvalPaths.markdownPath}`);
  log(
    `Official changes: +${result.summary.officialAdditions} / slug ${result.summary.slugChanges} / disappeared ${result.summary.officialDisappearances}`
  );
  log(
    `Local review: add ${result.summary.registrationCandidates} / hold ${result.summary.propertyReviewHolds} / source-gap ${result.summary.reviewedSourceGaps} / unreviewed local-only ${result.summary.localOnly}`
  );

  const exitCode = monitorExitCode(result, options.failOnOfficialChange);
  log(`Monitor exit code: ${exitCode} (0=no new drift; 1=blocked; 2=new upstream changes)`);
  return { result, approvalResult, paths, approvalPaths, exitCode };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  Promise.resolve()
    .then(() => runMarriottCheck(parseArguments(process.argv.slice(2))))
    .then(({ exitCode }) => { process.exitCode = exitCode; })
    .catch((error) => {
      console.error(error instanceof Error ? error.stack : error);
      process.exitCode = 1;
    });
}
