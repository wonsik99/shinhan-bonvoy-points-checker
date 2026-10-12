import path from "node:path";
import { describe, expect, it } from "vitest";
import { marriottProperties } from "@/rules/marriottProperties";
import { curatedMarriottPropertyAliases } from "@/rules/marriottPropertyOverrides";
import septemberReview from "@/data/marriott/reviews/2026-09-06.json";
import octoberReview from "@/data/marriott/reviews/2026-10-03-verification.json";
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

  it("ignores Bvlgari utility roots even when a shared widget exposes a hotel code", () => {
    const utilityRoutes = [
      "bvlgari-tokyo-ginza-bar-cafe", "contact-us",
      "il-ristorante-niko-romito-reservation", "meta", "reservation",
      "reservation-the-bulgari-bar-and-bulgari-lounge",
      "the-bulgari-lounge-london-reservation",
    ];
    const routes = [...utilityRoutes, "CONTACT-US/", "dubai", "future-destination"];
    const xml = `<urlset>${routes.map((route) =>
      `<url><loc>https://www.bulgarihotels.com/en_US/${route}</loc></url>`
    ).join("")}</urlset>`;
    const destinations = extractBvlgariDestinationEntries(xml);
    expect(destinations.map((entry: { city: string }) => entry.city)).toEqual([
      "dubai", "future-destination",
    ]);
    // The contact page's single shared DXBBG widget must never win deduplication.
    const htmlByCity: Record<string, string> = {
      "contact-us": '{"hotelCode":"DXBBG"}',
      dubai: '{"hotelCode":"DXBBG"}',
      "future-destination": "Opening soon",
    };
    const properties = destinations.flatMap((entry: { city: string; officialUrl: string }) => {
      const code = propertyCodeFromBvlgariHtml(htmlByCity[entry.city]);
      return code ? [{ ...officialProperty(code, `bvlgari-${entry.city}`, "bvlgari"), officialUrl: entry.officialUrl }] : [];
    });
    expect(deduplicateOfficialProperties(properties).properties).toMatchObject([
      { propertyCode: "DXBBG", officialUrl: "https://www.bulgarihotels.com/en_US/dubai" },
    ]);
  });

  it("keeps inconclusive hotel evidence in review without claiming the hotel is closed", () => {
    const hold = {
      propertyCode: "VIESI", officialName: "Hotel Savoyen Vienna",
      country: "AT", region: "overseas", aliases: ["Savoyen Vienna"],
      status: "verification_required", reason: "현재 운영·예약 개시 확인 필요",
      officialUrl: "https://www.marriott.com/en-us/hotels/viesi-hotel-savoyen-vienna/overview/",
      lastReviewedAt: "2026-09-06",
    };
    expect(validatePropertyReviewHolds({ version: 1, properties: [hold] }).properties).toEqual([hold]);
    const result = compareMarriottCatalogs([], collection([
      officialProperty("VIESI", "hotel-savoyen-vienna"),
    ]), baseline([]), {
      minimumMarriottPropertyCount: 0, minimumRitzPropertyCount: 0,
      minimumBvlgariPropertyCount: 0, propertyReviewHolds: [hold],
    });
    expect(result.registrationCandidates).toEqual([]);
    expect(result.heldProperties[0].status).toBe("verification_required");
    expect(renderMarriottUpdateReport(result)).toContain("| 확인 필요 |");
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

  it("renders an official source change in the Markdown review report", () => {
    const previous = officialProperty("AAA01", "hotel-a");
    const current = {
      ...officialProperty("AAA01", "hotel-a", "ritz_carlton"),
      officialUrl:
        "https://www.ritzcarlton.com/en/hotels/aaa01-hotel-a/overview/",
      sourceUrl: ritzShard,
    };
    const result = compareMarriottCatalogs(
      [],
      collection([current]),
      baseline([previous]),
      {
        minimumMarriottPropertyCount: 0,
        minimumRitzPropertyCount: 0,
        minimumBvlgariPropertyCount: 0,
      }
    );
    const report = renderMarriottUpdateReport(result);

    expect(result.status).toBe("review_required");
    expect(result.summary.sourceChanges).toBe(1);
    expect(result.sourceChanges).toHaveLength(1);
    expect(report).toContain("## 공식 소스 변경");
    expect(report).toContain("AAA01");
    expect(report).toContain("Marriott HWS XML");
    expect(report).toContain("Ritz-Carlton HWS XML");
    expect(report).toContain(previous.officialUrl);
    expect(report).toContain(current.officialUrl);
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
    expect(records).toHaveLength(10_309);
    expect(records.filter((record) => record.propertyCode)).toHaveLength(
      10_309
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

  it("registers reviewed additions and excludes terminated or held hotels", async () => {
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
    const reviewedNewActiveCodes = [
      "AMDFL",
      "AMDFO",
      "BHJRB",
      "BOMAK",
      "IXKFG",
      "JGAFS",
      "LAXHL",
      "LAXPE",
      "LAXPY",
      "LAXVP",
      "MEMAM",
      "MRYCE",
      "SEAPA",
      "SZXJQ",
      "UVFRH",
    ];
    const reviewedHoldReleaseCodes = [
      "BEGAC",
      "CSXPF",
      "ISTXA",
      "MQTTS",
      "SELSG",
      "SNAAF",
      "SNAAL",
      "WASWF",
      "XMNXW",
    ];
    for (const code of [
      ...reviewedNewActiveCodes,
      ...reviewedHoldReleaseCodes,
    ]) {
      expect(propertiesByCode.has(code), code).toBe(true);
    }
    expect(propertiesByCode.get("ATLHF")?.officialName).toBe(
      "Fairfield by Marriott Inn & Suites Bethlehem GA"
    );
    expect(propertiesByCode.get("CIDWA")?.officialName).toBe(
      "AC Hotel Cedar Rapids Downtown"
    );
    expect(propertiesByCode.get("HOUMD")?.officialName).toBe(
      "Courtyard By Marriott Houston Medical Center Reliant Park"
    );
    expect(propertiesByCode.get("HOURW")?.officialName).toBe(
      "Residence Inn By Marriott Houston Medical Center Reliant Park"
    );
    expect(propertiesByCode.get("MEMAM")?.officialName).toBe(
      "ARRIVE Memphis Downtown, a Member of Design Hotels™"
    );
    expect(propertiesByCode.get("MEXJS")?.officialName).toBe(
      "City Express Junior by Marriott Ciudad de México Zona Reforma"
    );
    expect(propertiesByCode.get("OSAAL")?.officialName).toBe(
      "Aloft by Marriott Osaka Umeda"
    );
    expect(propertiesByCode.get("SAVAK")?.officialName).toBe(
      "Hotel Orielle, Autograph Collection"
    );
    expect(propertiesByCode.get("STLAL")?.officialName).toBe(
      "Aloft by Marriott St Louis Central West End"
    );
    expect(propertiesByCode.get("SZXBR")?.officialName).toBe(
      "Renaissance Shenzhen Luohu Hotel"
    );
    expect(propertiesByCode.get("XNARK")?.officialName).toBe(
      "Hotel Vin, Rogers-Bentonville, Autograph Collection"
    );
    expect(propertiesByCode.get("YYZPX")?.officialName).toBe(
      "City Express by Marriott Port Hope Cobourg"
    );
    expect(propertiesByCode.get("ZHAXP")?.officialName).toBe(
      "Four Points by Sheraton Zhanjiang City Center"
    );
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
    expect(reviewHoldDocument.properties).toHaveLength(88);
    expect(
      reviewHoldDocument.properties.filter(
        (property: { status: string }) => property.status === "not_yet_open"
      )
    ).toHaveLength(4);
    expect(
      reviewHoldDocument.properties.filter(
        (property: { status: string }) =>
          property.status === "reservations_unavailable"
      )
    ).toHaveLength(16);
    expect(
      reviewHoldDocument.properties.filter(
        (property: { status: string }) => property.status === "verification_required"
      )
    ).toHaveLength(68);

    const newHoldCodes = [
      "ANCMT",
      "ATLDS",
      "BAHSW",
      "BHMXT",
      "BNACR",
      "CTUHT",
      "DENFE",
      "DPSCL",
      "DXBZR",
      "FUONJ",
      "GDLPA",
      "GGGRI",
      "GSPEH",
      "KNOCY",
      "LASFN",
      "MGMSS",
      "MLBCW",
      "MOBST",
      "MRYCO",
      "NGBCH",
      "OSAKM",
      "ORHSX",
      "PARMX",
      "POZFP",
      "PQCFI",
      "PQCOX",
      "PVRMI",
      "RDURS",
      "SANDS",
      "SDFEI",
      "SELUI",
      "SFOPS",
      "SJOLP",
      "SRQRS",
      "SYXAC",
      "TRIJT",
      "TSNGP",
      "UKBCY",
      "ZNZBM",
      "ZUHSF",
    ];
    const holdsByCode = new Map(
      reviewHoldDocument.properties.map(
        (property: { propertyCode: string }) => [property.propertyCode, property]
      )
    );
    for (const code of newHoldCodes) {
      expect(holdsByCode.has(code), code).toBe(true);
    }
    expect(holdsByCode.get("CAEFW")).toMatchObject({
      officialName:
        "Fairfield by Marriott Inn & Suites West Columbia Airport",
      status: "reservations_unavailable",
    });
    expect(holdsByCode.get("MYRFI")).toMatchObject({
      officialName:
        "Fairfield by Marriott Inn & Suites Myrtle Beach Oceanfront",
      status: "verification_required",
    });

    for (const property of reviewHoldDocument.properties) {
      expect(propertiesByCode.has(property.propertyCode), property.propertyCode).toBe(
        false
      );
    }

    const sourceExceptionDocument = await loadPropertySourceExceptions(
      path.resolve("data/marriott/property-source-exceptions.json")
    );
    expect(sourceExceptionDocument.properties).toHaveLength(21);
    const sourceExceptionCodes = new Set(
      sourceExceptionDocument.properties.map(
        (property: { propertyCode: string }) => property.propertyCode
      )
    );
    for (const code of ["CHIES", "ISPSH", "OKCOF", "REPMD"]) {
      expect(sourceExceptionCodes.has(code), code).toBe(true);
    }
    for (const property of sourceExceptionDocument.properties) {
      expect(
        propertiesByCode.has(property.propertyCode),
        property.propertyCode
      ).toBe(true);
      expect(property.status).toBe("verified_active_source_gap");
    }
  });

  it("accounts for every September candidate without activating uncertain evidence", async () => {
    const local = await loadLocalMarriottCatalog(path.resolve("."));
    const holds = await loadPropertyReviewHolds(path.resolve("data/marriott/property-review-holds.json"));
    const exceptions = await loadPropertySourceExceptions(path.resolve("data/marriott/property-source-exceptions.json"));
    const activeByCode = new Map(marriottProperties.map((property) => [property.propertyCode, property]));
    const holdsByCode = new Map(holds.properties.map((hold: { propertyCode: string }) => [hold.propertyCode, hold]));
    const candidateCodes = new Set(septemberReview.newCandidates.map((row) => row.propertyCode));
    expect(candidateCodes.size).toBe(26);
    expect(septemberReview.newCandidates.filter((row) => row.decision === "active_patch").map((row) => row.propertyCode)).toEqual(["AMDFL", "BHJRB"]);
    for (const row of septemberReview.newCandidates) {
      if (row.decision === "active_patch") {
        expect(activeByCode.get(row.propertyCode)?.officialName).toBe(row.officialName);
        expect(holdsByCode.has(row.propertyCode)).toBe(false);
      } else {
        expect(activeByCode.has(row.propertyCode), row.propertyCode).toBe(false);
        const latest = octoberReview.records.find((review) => review.propertyCode === row.propertyCode);
        expect(latest, row.propertyCode).toBeDefined();
        const hold = holdsByCode.get(row.propertyCode) as { officialName: string; aliases: string[]; status: string; lastReviewedAt: string };
        expect(hold).toMatchObject({ status: latest?.proposedStatus, lastReviewedAt: "2026-10-03" });
        // A reviewed display-name change must retain the September identity.
        expect([hold.officialName, ...hold.aliases], row.propertyCode).toContain(row.officialName);
      }
    }
    expect(septemberReview.movedToHold).toHaveLength(5);
    for (const row of septemberReview.movedToHold) {
      expect(activeByCode.has(row.propertyCode), row.propertyCode).toBe(false);
      const latest = octoberReview.records.find((review) => review.propertyCode === row.propertyCode);
      expect(latest, row.propertyCode).toBeDefined();
      expect(holdsByCode.get(row.propertyCode)).toMatchObject({ status: latest?.proposedStatus, lastReviewedAt: "2026-10-03" });
      expect(exceptions.properties.some((exception: { propertyCode: string }) => exception.propertyCode === row.propertyCode)).toBe(false);
    }
    // A frozen, synthetic collection keeps the review regression offline.
    const current = collection(septemberReview.newCandidates.map((row) =>
      officialProperty(row.propertyCode, "reviewed-hotel")
    ));
    const result = compareMarriottCatalogs(local.filter((row) => candidateCodes.has(row.propertyCode)), current, baseline([]), {
      minimumMarriottPropertyCount: 0, minimumRitzPropertyCount: 0,
      minimumBvlgariPropertyCount: 0, propertyReviewHolds: holds.properties,
    });
    expect(result.blockers).toEqual([]);
    expect(result.registrationCandidates).toEqual([]);
    expect(result.summary.heldOfficialProperties).toBe(24);
  });

  it("preserves stable IDs and old aliases for every September display-name change", () => {
    expect(septemberReview.renames).toHaveLength(13);
    for (const row of septemberReview.renames) {
      const property = marriottProperties.find((item) => item.propertyCode === row.propertyCode);
      expect(property, row.propertyCode).toMatchObject({ id: row.stableId, officialName: row.officialName });
      expect(property?.aliases.some((alias) => normalizedHotelName(alias.value) === normalizedHotelName(row.previousName)), row.propertyCode).toBe(true);
    }
  });

  it("does not silently delete or approve the September source-only disappearances", async () => {
    const local = await loadLocalMarriottCatalog(path.resolve("."));
    const exceptions = await loadPropertySourceExceptions(path.resolve("data/marriott/property-source-exceptions.json"));
    expect(septemberReview.unreviewedSourceGaps).toHaveLength(16);
    for (const row of septemberReview.unreviewedSourceGaps) {
      expect(local.some((property) => property.propertyCode === row.propertyCode), row.propertyCode).toBe(true);
      expect(exceptions.properties.some((exception: { propertyCode: string }) => exception.propertyCode === row.propertyCode), row.propertyCode).toBe(false);
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
