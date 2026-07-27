import path from "node:path";
import { describe, expect, it } from "vitest";
import { marriottProperties } from "@/rules/marriottProperties";
import { curatedMarriottPropertyAliases } from "@/rules/marriottPropertyOverrides";
import {
  findDuplicateLocalPropertyCodes,
  loadLocalMarriottCatalog,
} from "@/scripts/marriott/catalog.mjs";
import {
  compareMarriottCatalogs,
  createOfficialSnapshot,
  deduplicateOfficialProperties,
  discoverHwsShardUrls,
  extractBvlgariDestinationEntries,
  extractHwsProperties,
  isTerminatedOfficialProperty,
  loadPropertyReviewHolds,
  loadPropertySourceExceptions,
  normalizedHotelName,
  propertyCodeFromBvlgariHtml,
  propertyCodeFromHotelUrl,
  renderMarriottUpdateReport,
  validateOfficialSnapshot,
  validatePropertyReviewHolds,
  validatePropertySourceExceptions,
} from "@/scripts/marriott/monitor.mjs";

const marriottShard =
  "https://www.marriott.com/content/dam/marriott-hws/sitemap-xmls/us-sitemap-hws-1.xml";
const ritzShard =
  "https://www.ritzcarlton.com/content/dam/marriott-hws/sitemap-xmls/trc-en-sitemap-hws-1.xml";

function officialProperty(
  propertyCode: string,
  slug: string,
  source = "marriott"
) {
  return {
    propertyCode,
    slug,
    officialUrl: `https://www.marriott.com/en-us/hotels/${propertyCode.toLowerCase()}-${slug}/overview/`,
    source,
    sourceUrl: marriottShard,
    lastmod: "2026-07-18",
  };
}

function collection(properties: ReturnType<typeof officialProperty>[]) {
  const deduplicated = deduplicateOfficialProperties(properties);
  return {
    ...deduplicated,
    failures: [] as Array<{ source: string; url: string; message: string }>,
    sourceFiles: [],
    sourceStats: {
      marriott: { shards: 7, properties: properties.length },
      ritz_carlton: { shards: 7, properties: 100 },
      bvlgari: { destinations: 9, properties: 9 },
    },
    pagesWithoutHotelCode: [],
  };
}

function baseline(properties: ReturnType<typeof officialProperty>[]) {
  return {
    version: 1,
    generatedAt: "2026-07-18T00:00:00.000Z",
    properties,
    sourceStats: {},
    pagesWithoutHotelCode: [],
  };
}

describe("Marriott hotel DB update monitor", () => {
  it("extracts an official property code from a hotel URL", () => {
    expect(
      propertyCodeFromHotelUrl(
        "https://www.marriott.com/en-us/hotels/osaoo-moxy-osaka-umeda/overview/"
      )
    ).toBe("OSAOO");
  });

  it("normalizes typography without hiding a real name change", () => {
    expect(normalizedHotelName("Le Méridien® Seoul")).toBe(
      normalizedHotelName("LE MERIDIEN SEOUL")
    );
    expect(normalizedHotelName("Moxy Osaka Shin Umeda")).not.toBe(
      normalizedHotelName("Moxy Osaka Umeda")
    );
  });

  it("discovers only the canonical English Marriott and Ritz HWS shards", () => {
    const marriottIndex = `
      <sitemapindex>
        <sitemap><loc>${marriottShard}</loc></sitemap>
        <sitemap><loc>https://www.marriott.com/content/dam/marriott-hws/sitemap-xmls/ja-sitemap-hws-1.xml</loc></sitemap>
        <sitemap><loc>https://example.com/us-sitemap-hws-2.xml</loc></sitemap>
      </sitemapindex>`;
    const ritzIndex = `
      <sitemapindex>
        <sitemap><loc>${ritzShard}</loc></sitemap>
        <sitemap><loc>https://www.ritzcarlton.com/other.xml</loc></sitemap>
      </sitemapindex>`;

    expect(discoverHwsShardUrls(marriottIndex, "marriott")).toEqual([
      marriottShard,
    ]);
    expect(discoverHwsShardUrls(ritzIndex, "ritz_carlton")).toEqual([
      ritzShard,
    ]);
  });

  it("deduplicates hotel routes by code and prefers the overview URL", () => {
    const xml = `
      <urlset>
        <url><loc>https://www.marriott.com/en-us/hotels/osaoo-moxy-osaka-umeda/rooms/</loc><lastmod>2026-07-17</lastmod></url>
        <url><loc>https://www.marriott.com/en-us/hotels/osaoo-moxy-osaka-umeda/overview/</loc><lastmod>2026-07-18</lastmod></url>
        <url><loc>https://example.com/en-us/hotels/fake1-fake-hotel/overview/</loc></url>
      </urlset>`;

    expect(extractHwsProperties(xml, "marriott", marriottShard)).toEqual([
      {
        propertyCode: "OSAOO",
        slug: "moxy-osaka-umeda",
        officialUrl:
          "https://www.marriott.com/en-us/hotels/osaoo-moxy-osaka-umeda/overview/",
        source: "marriott",
        sourceUrl: marriottShard,
        lastmod: "2026-07-18",
      },
    ]);
  });

  it("treats a Bvlgari city as active only when its page exposes hotelCode", () => {
    const xml = `
      <urlset>
        <url><loc>https://www.bulgarihotels.com/en_US/tokyo</loc></url>
        <url><loc>https://www.bulgarihotels.com/en_US/tokyo/whats-on</loc></url>
      </urlset>`;

    expect(extractBvlgariDestinationEntries(xml)).toEqual([
      {
        city: "tokyo",
        officialUrl: "https://www.bulgarihotels.com/en_US/tokyo",
        lastmod: null,
      },
    ]);
    expect(propertyCodeFromBvlgariHtml('{"hotelCode":"TYOBT"}')).toBe(
      "TYOBT"
    );
    expect(propertyCodeFromBvlgariHtml("future hotel page")).toBeNull();
    expect(
      propertyCodeFromBvlgariHtml(
        '{"hotelCode":"TYOBT"}{"hotelCode":"DXBBG"}'
      )
    ).toBeNull();
  });

  it("quarantines obvious test codes and reports real cross-source conflicts", () => {
    const valid = officialProperty("TYOBT", "bvlgari-hotel-tokyo", "bvlgari");
    const suspicious = officialProperty("AQAXN", "ce-growth-test-hotel");
    const result = deduplicateOfficialProperties([
      valid,
      { ...valid },
      { ...valid, source: "ritz_carlton", slug: "different-hotel" },
      suspicious,
    ]);

    expect(result.properties).toHaveLength(2);
    expect(result.duplicates).toHaveLength(1);
    expect(result.conflicts).toHaveLength(1);
    expect(result.quarantined.map((item) => item.propertyCode)).toEqual([
      "AQAXN",
    ]);
  });

  it("excludes officially terminated Sonder affiliations from registration candidates", () => {
    const sonder = officialProperty(
      "AGPHT",
      "salitre-hotel-malaga-centro-sonder"
    );
    const active = officialProperty("ADBXT", "moxy-izmir");
    const current = collection([sonder, active]);
    const result = compareMarriottCatalogs([], current, baseline([]), {
      minimumMarriottPropertyCount: 0,
      minimumRitzPropertyCount: 0,
      minimumBvlgariPropertyCount: 0,
    });

    expect(isTerminatedOfficialProperty(sonder)).toBe(true);
    expect(isTerminatedOfficialProperty(active)).toBe(false);
    expect(
      result.registrationCandidates.map(
        (item: { propertyCode: string }) => item.propertyCode
      )
    ).toEqual(["ADBXT"]);
    expect(
      result.terminatedAffiliations.map(
        (item: { propertyCode: string }) => item.propertyCode
      )
    ).toEqual(["AGPHT"]);
    expect(renderMarriottUpdateReport(result)).toContain(
      "공식적으로 제휴가 종료된 항목"
    );
  });

  it("keeps held hotels out of registration candidates and reports them separately", () => {
    const held = officialProperty("VCEOX", "moxy-venice-airport");
    const active = officialProperty("ADBXT", "moxy-izmir");
    const current = collection([held, active]);
    const result = compareMarriottCatalogs([], current, baseline([]), {
      minimumMarriottPropertyCount: 0,
      minimumRitzPropertyCount: 0,
      minimumBvlgariPropertyCount: 0,
      propertyReviewHolds: [
        {
          propertyCode: "VCEOX",
          officialName: "Moxy Venice Airport",
          country: "IT",
          region: "overseas",
          aliases: ["Moxy Venice Airport"],
          status: "not_yet_open",
          reason: "운영 개시 전",
          officialUrl:
            "https://www.marriott.com/en-us/hotels/vceox-moxy-venice-airport/overview/",
          lastReviewedAt: "2026-07-22",
        },
      ],
    });

    expect(
      result.registrationCandidates.map(
        (item: { propertyCode: string }) => item.propertyCode
      )
    ).toEqual(["ADBXT"]);
    expect(result.summary.propertyReviewHolds).toBe(1);
    expect(result.summary.heldOfficialProperties).toBe(1);
    expect(result.heldProperties[0]).toMatchObject({
      propertyCode: "VCEOX",
      status: "not_yet_open",
      officialProperty: held,
    });
    expect(renderMarriottUpdateReport(result)).toContain(
      "활성 등록 보류 호텔(자동 등록 후보 제외)"
    );
  });

  it("blocks when a held hotel is accidentally restored to the active local DB", () => {
    const local = {
      localId: "it-moxy-venice-airport",
      propertyCode: "VCEOX",
      country: "IT",
      officialName: "Moxy Venice Airport",
      sourceFile: "rules/marriottProperties/it.ts",
      sourceLine: 1,
    };
    const result = compareMarriottCatalogs(
      [local],
      collection([]),
      baseline([]),
      {
        minimumMarriottPropertyCount: 0,
        minimumRitzPropertyCount: 0,
        minimumBvlgariPropertyCount: 0,
        propertyReviewHolds: [
          {
            propertyCode: "VCEOX",
            officialName: "Moxy Venice Airport",
            country: "IT",
            region: "overseas",
            aliases: ["Moxy Venice Airport"],
            status: "not_yet_open",
            reason: "운영 개시 전",
            officialUrl:
              "https://www.marriott.com/en-us/hotels/vceox-moxy-venice-airport/overview/",
            lastReviewedAt: "2026-07-22",
          },
        ],
      }
    );

    expect(result.status).toBe("blocked");
    expect(result.summary.heldLocalProperties).toBe(1);
    expect(result.blockers).toContain(
      "등록 보류 호텔이 활성 로컬 DB에도 등록되어 있습니다."
    );
  });

  it("keeps manually verified source gaps out of unresolved local-only review", () => {
    const local = {
      localId: "tr-delta-hotels-bodrum",
      propertyCode: "BJVDE",
      country: "TR",
      officialName: "Delta Hotels Bodrum",
      sourceFile: "rules/marriottProperties/tr.ts",
      sourceLine: 1,
    };
    const result = compareMarriottCatalogs(
      [local],
      collection([]),
      baseline([]),
      {
        minimumMarriottPropertyCount: 0,
        minimumRitzPropertyCount: 0,
        minimumBvlgariPropertyCount: 0,
        propertySourceExceptions: [
          {
            propertyCode: "BJVDE",
            officialName: "Delta Hotels Bodrum",
            status: "verified_active_source_gap",
            reason: "운영사 공식 사이트에서 현재 운영을 확인했습니다.",
            evidenceUrl: "https://deltahotelsmarriottbodrum.com/en",
            lastReviewedAt: "2026-07-22",
          },
        ],
      }
    );

    expect(result.status).toBe("current");
    expect(result.summary.rawLocalOnly).toBe(1);
    expect(result.summary.localOnly).toBe(0);
    expect(result.summary.reviewedSourceGaps).toBe(1);
    expect(result.sourceExceptionProperties[0]).toMatchObject({
      propertyCode: "BJVDE",
      localProperty: local,
      officialProperty: null,
    });
    expect(renderMarriottUpdateReport(result)).toContain(
      "검토 완료된 공식 소스 누락 예외"
    );
  });

  it("separates upstream changes from local registration and removal review", () => {
    const oldA = officialProperty("AAA01", "old-hotel-name");
    const missingB = officialProperty("BBB01", "missing-from-current");
    const newA = officialProperty("AAA01", "new-hotel-name");
    const newD = officialProperty("DDD01", "new-property");
    const local = [
      {
        localId: "AAA01",
        propertyCode: "AAA01",
        country: "JP",
        officialName: "Hotel A",
        sourceFile: "rules/marriottProperties/jp.ts",
        sourceLine: 1,
      },
      {
        localId: "BBB01",
        propertyCode: "BBB01",
        country: "JP",
        officialName: "Hotel B",
        sourceFile: "rules/marriottProperties/jp.ts",
        sourceLine: 2,
      },
    ];

    const result = compareMarriottCatalogs(
      local,
      collection([newA, newD]),
      baseline([oldA, missingB]),
      {
        minimumMarriottPropertyCount: 0,
        minimumRitzPropertyCount: 0,
        minimumBvlgariPropertyCount: 0,
        maximumOfficialDropRatio: 1,
      }
    );

    expect(result.status).toBe("review_required");
    expect(result.officialAdditions.map((item: { propertyCode: string }) => item.propertyCode)).toEqual([
      "DDD01",
    ]);
    expect(
      result.officialDisappearances.map((item: { propertyCode: string }) => item.propertyCode)
    ).toEqual(["BBB01"]);
    expect(result.slugChanges.map((item: { propertyCode: string }) => item.propertyCode)).toEqual([
      "AAA01",
    ]);
    expect(
      result.registrationCandidates.map((item: { propertyCode: string }) => item.propertyCode)
    ).toEqual(["DDD01"]);
    expect(result.localOnly.map((item: { propertyCode: string }) => item.propertyCode)).toEqual([
      "BBB01",
    ]);
  });

  it("blocks conclusions when an official source is incomplete", () => {
    const current = collection([]);
    current.failures.push({
      source: "marriott",
      url: marriottShard,
      message: "HTTP 503",
    });
    current.sourceStats.marriott.shards = 0;

    const result = compareMarriottCatalogs([], current, baseline([]));

    expect(result.status).toBe("blocked");
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "하나 이상의 공식 소스를 읽지 못했습니다.",
        "Marriott HWS XML shard가 7개보다 적습니다.",
      ])
    );
  });

  it("creates a versioned snapshot and renders a non-mutating review report", () => {
    const current = collection([officialProperty("AAA01", "hotel-a")]);
    const snapshot = createOfficialSnapshot(current);
    const result = compareMarriottCatalogs(
      [],
      current,
      baseline(snapshot.properties),
      {
        minimumMarriottPropertyCount: 0,
        minimumRitzPropertyCount: 0,
        minimumBvlgariPropertyCount: 0,
      }
    );
    const report = renderMarriottUpdateReport(result);

    expect(snapshot.version).toBe(1);
    expect(snapshot.sourceFiles).toEqual([]);
    expect(report).toContain("Marriott 호텔 DB 업데이트 확인");
    expect(report).toContain("자동으로 수정하거나 merge하지 않습니다");
  });

  it("rejects malformed or duplicate rows in an approved snapshot", () => {
    const duplicate = officialProperty("AAA01", "hotel-a");
    expect(() =>
      validateOfficialSnapshot(baseline([duplicate, duplicate]))
    ).toThrow("Duplicate property code");
    expect(() =>
      validateOfficialSnapshot(
        baseline([{ ...duplicate, propertyCode: "bad-code" }])
      )
    ).toThrow("Invalid property row");
  });

  it("rejects malformed or duplicate property review holds", () => {
    const hold = {
      propertyCode: "VCEOX",
      officialName: "Moxy Venice Airport",
      country: "IT",
      region: "overseas",
      aliases: ["Moxy Venice Airport"],
      status: "not_yet_open",
      reason: "운영 개시 전",
      officialUrl:
        "https://www.marriott.com/en-us/hotels/vceox-moxy-venice-airport/overview/",
      lastReviewedAt: "2026-07-22",
    };

    expect(() =>
      validatePropertyReviewHolds({ version: 1, properties: [hold, hold] })
    ).toThrow("Duplicate property code");
    expect(() =>
      validatePropertyReviewHolds({
        version: 1,
        properties: [{ ...hold, status: "active" }],
      })
    ).toThrow("Invalid property row");
  });

  it("rejects malformed or duplicate property source exceptions", () => {
    const exception = {
      propertyCode: "BJVDE",
      officialName: "Delta Hotels Bodrum",
      status: "verified_active_source_gap",
      reason: "운영사 공식 사이트에서 현재 운영을 확인했습니다.",
      evidenceUrl: "https://deltahotelsmarriottbodrum.com/en",
      lastReviewedAt: "2026-07-22",
    };

    expect(() =>
      validatePropertySourceExceptions({
        version: 1,
        properties: [exception, exception],
      })
    ).toThrow("Duplicate property code");
    expect(() =>
      validatePropertySourceExceptions({
        version: 1,
        properties: [{ ...exception, evidenceUrl: "javascript:alert(1)" }],
      })
    ).toThrow("Invalid property row");
  });

  it("resolves a unique official code for every local seed", async () => {
    const records = await loadLocalMarriottCatalog(path.resolve("."));
    const runtimeById = new Map(
      marriottProperties.map((property) => [property.id, property])
    );

    expect(records).toHaveLength(marriottProperties.length);
    expect(records).toHaveLength(10_287);
    expect(records.filter((record) => record.propertyCode)).toHaveLength(
      10_287
    );
    expect(findDuplicateLocalPropertyCodes(records)).toEqual([]);
    for (const record of records) {
      expect(runtimeById.get(record.localId)?.propertyCode, record.localId).toBe(
        record.propertyCode
      );
    }
  });

  it("keeps the app ID separate from Bvlgari Tokyo's official code", () => {
    const tokyo = marriottProperties.find(
      (property) => property.propertyCode === "TYOBT"
    );

    expect(tokyo).toMatchObject({
      id: "jp-tyobt",
      propertyCode: "TYOBT",
      officialName: "Bvlgari Hotel Tokyo",
    });
  });

  it("registers approved additions and excludes terminated or held hotels", async () => {
    const propertiesByCode = new Map(
      marriottProperties.map((property) => [property.propertyCode, property])
    );

    expect(propertiesByCode.get("ADBXT")?.officialName).toBe("Moxy Izmir");
    expect(propertiesByCode.get("ILPSE")?.officialName).toBe(
      "Le Domaine Oro, Series by Marriott"
    );
    expect(propertiesByCode.get("ROMIT")?.officialName).toBe(
      "citizenM Rome Isola Tiberina"
    );
    for (const code of ["LJGJP", "LONTG", "TAOZY"]) {
      expect(propertiesByCode.has(code), code).toBe(true);
    }
    for (const code of [
      "BEGAC",
      "ISTXA",
      "MQTTS",
      "SNAAF",
      "SNAAL",
      "WASWF",
      "XICQP",
    ]) {
      expect(propertiesByCode.has(code), code).toBe(false);
    }
    expect(propertiesByCode.get("PSPHR")).toMatchObject({
      officialName:
        "RESET Hotel Joshua Tree National Park, Outdoor Collection by Marriott Bonvoy",
      brand: "Outdoor Collection by Marriott Bonvoy",
    });
    expect(propertiesByCode.get("BGITU")?.formerPropertyCodes).toEqual([
      "BGIAU",
    ]);
    expect(propertiesByCode.get("CUNWA")?.formerPropertyCodes).toEqual([
      "CUNWO",
    ]);
    expect(propertiesByCode.get("ILPSE")?.formerPropertyCodes).toEqual([
      "ILPMD",
    ]);
    expect(propertiesByCode.get("NOUSR")?.formerPropertyCodes).toEqual([
      "NOUMD",
    ]);
    expect(propertiesByCode.get("NOUDR")?.formerPropertyCodes).toEqual([
      "NOUSI",
    ]);
    expect(propertiesByCode.get("PVRWA")?.formerPropertyCodes).toEqual([
      "PVRWI",
    ]);

    for (const code of [
      "AGPHT",
      "AUSAF",
      "BCNHA",
      "BCNHG",
      "BCNHL",
      "BCNHP",
      "BCNHR",
      "BCNHV",
      "RTMHM",
      "DXBCH",
      "VCELC",
      "AQAOA",
    ]) {
      expect(propertiesByCode.has(code), code).toBe(false);
    }

    const reviewHoldDocument = await loadPropertyReviewHolds(
      path.resolve("data/marriott/property-review-holds.json")
    );
    expect(reviewHoldDocument.properties).toHaveLength(28);
    expect(
      reviewHoldDocument.properties.filter(
        (property: { status: string }) => property.status === "not_yet_open"
      )
    ).toHaveLength(8);
    expect(
      reviewHoldDocument.properties.filter(
        (property: { status: string }) =>
          property.status === "reservations_unavailable"
      )
    ).toHaveLength(20);

    for (const property of reviewHoldDocument.properties) {
      expect(propertiesByCode.has(property.propertyCode), property.propertyCode).toBe(
        false
      );
    }

    const sourceExceptionDocument = await loadPropertySourceExceptions(
      path.resolve("data/marriott/property-source-exceptions.json")
    );
    expect(sourceExceptionDocument.properties).toHaveLength(21);
    for (const property of sourceExceptionDocument.properties) {
      expect(
        propertiesByCode.has(property.propertyCode),
        property.propertyCode
      ).toBe(true);
      expect(property.status).toBe("verified_active_source_gap");
    }
  });

  it("keeps every curated alias attached to an existing stable property ID", () => {
    const propertiesById = new Map(
      marriottProperties.map((property) => [property.id, property])
    );

    for (const [propertyId, aliases] of Object.entries(
      curatedMarriottPropertyAliases
    )) {
      const property = propertiesById.get(propertyId);
      expect(property, propertyId).toBeDefined();
      for (const alias of aliases) {
        expect(
          property?.aliases.some((candidate) => candidate.value === alias.value),
          `${propertyId}: ${alias.value}`
        ).toBe(true);
      }
    }
  });
});
