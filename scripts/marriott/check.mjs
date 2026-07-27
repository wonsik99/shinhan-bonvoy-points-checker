#!/usr/bin/env node

import path from "node:path";
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

function parseArguments(arguments_) {
  const options = {
    outputDirectory: path.join(process.cwd(), ".marriott-reports", "latest"),
    baselinePath: path.join(
      process.cwd(),
      "data",
      "marriott",
      "official-property-snapshot.json"
    ),
    reviewHoldsPath: path.join(
      process.cwd(),
      "data",
      "marriott",
      "property-review-holds.json"
    ),
    sourceExceptionsPath: path.join(
      process.cwd(),
      "data",
      "marriott",
      "property-source-exceptions.json"
    ),
    concurrency: 4,
    writeBaseline: false,
    failOnOfficialChange: false,
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--output-dir") {
      options.outputDirectory = path.resolve(arguments_[index + 1]);
      index += 1;
    } else if (argument === "--baseline") {
      options.baselinePath = path.resolve(arguments_[index + 1]);
      index += 1;
    } else if (argument === "--concurrency") {
      options.concurrency = Number(arguments_[index + 1]);
      index += 1;
    } else if (argument === "--review-holds") {
      options.reviewHoldsPath = path.resolve(arguments_[index + 1]);
      index += 1;
    } else if (argument === "--source-exceptions") {
      options.sourceExceptionsPath = path.resolve(arguments_[index + 1]);
      index += 1;
    } else if (argument === "--write-baseline") {
      options.writeBaseline = true;
    } else if (argument === "--fail-on-official-change") {
      options.failOnOfficialChange = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const [
    localRecords,
    collection,
    reviewHoldDocument,
    sourceExceptionDocument,
  ] = await Promise.all([
    loadLocalMarriottCatalog(),
    collectOfficialMarriottCatalog({ concurrency: options.concurrency }),
    loadPropertyReviewHolds(options.reviewHoldsPath),
    loadPropertySourceExceptions(options.sourceExceptionsPath),
  ]);
  const currentSnapshot = createOfficialSnapshot(collection);
  let baseline;

  try {
    baseline = await loadOfficialSnapshot(options.baselinePath);
  } catch (error) {
    if (!options.writeBaseline) {
      throw new Error(
        `기준 snapshot을 읽을 수 없습니다. 최초 1회 검증 후 --write-baseline으로 생성하세요: ${options.baselinePath}`,
        { cause: error }
      );
    }
    baseline = currentSnapshot;
  }

  const result = compareMarriottCatalogs(
    localRecords,
    collection,
    baseline,
    {
      propertyReviewHolds: reviewHoldDocument.properties,
      propertySourceExceptions: sourceExceptionDocument.properties,
    }
  );
  const paths = await writeMarriottUpdateReport(
    result,
    currentSnapshot,
    options.outputDirectory
  );

  if (options.writeBaseline) {
    if (result.status === "blocked") {
      throw new Error("공식 소스 무결성 검사가 실패해 기준 snapshot을 갱신하지 않았습니다.");
    }
    await writeOfficialSnapshot(currentSnapshot, options.baselinePath);
    console.log(`Baseline snapshot: ${options.baselinePath}`);
  }

  console.log(`Marriott DB monitor: ${result.status}`);
  console.log(`Markdown report: ${paths.markdownPath}`);
  console.log(`JSON report: ${paths.jsonPath}`);
  console.log(`Current snapshot: ${paths.snapshotPath}`);
  console.log(
    `Official changes: +${result.summary.officialAdditions} / slug ${result.summary.slugChanges} / disappeared ${result.summary.officialDisappearances}`
  );
  console.log(
    `Local review: add ${result.summary.registrationCandidates} / hold ${result.summary.propertyReviewHolds} / source-gap ${result.summary.reviewedSourceGaps} / unreviewed local-only ${result.summary.localOnly}`
  );

  if (result.status === "blocked") {
    process.exitCode = 1;
  } else if (
    options.failOnOfficialChange &&
    result.summary.officialAdditions +
      result.summary.officialDisappearances +
      result.summary.slugChanges +
      result.summary.sourceChanges >
      0
  ) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
