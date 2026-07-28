# Marriott 호텔 DB 유지관리 / Marriott Hotel DB Maintenance

[한국어](#한국어) | [English](#english)

## 한국어

이 저장소에는 공식 호텔 코드 소스를 주기적으로 확인하는 읽기 전용 모니터가
있습니다. 모니터는 호텔 DB, alias, 기준 snapshot을 자동 수정하거나 merge하지
않습니다. 변경 후보를 Markdown·JSON 보고서와 현재 snapshot으로 만들어 사람이
검토할 수 있게 합니다.

### 공식 소스

- Marriott `sitemap-index.xml`에서 발견한 영어권 HWS property XML shard
- Ritz-Carlton `sitemap-index.xml`에서 발견한 별도 HWS property XML shard
- Bvlgari Hotels 공식 sitemap의 도시 루트와 각 페이지의 예약용 `hotelCode`

Marriott와 Ritz-Carlton은 언어별 XML이 같은 호텔을 반복하므로 canonical 영어
shard 하나만 사용합니다. Bvlgari sitemap의 `/en_US/{slug}` 루트에는 운영 호텔뿐
아니라 향후 개장, 예약, 식음료, 안내 페이지도 섞여 있습니다. 따라서 URL이 있다는
이유만으로 호텔을 등록하지 않고 페이지에 공식 `hotelCode`가 있는 경우만 운영
호텔 후보로 봅니다. 코드가 없는 페이지는 참고 목록으로만 보고합니다.

공식 XML에는 이미 제휴가 끝난 호텔의 HWS 경로가 한동안 남을 수 있습니다.
따라서 URL과 상세 경로 존재 여부만으로 현재 제휴를 단정하지 않습니다. Marriott가
제휴 종료를 공식 공지한 브랜드·운영사는 별도 종료 목록으로 관리하며 신규 등록
후보에서 제외합니다. 2026년 7월 현재 Sonder 전체가 이 목록에 포함되며, 근거는
[Marriott의 Sonder 고객 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/sonderfaqs.mi)입니다.

### ID와 property code

`MarriottProperty.id`는 alias와 앱 상태가 연결되는 **내부 안정 ID**입니다.
`MarriottProperty.propertyCode`는 Marriott 예약 시스템의 **공식 호텔 코드**입니다.

예를 들어 Bvlgari Hotel Tokyo는 다음처럼 두 값을 함께 가집니다.

```ts
{
  id: "jp-tyobt",
  propertyCode: "TYOBT",
  officialName: "Bvlgari Hotel Tokyo",
}
```

호텔 이름이 바뀌어도 내부 ID와 과거 명세서 alias는 유지하고, 공식 소스 비교는
`propertyCode`로 수행합니다. 현재 10,287개 운영 확인 로컬 seed에는 모두 고유 코드가
연결되어 있습니다. 과거 이름 기반 seed의 일회성 연결 정보는
`data/marriott/property-code-overrides.json`에 있습니다.

아직 실제 운영을 시작하지 않았거나 공식 페이지에서 예약이 아직 제공되지 않는 호텔은
활성 seed에 넣지 않고
`data/marriott/property-review-holds.json`에서 별도로 관리합니다. 보류 호텔은
공식 코드 묶음에 나타나더라도 자동 등록 후보에서 제외되며, 카드 명세서 이름과
일치하면 누락 의심으로 자동 확정하지 않고 확인 필요로 분류합니다. 실제 운영과
공개 예약 상태를 사람이 확인한 뒤에만 보류 목록에서 제거하고 활성 seed로
승격합니다.

공식 페이지 등으로 현재 Marriott 운영을 사람이 확인했지만 모니터가 수집하는
공식 코드 묶음에 포함되지 않는 호텔은
`data/marriott/property-source-exceptions.json`에 근거 URL과 최종 검토일을
기록합니다. 이 항목은 해결되지 않은 로컬 전용 차이에서 제외하되 보고서에는 계속
표시합니다. 나중에 공식 코드 묶음에 다시 나타나면 예외 제거 검토 항목이 됩니다.

같은 호텔의 예약 코드가 바뀐 경우에는 호텔을 두 번 등록하지 않습니다. 내부 ID는
유지하고 현재 코드를 `propertyCode`, 과거 코드를 `formerPropertyCodes`, 과거
호텔명을 수동 alias로 보존합니다. 따라서 과거 카드 명세서도 계속 탐지하면서 토큰
후보에는 같은 실제 호텔이 한 번만 들어갑니다.

### 로컬 실행

```bash
npm run hotels:check
```

보고서는 기본적으로 `.marriott-reports/latest/`에 생성됩니다.

- `report.md`: 사람이 읽는 검토 보고서
- `report.json`: 전체 구조화 결과
- `official-snapshot.current.json`: 이번 실행에서 확인한 현재 공식 목록

snapshot에는 각 공식 XML shard의 응답 `Last-Modified`도 함께 기록해, 소스가
실제로 갱신되고 있는지 실행별로 확인할 수 있습니다.

기준 파일은 `data/marriott/official-property-snapshot.json`입니다. 공식 변경을
검토하고 승인한 경우에만 다음 명령으로 명시적으로 갱신합니다.

```bash
npm run hotels:check -- --write-baseline
```

`--write-baseline`은 공식 소스 무결성 검사가 통과할 때만 동작합니다. 새 호텔을
로컬 규칙에 추가하거나 기존 호텔을 삭제하지는 않습니다.

### 안전 조건과 보고 항목

- 공식 property code로 중복 제거하고 같은 코드의 교차 소스 충돌은 차단
- Marriott/Ritz shard 수와 호텔 수가 최소 기준보다 작으면 차단
- Bvlgari 운영 코드 수가 최소 기준보다 작거나 소스 요청이 실패하면 차단
- 기준 snapshot 대비 공식 목록이 2% 넘게 급감하면 파서·소스 장애로 간주
- `AQA*`, `TEST`, `EMPOWER` 등 명백한 QA 항목은 신규 후보에서 격리
- 공식 신규 코드, 사라진 코드, URL slug 변경, 소스 이동을 분리해 보고
- 공식 목록에는 있지만 로컬 DB에 없는 코드와 그 반대 방향을 별도 보고
- 등록 보류 호텔을 활성 seed·신규 등록 후보와 분리해 별도 보고
- 사람이 운영을 확인한 공식 소스 누락 예외와 아직 검토하지 않은 로컬 전용 항목을 분리

XML URL slug는 변경 감지용 단서이지 공식 호텔명 자체가 아닙니다. 신규·slug 변경
후보는 보고서의 destination 링크에서 호텔명, 브랜드, 지역, 예약 가능 상태를
사람이 확인합니다. destination 페이지를 전체 호텔의 1차 원장으로 사용하지 않는
이유는 렌더링·A/B 테스트·지역 차단으로 대량 비교가 불안정하기 때문입니다.
같은 property code와 slug를 그대로 둔 채 표시명만 바뀌는 경우는 자동 감지를
보장하지 않으므로, 실제 가맹점 alias 제보와 후보 destination 검토를 병행합니다.

공식 XML에서 한 번 사라졌다는 이유만으로 로컬 호텔을 삭제하지 않습니다. 일시
누락, 리브랜딩, 별도 브랜드 소스 여부를 후속 주간 보고서와 destination 페이지로
재확인합니다. 운영을 확인한 소스 누락은 근거와 검토일을 예외 파일에 남깁니다.
현재 모니터는 횟수를 자동으로 승인 판단에 사용하지 않으며, 최종 추가·수정·삭제는
항상 별도 브랜치에서 사람이 결정합니다.

`rules/marriottPropertyOverrides.ts`의 카드 명세서 alias는 공식 호텔 목록과 다른
자산입니다. 공식 source만으로 운영 법인명이나 결제대행 표기를 알 수 없으므로,
실제 명세서와 사용자 제보를 사람이 검증한 뒤에만 추가합니다.

### 자동 실행

`.github/workflows/marriott-db-check.yml`은 매주 월요일과 수동 실행 시 검사를
수행합니다. Markdown은 Actions 요약에 표시되고 JSON·현재 snapshot은 30일 동안
artifact로 보관됩니다. 공식 신규·사라짐·slug·소스 변경이 있으면 검토 알림을
남기기 위해 workflow가 실패 상태가 되며, 소스 무결성이 깨진 `blocked`도
실패합니다. 어느 경우에도 저장소와 배포는 변하지 않습니다. 로컬 DB와 공식
목록의 기존 차이만으로 매주 실패하지는 않습니다.

공개 저장소에서는 Actions 요약과 artifact도 저장소 방문자가 볼 수 있습니다.
여기에는 공개 호텔 코드·URL과 사람이 작성한 검토 사유만 들어가며, 사용자가
업로드한 엑셀·거래·카드·세션 정보나 Google Sheets 제보 데이터는 읽거나 포함하지
않습니다.

## English

The repository includes a read-only monitor for three official property-code
sources: Marriott HWS XML, the separate Ritz-Carlton HWS XML bundle, and the
Bvlgari Hotels sitemap plus each active destination page's reservation
`hotelCode`. It never edits or merges the property database, curated aliases,
or approved baseline automatically.

`MarriottProperty.id` is the app's stable identity, while
`MarriottProperty.propertyCode` is the official reservation-system code. For
example, Bvlgari Hotel Tokyo keeps `jp-tyobt` as its stable app ID and `TYOBT`
as its official code. All 10,287 verified-operating local seeds now resolve to
a unique code.

Properties that have not started operating, or whose official pages do not yet
offer reservations, are kept outside the active seed in
`data/marriott/property-review-holds.json`. They are excluded from automatic
registration candidates and from suspected-missing accrual; matching statement
names remain review-only until an operator verifies operation and public
bookability.

Manually verified active properties that are absent from the collected official
code union are recorded in
`data/marriott/property-source-exceptions.json` with evidence and a review date.
They remain visible in reports without repeatedly appearing as unresolved
local-only records. If a code returns to the official union, the monitor flags
the exception for removal review.

When Marriott changes the reservation code for the same physical property, the
hotel is not duplicated. Its stable app ID is retained, the active code is kept
in `propertyCode`, old codes in `formerPropertyCodes`, and former hotel names as
curated aliases. Historical statements remain detectable without adding the
same physical hotel twice to token candidates.

Run the monitor with:

```bash
npm run hotels:check
```

It writes `report.md`, `report.json`, and
`official-snapshot.current.json` under `.marriott-reports/latest/`. After a
human reviews and approves official-source changes, the committed baseline can
be refreshed explicitly:

```bash
npm run hotels:check -- --write-baseline
```

The command refuses to update the baseline when source-integrity checks fail.
It still never changes the local property rules.

The monitor reports upstream additions, disappearances, URL-slug changes,
source moves, official codes missing from the local DB, and local codes absent
from the current official union. Obvious QA records are quarantined. Source
failures, code conflicts, unexpectedly small source bundles, or an official
drop above 2% block conclusions. Manually verified source gaps remain distinct
from unreviewed local-only records.

An XML slug is a change signal, not an authoritative display name. Reviewers
use the linked destination page to validate the property name, brand, region,
and bookable state. A single disappearance never deletes a local row. Curated
card-statement aliases remain a separate human-reviewed asset because official
hotel directories cannot reveal unrelated legal-entity or payment-processor
names. Source `Last-Modified` headers are retained for audit. A display-name
change that keeps the same property code and slug is not guaranteed to be
detected automatically.

The weekly GitHub Actions workflow publishes the Markdown summary and retains
the full report and current snapshot as artifacts for 30 days. New upstream
codes, disappearances, slug/source changes, and blocked integrity checks fail
the workflow as a review signal without changing source files or deployment
state. Pre-existing local coverage gaps alone do not fail every weekly run.
In a public repository, the workflow summary and artifacts are also public.
They contain public hotel-code evidence only; the workflow never reads or
publishes uploaded statements, transactions, card/session data, or Google Sheets
feedback.

An HWS route may remain in Marriott XML after an affiliation has ended, so a
route or detailed route profile is not treated as proof of current affiliation
on its own. Brands or operators covered by an official termination notice are
reported separately and excluded from registration candidates. As of July
2026, this includes all Sonder properties under Marriott's
[Sonder customer notice](https://www.marriott.com/en-us/marriott-brands/portfolio/sonderfaqs.mi).
