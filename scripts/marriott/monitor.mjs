import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const OFFICIAL_SOURCE_INDEXES = Object.freeze({
  marriott: "https://www.marriott.com/sitemap-index.xml",
  ritz_carlton: "https://www.ritzcarlton.com/sitemap-index.xml",
  bvlgari: "https://www.bulgarihotels.com/sitemap.xml",
});

const HOTEL_URL_PATTERN = /\/hotels\/([a-z0-9]{4,8})-([^/?#]+)/i;
const PROPERTY_CODE_PATTERN = /^[A-Z0-9]{4,8}$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const REVIEW_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PROPERTY_REVIEW_HOLD_STATUSES = new Set([
  "not_yet_open",
  "reservations_unavailable",
]);
const PROPERTY_SOURCE_EXCEPTION_STATUSES = new Set([
  "verified_active_source_gap",
]);
const SOURCE_SHARD_PATTERNS = Object.freeze({
  marriott: /\/us-sitemap-hws-\d+\.xml$/i,
  ritz_carlton: /\/trc-en-sitemap-hws-\d+\.xml$/i,
});
const SOURCE_HOSTS = Object.freeze({
  marriott: "www.marriott.com",
  ritz_carlton: "www.ritzcarlton.com",
  bvlgari: "www.bulgarihotels.com",
});
const SUSPICIOUS_SLUG_PATTERNS = [
  /(^|-)(test|testing|empower|resville)(-|$)/i,
  /for-testing-only/i,
  /do-not-book/i,
];
export const TERMINATED_AFFILIATION_NOTICES = Object.freeze([
  {
    affiliation: "Sonder",
    slugPattern: /(^|-)sonder(-|$)/i,
    noticeUrl:
      "https://www.marriott.com/en-us/marriott-brands/portfolio/sonderfaqs.mi",
    reason:
      "Marriott International과 Sonder Holdings의 계약 종료로 Marriott Bonvoy 제휴가 종료되었습니다.",
  },
]);
const SOURCE_LABELS = Object.freeze({
  marriott: "Marriott HWS XML",
  ritz_carlton: "Ritz-Carlton HWS XML",
  bvlgari: "Bvlgari Hotels official sitemap",
});

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function propertyCodeFromHotelUrl(value) {
  const match = HOTEL_URL_PATTERN.exec(value);
  return match?.[1]?.toUpperCase() ?? null;
}

export function normalizedHotelName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/[™®©]/g, "")
    .replace(/[’‘`´]/g, "'")
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractXmlUrlEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].flatMap(
    ([, block]) => {
      const location = block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1];
      if (!location) {
        return [];
      }
      return [
        {
          location: decodeXml(location.trim()),
          lastmod:
            block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim() ??
            null,
        },
      ];
    }
  );
}

export function extractSitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map(([, value]) => decodeXml(value.trim()))
    .filter(Boolean);
}

export function discoverHwsShardUrls(xml, source) {
  const pattern = SOURCE_SHARD_PATTERNS[source];
  if (!pattern) {
    throw new Error(`Unknown Marriott official source: ${source}`);
  }

  const urls = extractSitemapLocations(xml).filter((value) => {
    try {
      const url = new URL(value);
      return url.hostname === SOURCE_HOSTS[source] && pattern.test(url.pathname);
    } catch {
      return false;
    }
  });
  return [...new Set(urls)]
    .sort((left, right) => left.localeCompare(right, "en"));
}

function hotelRoutePriority(url) {
  if (/\/overview\/?(?:[?#]|$)/i.test(url)) {
    return 2;
  }
  return 1;
}

export function extractHwsProperties(xml, source, sourceUrl) {
  const byCode = new Map();

  for (const entry of extractXmlUrlEntries(xml)) {
    let url;
    try {
      url = new URL(entry.location);
    } catch {
      continue;
    }
    if (url.hostname !== SOURCE_HOSTS[source]) {
      continue;
    }
    const match = HOTEL_URL_PATTERN.exec(entry.location);
    if (!match) {
      continue;
    }

    const propertyCode = match[1].toUpperCase();
    const candidate = {
      propertyCode,
      slug: match[2].toLowerCase(),
      officialUrl: entry.location,
      source,
      sourceUrl,
      lastmod: entry.lastmod,
    };
    const existing = byCode.get(propertyCode);
    if (
      !existing ||
      hotelRoutePriority(candidate.officialUrl) >
        hotelRoutePriority(existing.officialUrl)
    ) {
      byCode.set(propertyCode, candidate);
    }
  }

  return [...byCode.values()].sort((left, right) =>
    left.propertyCode.localeCompare(right.propertyCode, "en")
  );
}

export function extractBvlgariDestinationEntries(xml) {
  const entries = [];
  for (const entry of extractXmlUrlEntries(xml)) {
    let url;
    try {
      url = new URL(entry.location);
    } catch {
      continue;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (
      url.hostname !== "www.bulgarihotels.com" ||
      segments.length !== 2 ||
      segments[0] !== "en_US"
    ) {
      continue;
    }
    entries.push({
      city: segments[1].toLowerCase(),
      officialUrl: url.toString(),
      lastmod: entry.lastmod,
    });
  }
  return entries.sort((left, right) => left.city.localeCompare(right.city, "en"));
}

export function propertyCodeFromBvlgariHtml(html) {
  const codes = new Set(
    [...html.matchAll(
      /hotelCode(?:&quot;|")?\s*:\s*(?:&quot;|")([A-Z0-9]{4,8})/gi
    )].map((match) => match[1].toUpperCase())
  );
  return codes.size === 1 ? [...codes][0] : null;
}

export function isSuspiciousOfficialProperty(property) {
  return (
    /^AQA/.test(property.propertyCode) ||
    SUSPICIOUS_SLUG_PATTERNS.some((pattern) => pattern.test(property.slug))
  );
}

export function terminatedAffiliationForProperty(property) {
  const notice = TERMINATED_AFFILIATION_NOTICES.find(({ slugPattern }) =>
    slugPattern.test(property.slug)
  );
  return notice ? { ...property, ...notice, slugPattern: undefined } : null;
}

export function isTerminatedOfficialProperty(property) {
  return terminatedAffiliationForProperty(property) !== null;
}

export function deduplicateOfficialProperties(records) {
  const byCode = new Map();
  const duplicates = [];
  const conflicts = [];

  for (const record of records) {
    const existing = byCode.get(record.propertyCode);
    if (!existing) {
      byCode.set(record.propertyCode, record);
      continue;
    }

    const detail = {
      propertyCode: record.propertyCode,
      first: existing,
      duplicate: record,
    };
    if (
      existing.source === record.source &&
      normalizedHotelName(existing.slug) === normalizedHotelName(record.slug)
    ) {
      duplicates.push(detail);
    } else {
      conflicts.push(detail);
    }
  }

  const properties = [...byCode.values()].sort((left, right) =>
    left.propertyCode.localeCompare(right.propertyCode, "en")
  );
  return {
    properties,
    duplicates,
    conflicts,
    quarantined: properties.filter(isSuspiciousOfficialProperty),
    terminatedAffiliations: properties.flatMap((property) => {
      const terminated = terminatedAffiliationForProperty(property);
      return terminated ? [terminated] : [];
    }),
  };
}

async function fetchText(
  url,
  { fetchImpl = fetch, retries = 1, timeoutMs = 30_000 } = {}
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: {
          accept: "application/xml,text/xml,text/html;q=0.9,*/*;q=0.8",
          "user-agent": "Shinhan-Bonvoy-Checker-Marriott-DB-Monitor/1.0",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return {
        text: await response.text(),
        status: response.status,
        lastModified: response.headers.get("last-modified"),
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), Math.max(items.length, 1)) },
      () => run()
    )
  );
  return results;
}

async function collectHwsSource(source, options) {
  const indexUrl = OFFICIAL_SOURCE_INDEXES[source];
  const failures = [];
  const sourceFiles = [];
  let shardUrls = [];

  try {
    const index = await fetchText(indexUrl, options);
    shardUrls = discoverHwsShardUrls(index.text, source);
    sourceFiles.push({
      source,
      kind: "index",
      url: indexUrl,
      status: index.status,
      lastModified: index.lastModified,
    });
  } catch (error) {
    failures.push({
      source,
      url: indexUrl,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const shardResults = await mapWithConcurrency(
    shardUrls,
    options.concurrency,
    async (url) => {
      try {
        const response = await fetchText(url, options);
        sourceFiles.push({
          source,
          kind: "property_shard",
          url,
          status: response.status,
          lastModified: response.lastModified,
        });
        return extractHwsProperties(response.text, source, url);
      } catch (error) {
        failures.push({
          source,
          url,
          message: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    }
  );

  const deduplicated = deduplicateOfficialProperties(shardResults.flat());
  return {
    ...deduplicated,
    failures,
    sourceFiles,
    shardCount: shardUrls.length,
  };
}

async function collectBvlgariSource(options) {
  const source = "bvlgari";
  const sitemapUrl = OFFICIAL_SOURCE_INDEXES.bvlgari;
  const failures = [];
  const sourceFiles = [];
  const pagesWithoutHotelCode = [];
  let destinations = [];

  try {
    const sitemap = await fetchText(sitemapUrl, options);
    destinations = extractBvlgariDestinationEntries(sitemap.text);
    sourceFiles.push({
      source,
      kind: "sitemap",
      url: sitemapUrl,
      status: sitemap.status,
      lastModified: sitemap.lastModified,
    });
  } catch (error) {
    failures.push({
      source,
      url: sitemapUrl,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const properties = (
    await mapWithConcurrency(destinations, options.concurrency, async (destination) => {
      try {
        const response = await fetchText(destination.officialUrl, options);
        const propertyCode = propertyCodeFromBvlgariHtml(response.text);
        if (!propertyCode) {
          pagesWithoutHotelCode.push(destination);
          return null;
        }
        return {
          propertyCode,
          slug: `bvlgari-${destination.city}`,
          officialUrl: destination.officialUrl,
          source,
          sourceUrl: sitemapUrl,
          lastmod: destination.lastmod,
        };
      } catch (error) {
        failures.push({
          source,
          url: destination.officialUrl,
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    })
  ).filter(Boolean);

  const deduplicated = deduplicateOfficialProperties(properties);
  return {
    ...deduplicated,
    failures,
    sourceFiles,
    shardCount: destinations.length,
    pagesWithoutHotelCode: pagesWithoutHotelCode.sort((left, right) =>
      left.city.localeCompare(right.city, "en")
    ),
  };
}

export async function collectOfficialMarriottCatalog({
  fetchImpl = fetch,
  concurrency = 4,
  retries = 1,
  timeoutMs = 30_000,
} = {}) {
  const options = { fetchImpl, concurrency, retries, timeoutMs };
  const [marriott, ritzCarlton, bvlgari] = await Promise.all([
    collectHwsSource("marriott", options),
    collectHwsSource("ritz_carlton", options),
    collectBvlgariSource(options),
  ]);
  const deduplicated = deduplicateOfficialProperties([
    ...marriott.properties,
    ...ritzCarlton.properties,
    ...bvlgari.properties,
  ]);

  return {
    ...deduplicated,
    failures: [
      ...marriott.failures,
      ...ritzCarlton.failures,
      ...bvlgari.failures,
    ],
    sourceFiles: [
      ...marriott.sourceFiles,
      ...ritzCarlton.sourceFiles,
      ...bvlgari.sourceFiles,
    ].sort((left, right) => left.url.localeCompare(right.url, "en")),
    sourceStats: {
      marriott: {
        shards: marriott.shardCount,
        properties: marriott.properties.length,
      },
      ritz_carlton: {
        shards: ritzCarlton.shardCount,
        properties: ritzCarlton.properties.length,
      },
      bvlgari: {
        destinations: bvlgari.shardCount,
        properties: bvlgari.properties.length,
      },
    },
    pagesWithoutHotelCode: bvlgari.pagesWithoutHotelCode,
  };
}

export function createOfficialSnapshot(collection) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    properties: collection.properties.map((property) => ({
      propertyCode: property.propertyCode,
      slug: property.slug,
      officialUrl: property.officialUrl,
      source: property.source,
      lastmod: property.lastmod,
    })),
    sourceStats: collection.sourceStats,
    sourceFiles: collection.sourceFiles,
    pagesWithoutHotelCode: collection.pagesWithoutHotelCode,
  };
}

export function validateOfficialSnapshot(snapshot) {
  if (snapshot?.version !== 1 || !Array.isArray(snapshot.properties)) {
    throw new Error("Unsupported Marriott official snapshot");
  }

  const seenCodes = new Set();
  for (const property of snapshot.properties) {
    if (
      !PROPERTY_CODE_PATTERN.test(property?.propertyCode ?? "") ||
      typeof property?.slug !== "string" ||
      !property.slug ||
      typeof property?.officialUrl !== "string" ||
      !property.officialUrl ||
      !Object.hasOwn(SOURCE_LABELS, property?.source) ||
      (() => {
        try {
          return new URL(property.officialUrl).hostname !== SOURCE_HOSTS[property.source];
        } catch {
          return true;
        }
      })()
    ) {
      throw new Error("Invalid property row in Marriott official snapshot");
    }
    if (seenCodes.has(property.propertyCode)) {
      throw new Error(
        `Duplicate property code in Marriott official snapshot: ${property.propertyCode}`
      );
    }
    seenCodes.add(property.propertyCode);
  }

  return snapshot;
}

export async function loadOfficialSnapshot(filePath) {
  const snapshot = JSON.parse(await readFile(filePath, "utf8"));
  try {
    return validateOfficialSnapshot(snapshot);
  } catch (error) {
    throw new Error(`Invalid Marriott snapshot: ${filePath}`, { cause: error });
  }
}

export function validatePropertyReviewHolds(document) {
  if (document?.version !== 1 || !Array.isArray(document.properties)) {
    throw new Error("Unsupported Marriott property review hold document");
  }

  const seenCodes = new Set();
  for (const property of document.properties) {
    let officialUrl;
    try {
      officialUrl = new URL(property?.officialUrl);
    } catch {
      officialUrl = null;
    }
    if (
      !PROPERTY_CODE_PATTERN.test(property?.propertyCode ?? "") ||
      typeof property?.officialName !== "string" ||
      !property.officialName.trim() ||
      !COUNTRY_CODE_PATTERN.test(property?.country ?? "") ||
      !["domestic", "overseas"].includes(property?.region) ||
      !Array.isArray(property?.aliases) ||
      property.aliases.length === 0 ||
      property.aliases.some(
        (alias) => typeof alias !== "string" || !alias.trim()
      ) ||
      !PROPERTY_REVIEW_HOLD_STATUSES.has(property?.status) ||
      typeof property?.reason !== "string" ||
      !property.reason.trim() ||
      officialUrl?.protocol !== "https:" ||
      !REVIEW_DATE_PATTERN.test(property?.lastReviewedAt ?? "")
    ) {
      throw new Error("Invalid property row in Marriott review hold document");
    }
    if (seenCodes.has(property.propertyCode)) {
      throw new Error(
        `Duplicate property code in Marriott review hold document: ${property.propertyCode}`
      );
    }
    seenCodes.add(property.propertyCode);
  }

  return document;
}

export async function loadPropertyReviewHolds(filePath) {
  const document = JSON.parse(await readFile(filePath, "utf8"));
  try {
    return validatePropertyReviewHolds(document);
  } catch (error) {
    throw new Error(`Invalid Marriott review hold document: ${filePath}`, {
      cause: error,
    });
  }
}

export function validatePropertySourceExceptions(document) {
  if (document?.version !== 1 || !Array.isArray(document.properties)) {
    throw new Error("Unsupported Marriott property source exception document");
  }

  const seenCodes = new Set();
  for (const property of document.properties) {
    let evidenceUrl;
    try {
      evidenceUrl = new URL(property?.evidenceUrl);
    } catch {
      evidenceUrl = null;
    }
    if (
      !PROPERTY_CODE_PATTERN.test(property?.propertyCode ?? "") ||
      typeof property?.officialName !== "string" ||
      !property.officialName.trim() ||
      !PROPERTY_SOURCE_EXCEPTION_STATUSES.has(property?.status) ||
      typeof property?.reason !== "string" ||
      !property.reason.trim() ||
      evidenceUrl?.protocol !== "https:" ||
      !REVIEW_DATE_PATTERN.test(property?.lastReviewedAt ?? "")
    ) {
      throw new Error(
        "Invalid property row in Marriott source exception document"
      );
    }
    if (seenCodes.has(property.propertyCode)) {
      throw new Error(
        `Duplicate property code in Marriott source exception document: ${property.propertyCode}`
      );
    }
    seenCodes.add(property.propertyCode);
  }

  return document;
}

export async function loadPropertySourceExceptions(filePath) {
  const document = JSON.parse(await readFile(filePath, "utf8"));
  try {
    return validatePropertySourceExceptions(document);
  } catch (error) {
    throw new Error(`Invalid Marriott source exception document: ${filePath}`, {
      cause: error,
    });
  }
}

function recordsByCode(records) {
  return new Map(records.map((record) => [record.propertyCode, record]));
}

function localCodeConflicts(records) {
  const owners = new Map();
  const conflicts = [];
  for (const record of records) {
    for (const propertyCode of [
      ...(record.propertyCode ? [record.propertyCode] : []),
      ...(record.formerPropertyCodes ?? []),
    ]) {
      const owner = owners.get(propertyCode);
      if (owner) {
        conflicts.push({ propertyCode, first: owner, duplicate: record });
      } else {
        owners.set(propertyCode, record);
      }
    }
  }
  return conflicts;
}

export function compareMarriottCatalogs(
  localRecords,
  collection,
  baseline,
  {
    minimumMarriottShardCount = 7,
    minimumMarriottPropertyCount = 9_000,
    minimumRitzShardCount = 7,
    minimumRitzPropertyCount = 100,
    minimumBvlgariPropertyCount = 6,
    maximumOfficialDropRatio = 0.02,
    propertyReviewHolds = [],
    propertySourceExceptions = [],
  } = {}
) {
  const quarantinedCodes = new Set(
    collection.quarantined.map((property) => property.propertyCode)
  );
  const terminatedAffiliationCodes = new Set(
    collection.terminatedAffiliations.map((property) => property.propertyCode)
  );
  const currentSafe = collection.properties.filter(
    (property) =>
      !quarantinedCodes.has(property.propertyCode) &&
      !terminatedAffiliationCodes.has(property.propertyCode)
  );
  const baselineSafe = baseline.properties.filter(
    (property) =>
      !isSuspiciousOfficialProperty(property) &&
      !isTerminatedOfficialProperty(property)
  );
  const currentByCode = recordsByCode(currentSafe);
  const currentRawByCode = recordsByCode(collection.properties);
  const baselineByCode = recordsByCode(baselineSafe);
  const localWithCode = localRecords.filter((record) => record.propertyCode);
  const localByCode = recordsByCode(localWithCode);
  const reviewHoldsByCode = recordsByCode(propertyReviewHolds);
  const sourceExceptionsByCode = recordsByCode(propertySourceExceptions);

  const officialAdditions = currentSafe.filter(
    (record) => !baselineByCode.has(record.propertyCode)
  );
  const officialDisappearances = baselineSafe.filter(
    (record) => !currentByCode.has(record.propertyCode)
  );
  const slugChanges = currentSafe.flatMap((record) => {
    const previous = baselineByCode.get(record.propertyCode);
    return previous && normalizedHotelName(previous.slug) !== normalizedHotelName(record.slug)
      ? [{ propertyCode: record.propertyCode, previous, current: record }]
      : [];
  });
  const sourceChanges = currentSafe.flatMap((record) => {
    const previous = baselineByCode.get(record.propertyCode);
    return previous && previous.source !== record.source
      ? [{ propertyCode: record.propertyCode, previous, current: record }]
      : [];
  });
  const registrationCandidates = currentSafe.filter(
    (record) =>
      !localByCode.has(record.propertyCode) &&
      !reviewHoldsByCode.has(record.propertyCode)
  );
  const rawLocalOnly = localWithCode.filter(
    (record) => !currentRawByCode.has(record.propertyCode)
  );
  const localOnly = rawLocalOnly.filter(
    (record) => !sourceExceptionsByCode.has(record.propertyCode)
  );
  const terminatedLocalProperties = localWithCode.filter((record) =>
    terminatedAffiliationCodes.has(record.propertyCode)
  );
  const heldLocalProperties = localWithCode.filter((record) =>
    reviewHoldsByCode.has(record.propertyCode)
  );
  const heldProperties = propertyReviewHolds
    .map((hold) => ({
      ...hold,
      officialProperty: currentRawByCode.get(hold.propertyCode) ?? null,
    }))
    .sort((left, right) =>
      left.propertyCode.localeCompare(right.propertyCode, "en")
    );
  const sourceExceptionProperties = propertySourceExceptions
    .map((exception) => ({
      ...exception,
      localProperty: localByCode.get(exception.propertyCode) ?? null,
      officialProperty: currentRawByCode.get(exception.propertyCode) ?? null,
    }))
    .sort((left, right) =>
      left.propertyCode.localeCompare(right.propertyCode, "en")
    );
  const resolvedSourceExceptions = sourceExceptionProperties.filter(
    (property) => property.officialProperty
  );
  const orphanSourceExceptions = sourceExceptionProperties.filter(
    (property) => !property.localProperty
  );
  const heldSourceExceptions = sourceExceptionProperties.filter((property) =>
    reviewHoldsByCode.has(property.propertyCode)
  );
  const localWithoutCode = localRecords.filter((record) => !record.propertyCode);
  const duplicateLocalCodes = localCodeConflicts(localRecords);
  const blockers = [];

  if (collection.failures.length > 0) {
    blockers.push("하나 이상의 공식 소스를 읽지 못했습니다.");
  }
  if (collection.conflicts.length > 0) {
    blockers.push("같은 property code가 서로 다른 공식 소스 항목에 연결됐습니다.");
  }
  if (localWithoutCode.length > 0) {
    blockers.push("공식 property code가 없는 로컬 호텔이 있습니다.");
  }
  if (duplicateLocalCodes.length > 0) {
    blockers.push("로컬 DB에 중복된 공식 property code가 있습니다.");
  }
  if (heldLocalProperties.length > 0) {
    blockers.push("등록 보류 호텔이 활성 로컬 DB에도 등록되어 있습니다.");
  }
  if (orphanSourceExceptions.length > 0) {
    blockers.push("공식 소스 누락 예외가 활성 로컬 DB에 없습니다.");
  }
  if (heldSourceExceptions.length > 0) {
    blockers.push("같은 호텔 코드가 등록 보류와 공식 소스 누락 예외에 함께 있습니다.");
  }
  if (collection.sourceStats.marriott.shards < minimumMarriottShardCount) {
    blockers.push(`Marriott HWS XML shard가 ${minimumMarriottShardCount}개보다 적습니다.`);
  }
  if (collection.sourceStats.marriott.properties < minimumMarriottPropertyCount) {
    blockers.push(`Marriott HWS 호텔이 ${minimumMarriottPropertyCount.toLocaleString("en-US")}개보다 적습니다.`);
  }
  if (collection.sourceStats.ritz_carlton.shards < minimumRitzShardCount) {
    blockers.push(`Ritz-Carlton HWS XML shard가 ${minimumRitzShardCount}개보다 적습니다.`);
  }
  if (collection.sourceStats.ritz_carlton.properties < minimumRitzPropertyCount) {
    blockers.push(`Ritz-Carlton 호텔이 ${minimumRitzPropertyCount}개보다 적습니다.`);
  }
  if (collection.sourceStats.bvlgari.properties < minimumBvlgariPropertyCount) {
    blockers.push(`Bvlgari 운영 호텔이 ${minimumBvlgariPropertyCount}개보다 적습니다.`);
  }

  const officialDropRatio =
    baselineSafe.length === 0
      ? 0
      : officialDisappearances.length / baselineSafe.length;
  if (officialDropRatio > maximumOfficialDropRatio) {
    blockers.push(
      `공식 목록 감소율 ${(officialDropRatio * 100).toFixed(2)}%가 안전 기준 ${(maximumOfficialDropRatio * 100).toFixed(2)}%를 넘었습니다.`
    );
  }

  const hasReviewItems =
    officialAdditions.length > 0 ||
    officialDisappearances.length > 0 ||
    slugChanges.length > 0 ||
    sourceChanges.length > 0 ||
    registrationCandidates.length > 0 ||
    localOnly.length > 0 ||
    terminatedLocalProperties.length > 0 ||
    resolvedSourceExceptions.length > 0;
  const status =
    blockers.length > 0
      ? "blocked"
      : hasReviewItems
        ? "review_required"
        : "current";

  return {
    generatedAt: new Date().toISOString(),
    status,
    blockers,
    summary: {
      localProperties: localRecords.length,
      localPropertiesWithCode: localWithCode.length,
      officialProperties: collection.properties.length,
      safeOfficialProperties: currentSafe.length,
      marriottProperties: collection.sourceStats.marriott.properties,
      ritzCarltonProperties: collection.sourceStats.ritz_carlton.properties,
      bvlgariProperties: collection.sourceStats.bvlgari.properties,
      officialAdditions: officialAdditions.length,
      officialDisappearances: officialDisappearances.length,
      slugChanges: slugChanges.length,
      sourceChanges: sourceChanges.length,
      registrationCandidates: registrationCandidates.length,
      rawLocalOnly: rawLocalOnly.length,
      localOnly: localOnly.length,
      reviewedSourceGaps: sourceExceptionProperties.length,
      resolvedSourceGaps: resolvedSourceExceptions.length,
      orphanSourceExceptions: orphanSourceExceptions.length,
      quarantined: collection.quarantined.length,
      terminatedAffiliations: collection.terminatedAffiliations.length,
      terminatedLocalProperties: terminatedLocalProperties.length,
      propertyReviewHolds: heldProperties.length,
      heldOfficialProperties: heldProperties.filter(
        (property) => property.officialProperty
      ).length,
      heldLocalProperties: heldLocalProperties.length,
      bvlgariPagesWithoutCode: collection.pagesWithoutHotelCode.length,
      sourceFailures: collection.failures.length,
      sourceFiles: collection.sourceFiles.length,
    },
    sourceStats: collection.sourceStats,
    sourceFiles: collection.sourceFiles,
    officialAdditions,
    officialDisappearances,
    slugChanges,
    sourceChanges,
    registrationCandidates,
    heldProperties,
    heldLocalProperties,
    sourceExceptionProperties,
    resolvedSourceExceptions,
    orphanSourceExceptions,
    heldSourceExceptions,
    localOnly,
    terminatedLocalProperties,
    localWithoutCode,
    duplicateLocalCodes,
    quarantined: collection.quarantined,
    terminatedAffiliations: collection.terminatedAffiliations,
    pagesWithoutHotelCode: collection.pagesWithoutHotelCode,
    duplicateOfficialListings: collection.duplicates,
    conflictingOfficialListings: collection.conflicts,
    sourceFailures: collection.failures,
  };
}

function markdownTable(headers, rows) {
  if (rows.length === 0) {
    return "변경 없음 / No changes\n";
  }
  const escape = (value) => String(value ?? "").replaceAll("|", "\\|");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
    "",
  ].join("\n");
}

function officialLink(record) {
  return record.officialUrl ? `[열기](${record.officialUrl})` : "";
}

function reviewHoldStatusLabel(status) {
  return {
    not_yet_open: "운영 전",
    reservations_unavailable: "예약 미개시",
  }[status] ?? status;
}

function sourceExceptionStatusLabel(status) {
  return {
    verified_active_source_gap: "운영 확인·소스 누락",
  }[status] ?? status;
}

export function renderMarriottUpdateReport(result) {
  const statusLabel = {
    current: "최신 / Current",
    review_required: "검토 필요 / Review required",
    blocked: "판정 차단 / Blocked",
  }[result.status];
  const lines = [
    "# Marriott 호텔 DB 업데이트 확인",
    "",
    `- 상태: **${statusLabel}**`,
    `- 생성 시각: ${result.generatedAt}`,
    `- 로컬 호텔: ${result.summary.localProperties.toLocaleString("en-US")}`,
    `- 공식 코드 합계(격리 포함): ${result.summary.officialProperties.toLocaleString("en-US")}`,
    `- Marriott / Ritz-Carlton / Bvlgari: ${result.summary.marriottProperties.toLocaleString("en-US")} / ${result.summary.ritzCarltonProperties.toLocaleString("en-US")} / ${result.summary.bvlgariProperties.toLocaleString("en-US")}`,
    "",
    "> Marriott·Ritz-Carlton 공식 HWS XML과 Bvlgari 공식 sitemap/예약 메타데이터를 property code로 비교합니다. URL slug는 변경 신호일 뿐 공식 호텔명으로 단정하지 않습니다.",
    "",
    "> 이 보고서는 후보만 제시합니다. 호텔 DB, alias, 기준 snapshot, 배포 파일을 자동으로 수정하거나 merge하지 않습니다.",
    "",
  ];

  if (result.blockers.length > 0) {
    lines.push("## 판정 차단 사유", "", ...result.blockers.map((item) => `- ${item}`), "");
  }

  lines.push(
    "## 공식 소스 상태",
    "",
    markdownTable(
      ["Source", "Kind", "Last-Modified", "URL"],
      result.sourceFiles.map((item) => [
        SOURCE_LABELS[item.source] ?? item.source,
        item.kind,
        item.lastModified ?? "-",
        item.url,
      ])
    ),
    "## 기준 snapshot 이후 새 공식 코드",
    "",
    markdownTable(
      ["Code", "URL slug", "Source", "공식 페이지"],
      result.officialAdditions.map((item) => [
        item.propertyCode,
        item.slug,
        SOURCE_LABELS[item.source] ?? item.source,
        officialLink(item),
      ])
    ),
    "## 기준 snapshot에서 사라진 공식 코드",
    "",
    markdownTable(
      ["Code", "이전 URL slug", "Source", "이전 공식 페이지"],
      result.officialDisappearances.map((item) => [
        item.propertyCode,
        item.slug,
        SOURCE_LABELS[item.source] ?? item.source,
        officialLink(item),
      ])
    ),
    "## 공식 URL slug 변경",
    "",
    markdownTable(
      ["Code", "이전 slug", "현재 slug", "공식 페이지"],
      result.slugChanges.map((item) => [
        item.propertyCode,
        item.previous.slug,
        item.current.slug,
        officialLink(item.current),
      ])
    ),
    "## 로컬 DB 등록 검토 후보",
    "",
    markdownTable(
      ["Code", "URL slug", "Source", "공식 페이지"],
      result.registrationCandidates.map((item) => [
        item.propertyCode,
        item.slug,
        SOURCE_LABELS[item.source] ?? item.source,
        officialLink(item),
      ])
    ),
    "## 활성 등록 보류 호텔(자동 등록 후보 제외)",
    "",
    markdownTable(
      ["Code", "호텔", "상태", "공식 코드 묶음", "최종 검토일", "보류 사유", "검토 페이지"],
      result.heldProperties.map((item) => [
        item.propertyCode,
        item.officialName,
        reviewHoldStatusLabel(item.status),
        item.officialProperty ? "현재 확인됨" : "현재 없음",
        item.lastReviewedAt,
        item.reason,
        item.officialProperty
          ? officialLink(item.officialProperty)
          : item.officialUrl
            ? `[열기](${item.officialUrl})`
            : "",
      ])
    ),
    "## 활성 로컬 DB와 중복된 보류 호텔",
    "",
    markdownTable(
      ["Code", "현재 로컬 이름", "로컬 위치"],
      result.heldLocalProperties.map((item) => [
        item.propertyCode,
        item.officialName,
        `${item.sourceFile}:${item.sourceLine}`,
      ])
    ),
    "## 검토 완료된 공식 소스 누락 예외",
    "",
    markdownTable(
      ["Code", "현재 로컬 이름", "상태", "공식 코드 묶음", "최종 검토일", "검토 사유", "근거"],
      result.sourceExceptionProperties.map((item) => [
        item.propertyCode,
        item.localProperty?.officialName ?? item.officialName,
        sourceExceptionStatusLabel(item.status),
        item.officialProperty ? "다시 확인됨" : "현재 없음",
        item.lastReviewedAt,
        item.reason,
        `[열기](${item.evidenceUrl})`,
      ])
    ),
    "## 공식 코드 묶음에 다시 나타난 예외(예외 제거 검토)",
    "",
    markdownTable(
      ["Code", "현재 로컬 이름", "공식 페이지"],
      result.resolvedSourceExceptions.map((item) => [
        item.propertyCode,
        item.localProperty?.officialName ?? item.officialName,
        officialLink(item.officialProperty),
      ])
    ),
    "## 로컬에는 있으나 현재 공식 코드 묶음에는 없음",
    "",
    markdownTable(
      ["Code", "현재 로컬 이름", "로컬 위치"],
      result.localOnly.map((item) => [
        item.propertyCode,
        item.officialName,
        `${item.sourceFile}:${item.sourceLine}`,
      ])
    ),
    "## 공식적으로 제휴가 종료된 항목(자동 후보 제외)",
    "",
    markdownTable(
      ["Code", "URL slug", "종료 제휴", "공식 종료 공지"],
      result.terminatedAffiliations.map((item) => [
        item.propertyCode,
        item.slug,
        item.affiliation,
        `[열기](${item.noticeUrl})`,
      ])
    ),
    "## 로컬 DB에 남아 있는 제휴 종료 항목",
    "",
    markdownTable(
      ["Code", "현재 로컬 이름", "로컬 위치"],
      result.terminatedLocalProperties.map((item) => [
        item.propertyCode,
        item.officialName,
        `${item.sourceFile}:${item.sourceLine}`,
      ])
    ),
    "## 테스트/QA 의심 공식 항목(자동 후보 제외)",
    "",
    markdownTable(
      ["Code", "URL slug", "Source"],
      result.quarantined.map((item) => [
        item.propertyCode,
        item.slug,
        SOURCE_LABELS[item.source] ?? item.source,
      ])
    ),
    "## Bvlgari hotelCode 없는 루트 페이지",
    "",
    markdownTable(
      ["Page", "공식 페이지"],
      result.pagesWithoutHotelCode.map((item) => [
        item.city,
        `[열기](${item.officialUrl})`,
      ])
    )
  );

  if (result.sourceFailures.length > 0) {
    lines.push(
      "## 공식 소스 수집 실패",
      "",
      markdownTable(
        ["Source", "URL", "오류"],
        result.sourceFailures.map((item) => [
          SOURCE_LABELS[item.source] ?? item.source,
          item.url,
          item.message,
        ])
      )
    );
  }

  lines.push(
    "## 검토 원칙",
    "",
    "1. 신규·slug 변경 후보는 연결된 공식 destination 페이지에서 호텔명, 브랜드, 지역, 예약 가능 상태를 사람이 확인합니다.",
    "2. XML에서 한 번 사라졌다는 이유만으로 로컬 호텔을 삭제하지 않습니다. 일시 누락, 리브랜딩, 별도 브랜드 소스 여부를 재확인합니다.",
    "3. 등록 보류 호텔은 활성 탐지 DB와 신규 등록 후보에서 제외하고, 실제 예약·운영 상태를 사람이 확인한 뒤에만 등록합니다.",
    "4. 검토 완료된 소스 누락 예외가 공식 코드 묶음에 다시 나타나면 예외를 제거할지 검토합니다.",
    "5. 카드 명세서 alias는 공식 호텔 목록과 별개입니다. 사용자 제보와 실제 명세서로 검증한 뒤에만 수동 규칙에 추가합니다.",
    ""
  );

  return `${lines.join("\n").trim()}\n`;
}

export async function writeOfficialSnapshot(snapshot, filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return filePath;
}

export async function writeMarriottUpdateReport(
  result,
  currentSnapshot,
  outputDirectory
) {
  await mkdir(outputDirectory, { recursive: true });
  const jsonPath = path.join(outputDirectory, "report.json");
  const markdownPath = path.join(outputDirectory, "report.md");
  const snapshotPath = path.join(outputDirectory, "official-snapshot.current.json");
  await Promise.all([
    writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8"),
    writeFile(markdownPath, renderMarriottUpdateReport(result), "utf8"),
    writeFile(snapshotPath, `${JSON.stringify(currentSnapshot, null, 2)}\n`, "utf8"),
  ]);
  return { jsonPath, markdownPath, snapshotPath };
}
