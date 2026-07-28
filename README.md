# Bonvoy L4/L5 Checker

[한국어](#한국어) | [English](#english)

- Live: <https://shinhan-bonvoy-points-checker.vercel.app>
- Repository: <https://github.com/wonsik99/shinhan-bonvoy-points-checker>

## 한국어

신한카드의 **포인트 적립 상세내역 Excel 파일**을 브라우저에서 분석해, Marriott 호텔 결제가 특별 적립(국내 **L4** / 해외 **L5**)으로 처리되었는지 확인하는 도구입니다.

- 기준 카드: **메리어트 본보이™ 더 베스트 신한카드**
- 파일 처리: 사용자 브라우저 안에서만 수행하며 서버에 업로드하지 않음
- 판정 방식: 결정적 규칙 기반이며 사용자 앱 경로에 LLM 호출 없음
- 배포 방식: Next.js 기반 정적 페이지이며 서버 함수 없음

> 결과는 카드사 문의를 돕기 위한 참고 자료입니다. 앱은 `누락 의심`과 `확인 필요`만 안내하며 실제 적립 여부를 확정하거나 보장하지 않습니다.

### 주요 기능

- 신한카드 포인트 적립 상세내역 `.xlsx` / `.xls` 분석
- 국내 Marriott L4 · 해외 Marriott L5 특별 적립 확인
- 실제 적립 포인트와 예상 포인트의 차이 계산
- 해외 거래에서 채널명보다 `해외가맹점명`을 우선 사용
- Marriott 브랜드, 공식 호텔명, 현지명, 검증된 alias 및 운영사 규칙 대조
- 전 세계 149개 국가·지역, 10,287개 운영 확인 Marriott 호텔 seed 기반 탐색
- 공식명·현지명 토큰을 이용한 보수적인 미등록 호텔 후보 탐색
- Marriott·Ritz-Carlton·Bvlgari 공식 property code 소스와 로컬 seed의 주간 변경 확인 보고서
- `포함` / `제외` / `모르겠음`으로 확인 필요 거래 직접 검토
- 앱이 놓친 거래를 사용자가 Marriott로 표시하는 false-negative 보정
- 카드사 문의 문구 생성·복사 및 전화/1:1문의/공유 채널 연결
- 사용자가 명시적으로 동의할 때만 보내는 선택적 익명 피드백과 파싱 실패 제보

### 사용자 흐름

1. 신한카드 고객센터(1544-7000)에 포인트 적립 상세내역 Excel 파일을 요청합니다.
2. 발급받은 파일을 앱에 업로드합니다.
3. 앱이 브라우저 안에서 거래를 파싱하고 분석합니다.
4. `정상 적립`, `누락 의심`, `확인 필요` 결과를 검토합니다.
5. 필요한 거래를 포함하거나 제외합니다.
6. 생성된 문의 문구를 복사해 신한카드에 접수합니다.
7. 원하는 경우에만 최종 판단 정보를 서비스 개선용으로 전송합니다.

현재 해당 Excel 파일은 신한카드 앱이나 홈페이지가 아니라 고객센터 전화로 요청해야 합니다.

### 지원 파일 형식

- 헤더 2행 + 거래 1건당 2행인 실제 신한카드 인터리브 형식
- 제목 행이 헤더 앞에 추가된 변형
- 일반적인 1행 1거래 형식
- Excel serial 날짜와 신한카드 컬럼 별칭
- 해외 거래의 `가맹점명`이 `VISA해외사용일시불` 같은 채널명인 경우 `해외가맹점명` 우선

지원하지 않는 레이아웃은 진단 정보와 함께 오류를 표시합니다. 진단 내용은 복사하거나 사용자가 선택적으로 제보할 수 있습니다.

### 판정 기준

#### 적립 등급

`포인트종류상세` 컬럼의 등급 코드를 사용합니다.

| 코드 | 의미 | 적립 기준 |
|---|---|---:|
| L1 | 기본 적립 | 1,000원당 1P |
| L2 | 해외 매출 적립 | 1,000원당 3P |
| L3 | 특별 적립 업종 | 1,000원당 3P |
| L4 | 국내 Marriott 결제 | 1,000원당 5P |
| L5 | 해외 Marriott 결제 | 1,000원당 5P |

현재 지원 프로필은 **메리어트 본보이™ 더 베스트 신한카드**입니다. Marriott 적립 기준이 다른 더 클래식 카드는 아직 지원하지 않습니다.

#### 분석 순서

1. 취소 거래는 계산에서 제외합니다.
2. 명세서에 이미 L4 또는 L5가 기록된 거래는 가맹점 DB 등록 여부와 관계없이 `정상 적립`으로 처리합니다.
3. 그 외 거래는 검증된 공유 가맹점·호텔 alias, 공식명·현지명, Marriott 브랜드, 호텔명 토큰, 국내 운영사 및 호텔 관련 보조 규칙 순서로 판정합니다.
4. 확신도가 충분한 국내 Marriott의 `L1 → L4`, 해외 Marriott의 `L2 → L5` 패턴에서 예상 포인트 차이가 양수일 때만 `누락 의심`으로 표시합니다.
5. 호텔 후보는 있지만 자동 확정하기 어려운 거래는 `확인 필요`로 남기며 사용자가 포함하기 전에는 문의 합계에 넣지 않습니다.

토큰 매칭은 공식 호텔명과 현지명만 후보 인덱스에 사용합니다. 최소 2개 토큰이 같은 호텔을 가리켜야 하며, 일반적인 토큰 충돌이나 설명되지 않는 추가 문자열이 있으면 자동 확정하지 않습니다. 공백 없이 붙은 특수 가맹점명이나 과거 상호는 검증된 명시 alias로 처리합니다.

### 개인정보와 데이터 흐름

#### 업로드 파일

업로드한 파일은 `File.arrayBuffer()`와 SheetJS로 브라우저 안에서만 읽습니다.

- Excel 원문을 서버로 업로드하지 않음
- 결제금액·거래일자·카드번호·포인트 상세를 서버로 보내지 않음
- 파싱·정규화·호텔 분류·포인트 계산을 클라이언트에서 수행
- 파일을 변경하거나 초기화하면 이전 분석 상태를 폐기
- CSP로 허용된 연결 대상만 사용할 수 있도록 제한

이 앱은 정적 클라이언트 방식이므로 호텔 seed와 공개 alias 규칙은 JavaScript 번들에 포함됩니다. 비밀로 유지해야 하는 데이터나 자격 증명을 클라이언트 규칙에 넣으면 안 됩니다.

#### 선택적 피드백 수집

`NEXT_PUBLIC_APPS_SCRIPT_URL`이 설정된 경우 DB에 등록되지 않은 L4/L5 가맹점명은 브라우저의 제보 목록에 자동으로 추가됩니다. 목록을 생성하거나 수정하는 것만으로는 전송되지 않으며, 사용자가 마지막 단계에서 `서비스 개선 정보 보내기`를 눌렀을 때만 최종 목록을 한 번 전송합니다.

전송할 수 있는 값:

- 원본 가맹점명과 정규화된 호텔명
- 사용자의 최종 판단
- 앱의 판정 상태와 확신도
- 포인트 등급 코드와 예상 차이
- 탭 단위 익명 세션 ID

파일 원문, 결제금액, 거래일자, 카드번호, 포인트 금액, 원본 행은 보내지 않습니다. 파싱 실패 제보도 사용자가 버튼을 눌렀을 때 진단 텍스트만 전송합니다.

### Google Sheets 피드백 수집기 설정

1. Google Sheet에서 Apps Script를 엽니다.
2. [`google-apps-script/Code.gs`](google-apps-script/Code.gs)를 붙여 넣습니다.
3. 웹 앱으로 배포합니다. 실행 사용자는 본인, 액세스 권한은 모든 사용자로 설정합니다.
4. Vercel에 다음 환경 변수를 등록합니다.

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/배포ID/exec
```

5. 앱을 재배포하고 Preview에서 전송과 CSP를 확인합니다.

환경 변수가 없으면 일반 피드백 전송은 no-op으로 동작하고 파싱 실패 제보는 복사 fallback을 제공합니다. `NEXT_PUBLIC_` 값은 번들에서 볼 수 있으므로 수집기 URL은 비밀값이 아닙니다. Apps Script의 요청 검증, 크기 제한, 중복 억제, 일일 한도와 모니터링을 함께 유지해야 합니다.

사용자 제보는 자동으로 판정 규칙이 되지 않습니다. 집계한 뒤 운영자가 검토하고 승인한 최종 규칙만 코드에 반영합니다.

### 로컬 개발

요구 사항: Node.js 20 이상

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest 단위·회귀 테스트
npm run test:coverage
npm run test:e2e     # Playwright 브라우저 흐름
npm run lint
npm run build        # 정적 프로덕션 빌드
npm run fixture      # docs/_local/sample.xlsx 생성 (gitignore)
npm run hotels:check # Marriott 공식 호텔 DB 변경 확인(읽기 전용)
```

호텔 DB 모니터의 실행 방법과 안전 정책은
[`docs/hotel-db-maintenance.md`](docs/hotel-db-maintenance.md)를 참고하세요.

### 프로젝트 구조

```text
app/                            Next.js App Router와 페이지 상태
components/                     업로드, 진행 단계, 결과 표, 문의 UI
lib/                            파싱, 정규화, 분류, 분석, 피드백
lib/marriottPropertyTokenIndex  공식명·현지명 토큰 후보 인덱스
rules/                          카드 프로필, Marriott 브랜드·호텔·alias 규칙
data/marriott/                  공식 code 메타데이터, 등록 보류·소스 누락 예외, 승인 snapshot
scripts/marriott/               공식 XML/code 수집·비교·보고서 모니터
google-apps-script/             선택적 Google Sheets 피드백 수집기
e2e/                            Playwright 브라우저 테스트
next.config.ts                  CSP 등 보안 헤더
```

`docs/_local/`은 실제 검증 파일과 비공개 작업 문서를 위한 로컬 전용 경로이며 Git에 커밋하지 않습니다.

### 배포

Vercel에 서버 함수 없는 정적 렌더링 페이지로 배포합니다. 연결된 GitHub 저장소의 PR은 Preview 배포를 만들고, 현재 프로젝트 설정에서는 `main` 반영 시 Production 배포가 진행됩니다. CLI로 직접 배포할 때는 `vercel --prod`를 사용합니다.

배포 전 다음 검증을 권장합니다.

```bash
npm run test:coverage
npm run lint
npm run build
npm run test:e2e
```

수집기 URL을 변경했다면 Preview에서 제보 버튼, 네트워크 payload와 CSP를 함께 확인해야 합니다.

### 로드맵

- 더 클래식 카드 프로필과 카드 선택 UI
- 사용자 피드백 집계·후보화·수동 검토용 운영 도구
- Marriott 공식 호텔 seed 주간 변경 모니터와 수동 검토 절차 (완료)
- 수동 검증 alias가 충분히 쌓였을 때만 선택적 비공개 alias 조회 API 검토

사용자 앱의 판정·계산 경로에는 LLM을 넣지 않습니다.

### 면책

- Marriott, Marriott Bonvoy 또는 신한카드의 공식 서비스가 아닙니다.
- 결과는 카드사 문의를 준비하기 위한 참고 자료입니다.
- 실제 적립은 업종코드, 매입 경로, 카드 약관과 처리 시점에 따라 달라질 수 있습니다.

---

## English

Bonvoy L4/L5 Checker analyzes a Shinhan Card **points accrual statement in Excel format** entirely in the browser and helps users review whether Marriott hotel transactions received the expected special accrual grade: domestic **L4** or overseas **L5**.

- Supported card profile: **Marriott Bonvoy™ The Best Shinhan Card**
- File processing: performed only in the user's browser, with no file upload
- Classification: deterministic rules only, with no LLM calls in the user-facing path
- Deployment: statically rendered Next.js pages with no server functions

> The results are reference material for preparing a card issuer inquiry. The app reports only `suspected missing accrual` and `needs review`; it does not confirm or guarantee the final accrual decision.

### Features

- Parses Shinhan Card points statements in `.xlsx` and `.xls` formats
- Reviews domestic Marriott L4 and overseas Marriott L5 accrual
- Calculates the difference between credited and expected points
- Prefers the overseas merchant field over a generic payment-channel name
- Matches Marriott brands, official names, local names, verified aliases, and operator rules
- Searches 10,287 verified-operating Marriott property seeds across 149 countries and regions
- Finds conservative unregistered-property candidates using official/local name tokens
- Produces a weekly read-only change report against Marriott, Ritz-Carlton, and Bvlgari official property-code sources
- Lets users mark review items as include, exclude, or unsure
- Lets users manually mark a missed transaction as Marriott for the current session
- Generates and copies a card issuer inquiry message and links to phone, online inquiry, and OS sharing options
- Sends optional anonymous feedback or parse diagnostics only after explicit user action

### User flow

1. Request a points accrual statement from Shinhan Card customer service at 1544-7000.
2. Upload the issued Excel file to the app.
3. The app parses and analyzes the transactions locally in the browser.
4. Review normally accrued, suspected missing, and needs-review items.
5. Include or exclude transactions where necessary.
6. Copy the generated message and submit an inquiry to Shinhan Card.
7. Optionally send the final judgments as service-improvement feedback.

The statement currently has to be requested by phone; it is not available from the Shinhan Card app or website.

### Supported statement layouts

- The verified Shinhan layout with two header rows and two interleaved rows per transaction
- Variants with a title row before the header
- Conventional one-row-per-transaction layouts
- Excel serial dates and known Shinhan column aliases
- Overseas rows where `가맹점명` contains a channel label such as `VISA해외사용일시불` and `해외가맹점명` contains the actual merchant

Unsupported layouts produce a structured diagnostic that the user can copy or optionally report.

### Classification rules

#### Point grades

The app reads the grade from the `포인트종류상세` column.

| Code | Meaning | Accrual rate |
|---|---|---:|
| L1 | Base accrual | 1 point per KRW 1,000 |
| L2 | Overseas transaction accrual | 3 points per KRW 1,000 |
| L3 | Special merchant-category accrual | 3 points per KRW 1,000 |
| L4 | Domestic Marriott transaction | 5 points per KRW 1,000 |
| L5 | Overseas Marriott transaction | 5 points per KRW 1,000 |

The only supported profile is **Marriott Bonvoy™ The Best Shinhan Card**. The Classic card uses a different Marriott rate and is not yet supported.

#### Analysis order

1. Canceled transactions are excluded from calculations.
2. Transactions already labeled L4 or L5 are treated as normally accrued regardless of whether the merchant exists in the local alias database.
3. Other transactions are evaluated against verified shared merchants and property aliases, official/local names, Marriott brands, property-name token evidence, Korean operator rules, and hotel-like fallback rules.
4. A transaction becomes `suspected missing accrual` only when a confident domestic Marriott match follows the `L1 → L4` pattern or a confident overseas match follows `L2 → L5`, and the expected difference is positive.
5. Ambiguous candidates remain `needs review` and are not included in the inquiry total until the user explicitly includes them.

Token matching indexes official and local property names only. At least two tokens must point to the same property, and generic token collisions or unexplained text prevent automatic confirmation. Concatenated statement names and former merchant names are handled through verified explicit aliases.

### Privacy and data flow

#### Uploaded files

The app reads files with `File.arrayBuffer()` and SheetJS entirely in the browser.

- The Excel source file is never uploaded to a server
- Transaction amounts, dates, card numbers, and point details are not sent to a server
- Parsing, normalization, property classification, and point calculations run on the client
- Selecting another file or resetting the app discards the previous analysis state
- CSP restricts connections to explicitly permitted destinations

Because this is a static client-side application, the hotel seed and public alias rules are included in the JavaScript bundle. Secrets and private credentials must never be stored in client rules.

#### Optional feedback collection

When `NEXT_PUBLIC_APPS_SCRIPT_URL` is configured, unmapped L4/L5 merchant names are added to a local feedback queue. Creating or editing that queue does not transmit anything. The final queue is sent once only when the user clicks the service-improvement submission button in the final step.

Possible submitted fields:

- Raw merchant name and normalized property name
- The user's final judgment
- Detected status and confidence
- Point grade and expected difference
- A tab-scoped anonymous session ID

The file, transaction amount, date, card number, credited points, and original rows are not submitted. Parse-failure diagnostics are also sent only after the user clicks the dedicated button.

### Google Sheets feedback collector

1. Open Apps Script from a Google Sheet.
2. Copy [`google-apps-script/Code.gs`](google-apps-script/Code.gs) into the project.
3. Deploy it as a web app, executing as yourself and allowing access for all users.
4. Add the following environment variable to Vercel.

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

5. Redeploy and verify submission behavior and CSP in Preview.

Without the environment variable, judgment submission is a no-op and parse-failure reporting falls back to copying the diagnostic. A `NEXT_PUBLIC_` value is visible in the client bundle, so the collector URL is not a secret. Keep request validation, size limits, duplicate suppression, daily quotas, and monitoring enabled in Apps Script.

User feedback never becomes a production rule automatically. It must be aggregated, reviewed by an operator, and explicitly approved before a final rule is added to the codebase.

### Local development

Requirement: Node.js 20 or later

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest unit and regression tests
npm run test:coverage
npm run test:e2e     # Playwright browser flow
npm run lint
npm run build        # Static production build
npm run fixture      # Creates docs/_local/sample.xlsx (gitignored)
npm run hotels:check # Read-only official Marriott property DB check
```

See [`docs/hotel-db-maintenance.md`](docs/hotel-db-maintenance.md) for the
monitor workflow and safety policy.

### Project structure

```text
app/                            Next.js App Router and page state
components/                     Upload, progress, result tables, inquiry UI
lib/                            Parsing, normalization, classification, analysis, feedback
lib/marriottPropertyTokenIndex  Official/local property-name token candidates
rules/                          Card profile and Marriott brand/property/alias rules
data/marriott/                  Official-code mappings, registration holds, source-gap exceptions, approved snapshot
scripts/marriott/               Official XML/code collector, diff, and report monitor
google-apps-script/             Optional Google Sheets feedback collector
e2e/                            Playwright browser tests
next.config.ts                  CSP and other security headers
```

`docs/_local/` is reserved for private local fixtures and working documents and must never be committed.

### Deployment

The app is deployed to Vercel as statically rendered pages with no server functions. Pull requests in the connected GitHub repository create Preview deployments, and the current project configuration deploys updates to Production when they reach `main`. Use `vercel --prod` for a direct CLI deployment.

Recommended pre-deployment verification:

```bash
npm run test:coverage
npm run lint
npm run build
npm run test:e2e
```

If the collector URL changes, verify the feedback button, network payload, and CSP in Preview.

### Roadmap

- The Classic card profile and a card-selection UI
- An operator tool for aggregating, reviewing, and approving feedback candidates
- Weekly Marriott official-property monitoring with manual review
- An optional private-alias lookup API only if enough high-value verified aliases accumulate

No LLM will be added to the user-facing classification or calculation path.

### Disclaimer

- This is not an official Marriott, Marriott Bonvoy, or Shinhan Card service.
- Results are reference material for preparing a card issuer inquiry.
- Actual accrual may vary based on merchant category, acquiring route, card terms, and processing time.
