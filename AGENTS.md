<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bonvoy L5 Checker — Agent Handoff

신한 메리어트 본보이 카드 사용자가 포인트 적립 상세내역 엑셀을 올리면, 메리어트 계열 호텔 결제가 정상 특별적립(국내 L4 / 해외 L5)됐는지 검사해주는 웹 도구.

- **Live**: https://shinhan-bonvoy-l5-checker.vercel.app (Vercel, 완전 정적 — 서버 함수 없음)
- **Repo**: github.com/wonsik99/shinhan-bonvoy-points-checker
- 로컬에서 작업 이력·비공개 컨텍스트가 필요하면 `docs/_local/HANDOFF.md`를 읽을 것 (gitignore된 로컬 전용 문서).

## 절대 규칙 (사용자 지시)

1. **LLM 호출 금지.** 판정·계산은 전부 결정적 규칙 기반. (LLM은 먼 미래에 설명 보조로만 검토)
2. **업로드 파일은 절대 서버로 보내지 않는다.** 파싱은 100% 브라우저에서. CSP `connect-src`가 이를 강제하며, 이 보안 스토리를 깨는 변경 금지.
3. **`docs/_local/`은 절대 커밋 금지** (gitignore됨 — 스펙 원본, 테스트 파일, 비공개 문서 위치).
4. **커밋·push 전에 반드시 사용자에게 한국어로 허락을 받을 것.**
5. **커밋 메시지에 AI co-author 트레일러를 넣지 말 것** (사용자가 명시적으로 금지함).
6. **단정 표현 금지**: "누락 의심"·"확인 필요"만 사용, "누락 확정"·"보장" 금지. 이 앱은 카드사 문의를 돕는 참고 자료다.
7. 사용자와는 한국어로 소통한다.

## 도메인 지식 (사용자=카드 소유자가 확인해준 사실)

**적립 등급 코드** (`포인트종류상세` 컬럼, 1,000원당 메리어트 본보이 포인트, `round(금액/1000×N)`):

| 코드 | 의미 | 적립 |
|---|---|---|
| L1 | 기본 적립 | 1P |
| L2 | 해외 매출 적립 | 3P |
| L3 | 특별 적립 업종 (항공/택시/카페 등) | 3P |
| L4 | **국내 메리어트** 결제 | 5P |
| L5 | **해외 메리어트** 결제 | 5P |

- 기준 카드는 **메리어트 본보이™ 더 베스트 신한카드** (`rules/cardProfiles.ts`의 `activeCardProfile`).
- **더 클래식** 카드는 메리어트 적립이 4P/1,000원으로 다름 — 아직 미지원. 클래식 명세서의 등급 코드가 확인되면 프로필 추가 + 카드 선택 UI로 확장할 것.

**실제 신한 엑셀 레이아웃** (실물 파일로 검증됨):
- 헤더 2행 + **거래 1건당 2행** 인터리브 구조. `lib/parseShinhanExcel.ts`의 `extractRecords`가 처리 (플랫 구조, 제목행 있는 변형도 지원).
- 해외 결제는 `가맹점명`이 "VISA해외사용일시불"(채널명)이고 **실제 호텔명은 `해외가맹점명`**에 있음 → 해외가맹점명 우선.
- 실제 포인트 컬럼은 `포인트적립금액`, 날짜는 Excel serial 숫자.
- 이 엑셀은 앱/홈페이지에서 못 받고 **고객센터(1544-7000) 전화로만** 발급됨.

## 아키텍처

```
app/page.tsx            상태 보유 (baseResults + feedbackById), 파생값 useMemo
lib/parseShinhanExcel   File → SheetJS → extractRecords(인터리브/플랫 감지) → 진단(ShinhanParseError)
lib/normalizeTransaction 컬럼 별칭 매핑, 금액/날짜/등급/취소 정규화, 카드번호 마스킹
lib/classifyMerchant    한글 브랜드 → 호텔 alias DB(인덱스) → 영문 브랜드 → 국내 known/운영사 → 호텔 유사 키워드
lib/analyzeTransactions 상태 판정(ok_l5/missing_suspected/needs_review/not_marriott/canceled), 피드백 적용, 요약
lib/inquiryMessage      카드사 문의 문구 생성
lib/feedback            (선택) 익명 피드백 + 파싱 실패 원클릭 제보 — 기본은 Google Sheets(Apps Script), env 없으면 no-op
rules/marriott*.ts      브랜드 키워드·호텔 alias DB(143개 국가·지역 10,148개 seed)·후보/운영사 룰 / rules/cardProfiles.ts 카드 프로필
components/             GuidedProgress(3단계 레일·모바일 진행바), FileUpload(제보 UI 포함), SummaryCards, 3개 테이블, InquiryMessage, InquirySend(전화/1:1문의/OS공유 채널 연결 — 네트워크 전송 없음), Disclaimer
app/globals.css         디자인 색 토큰(@theme: ember/ink/muted/hairline 등) — 색은 반드시 토큰 클래스(text-ember 등)로 사용, hex 하드코딩 금지(OG 이미지 제외)
google-apps-script/Code.gs  구글 시트 수집기(doPost) + 배포 안내
next.config.ts          CSP 헤더 (connect-src 'self' + Apps Script 수집기 도메인 자동 추가)
```

분석 규칙 요점: 취소→canceled / 비메리어트→not_marriott / 정상등급(국내 L4·L5, 해외 L5)→ok_l5 / 확신(certain·high)+정상 누락 패턴(국내 L1→L4, 해외 L2→L5)+양수차이→missing_suspected / 그 외→needs_review. `effectiveIncluded` = missing_suspected(제외 안 한 것) + 사용자가 ✅포함한 needs_review.

**피드백 전송 모델**: ✅/❌/모르겠음 버튼은 로컬 상태(합계·문의 문구)만 바꾼다. 실제 시트 전송은 절대 버튼 클릭마다 하지 않고, 사용자가 명시적으로 "내 판단으로 서비스 돕기" 버튼을 누를 때 최종 판단만 한 번에 `submitJudgments`로 보낸다(고민 중 클릭이 노이즈로 안 남게). 파싱 실패 제보도 별도 버튼(명시적). 둘 다 collector env 없으면 no-op/복사 fallback.

**False-negative 구제**: 앱이 아예 못 잡은(not_marriott) 거래를 사용자가 전체 거래 표에서 "🏨 메리어트로 표시"하면, `applyFeedback`이 예상 포인트를 계산해 `userDesignatedMarriott`로 마킹하고 합계·문의 문구에 반영(status는 not_marriott 유지 → 전체 거래 표에서 토글). 시트엔 detected_status="user_designated"로 전송돼 규칙 후보 중 최우선 신호가 됨.

## 검증

```bash
npm test          # vitest (전부 통과 상태 유지할 것)
npm run test:coverage # 핵심 로직 커버리지 + 하한선 검증
npm run test:e2e  # Playwright 합성 XLSX 업로드·피드백·반응형 흐름
npm run lint && npm run build
npm run fixture   # docs/_local/sample.xlsx 생성 (실제 레이아웃 모사, gitignore)
```

fixture 기대값: 16건 / Marriott 12 / 정상 2 / 누락 의심 8 / 확인 필요 2(HOTEL 55 CHICAGO + 해외 L1) / 예상 추가 5,585P (Hotel 55 포함 시 +420P, SAMMAEBONG을 메리어트로 표시 시 +1,200P). 실물 파일 검증 방법은 `docs/_local/HANDOFF.md` 참고. UI 변경 시 Playwright로 업로드→요약 수치→피드백 버튼→문의 문구까지 실제로 확인할 것.

## 배포

- `vercel --prod` (프로젝트 링크·인증 완료 상태). 배포 전 반드시 테스트+빌드+사용자 승인.
- 수집을 켜려면 Google Sheets 기반으로 `google-apps-script/Code.gs`를 구글 시트에 붙여 웹 앱 배포 → 그 URL을 Vercel에 `NEXT_PUBLIC_APPS_SCRIPT_URL`로 설정 → 재배포. CSP connect-src는 next.config.ts가 Google 도메인을 자동 추가.

## 로드맵 (사용자 확인된 방향)

1. **수집 활성화** — Google Sheets(Apps Script) 기반. 피드백 수집(가맹점 DB가 장기 자산) + 파싱 실패 원클릭 제보. 켜지면 페이지 하단 수집 고지가 자동 표시됨. (완료)
2. **더 클래식 카드 지원** — cardProfiles에 프로필 추가 + 카드 선택 UI.
3. 전세계 Marriott 호텔 alias DB 확장. 현재 구조는 `rules/marriottProperties/`에 Marriott 공식 hotel sitemap 기준 전세계 143개 국가·지역 10,148개 호텔을 seed로 넣고, 공식명/짧은 영문명/한글명을 결정적 룰로 대조한다. 미국 주 단위 sitemap은 `us.ts`와 중복되므로 제외하고, Antarctica sitemap의 테스트 호텔 데이터도 제외한다.
4. 피드백/제보 어드민 리뷰 페이지 (v2). 사용자 피드백은 절대 자동으로 규칙이 되지 않음: 집계 → 후보 → 수동 검토 → 규칙.
5. **조건부 하이브리드 백엔드 (v2.x)** — 비공개로 유지할 가치가 있는 수동 검증 alias가 충분히 쌓인 경우에만, 파일 로컬 처리를 유지하면서 비공개 alias 조회 API를 추가하는 방안을 재검토한다. 상세 계획은 아래 참고.

### v2.0 — 가맹점 DB 큐레이션 헬퍼 (LLM, 미착수)

> 사용자 확인(2026-07-06): 로드맵에만 잡아두고 **지금은 절대 구현하지 않음.**

시트에 쌓인 제보(특히 `user_designated` 가맹점: 앱이 못 잡았는데 사용자가 메리어트라고 표시한 것)를 **운영자 전용 도구**에서 LLM으로 규칙 후보를 추리는 것. 반드시 지켜야 할 제약:
- **사용자 앱 경로엔 절대 LLM 없음** — 판정·계산은 영원히 결정적 규칙. 이건 이 앱의 프라이버시·신뢰 스토리(파일이 브라우저 밖으로 안 나감, CSP `connect-src 'self'`)의 핵심.
- LLM은 **집계된 가맹점명(개인 거래 프로필 아님)** 만 다루는 **로컬/관리자 스크립트**로, 특정 사용자 파일에 접근하지 않음.
- LLM은 **후보만 제안**, `rules/marriottProperties.ts`/`rules/marriottOverrides.ts` 등록은 **사람 수동 승인**. 자동 규칙화 절대 금지(스펙 원칙 유지).
- 즉 "집계 → (LLM이 후보 제안) → 사람 검토 → 규칙"에서 후보 단계만 가속.

### v2.x — 비공개 alias 조회용 하이브리드 백엔드 (조건부·미착수)

> 사용자 확인(2026-07-11): **나중을 위한 실현 가능성 검토용 계획**이다. 현재 버전은 정적·로컬 분석 구조를 유지하며, 별도 승인 전에는 구현하지 않는다.

**목표**: 공식 호텔 DB와 일반 규칙은 계속 공개 클라이언트에서 사용하되, 사용자 제보로 발견하고 운영자가 검증한 고가치 alias만 서버의 비공개 DB에 보관한다. 전체 엑셀을 서버형으로 전환하지 않고, 공개 규칙으로 판정하지 못한 가맹점명만 선택적으로 조회하는 구조다.

**도입 판단 조건** — 다음 조건이 모두 충족될 때만 구현을 검토한다.

- 공개 seed에서 쉽게 파생되지 않는 수동 검증 alias가 충분히 쌓여, 별도 운영 복잡성과 비용을 감수할 가치가 있다.
- 사용자가 선택적 조회 시 가맹점명이 서버로 전송된다는 고지를 수용할 수 있다.
- DB 백업·규칙 검토·장애 대응·비용을 운영자가 지속해서 관리할 수 있다.
- 공개 API를 통한 개별 질의로 alias 존재 여부가 추정될 수 있다는 한계를 감수하거나, 필요하면 인증 모델을 추가할 수 있다.

**목표 흐름**:

1. 엑셀 파싱·컬럼 정규화는 지금처럼 100% 브라우저에서 수행한다.
2. 공개 브랜드/호텔 seed/known rule로 먼저 로컬 판정한다.
3. 사용자가 명시적으로 추가 조회를 선택했을 때만, 미매칭·확인 필요 가맹점명을 정규화하고 중복 제거해 same-origin `POST /api/classify`로 보낸다.
4. Next.js App Router의 Route Handler가 Vercel Function으로 실행되어 비공개 Supabase/Postgres alias 테이블을 조회하고, 동일한 결정적 규칙으로 판정한다. 별도 Express 서버는 두지 않는다.
5. 응답은 요청 안에서만 쓰는 임시 opaque key, 매칭 여부, 정규화 호텔명, `region`, `confidence`, `ruleVersion`만 반환한다. 현재 거래 ID나 거래 내용에서 파생한 ID, 원본 pattern 목록, DB 행은 반환하지 않는다.
6. 포인트 계산·등급 판정·합계·문의 문구 생성은 계속 브라우저에서 수행한다. API 실패 시 공개 로컬 규칙 결과로 정상 fallback한다.

**서버로 절대 보내지 않을 것**:

- 업로드 파일/워크시트 원문, 사용자 이름, 카드번호
- 결제금액, 거래일자, 포인트 금액·등급, 가맹점명 외의 거래 필드, 원본 행 순서
- 판정에 필요하지 않은 세션 식별자와 브라우저 정보

**보안·프라이버시 조건**:

- DB 자격 증명은 서버 전용 환경 변수로만 사용하고 `NEXT_PUBLIC_`에 절대 넣지 않는다. 가능하면 전용 read-only DB role/RPC와 반환 필드 allowlist를 사용한다. RLS를 우회하는 service role이 불가피하면 API의 단일 데이터 접근 계층 밖에서는 사용하지 않는다.
- 요청 schema, 배치 개수, 문자열 길이를 제한하고, 배포 전부터 서버리스에서도 유지되는 rate limit/쿼터와 abuse 모니터링을 둔다. 원문 request body를 애플리케이션 로그에 남기지 않는다.
- `connect-src 'self'`는 same-origin API 자체를 허용하므로, 서버 도입 후에는 CSP만으로 "파일 미전송"을 증명할 수 없다. 클라이언트가 전송 필드 allowlist로 payload를 새로 만들고, 서버는 알 수 없는 필드를 거부하며, 네트워크 E2E 테스트로 금지 필드가 전송되지 않는지 검증한다.
- 비공개 DB는 번들·소스의 일괄 노출을 막지만, 공개 조회 API의 반복 호출에 의한 열거 가능성까지 완전히 없애지는 못한다. 강한 독점성이 필요해지면 로그인·쿼터·유료 접근을 별도 제품 결정으로 검토한다.
- 사용자 앱의 판정 경로에는 LLM을 넣지 않는다. 서버 조회도 사람이 승인한 alias를 사용하는 결정적 로직만 허용한다.

**권장 기술 스택**:

- 기존 Next.js/React/SheetJS 클라이언트 유지
- `app/api/classify/route.ts` Route Handler + Vercel Function
- Supabase Postgres 비공개 alias 테이블 + 서버 전용 DB 클라이언트
- 입력 검증(Zod 또는 동등한 결정적 schema), Vitest API 테스트, Playwright 네트워크 payload E2E
- 서버리스 호출 간에도 유지되는 플랫폼 또는 외부 rate-limit 저장소를 처음부터 적용하고, 작은 요청 한도·쿼터로 시작

**구현 단계**:

1. **의사결정 기록** — 전송되는 가맹점명 범위, 명시적 동의 UX, 보관·로그 정책, 운영비 상한을 확정한다.
2. **데이터 계층** — `active/needs_review/rejected`, 출처, 검토일, rule version을 가진 alias schema와 마이그레이션·백업 절차를 만든다. 사용자 판정에는 사람이 승인한 `active` 행만 사용하고, 공개 seed와 private alias의 경계를 문서화한다.
3. **읽기 전용 API** — 인증정보를 서버에만 둔 최소 응답 API를 구현하고 입력 제한·timeout·fallback·rate limit을 적용한다.
4. **선택적 클라이언트 연결** — 공개 로컬 판정 후 사용자가 동의한 미판정 이름만 전송한다. 기능 플래그/env가 없으면 현재 로컬 전용 동작을 유지한다.
5. **검증** — API 단위/통합 테스트와 Playwright 요청 가로채기로 파일·금액·날짜·카드번호·포인트 정보가 payload에 없는지 검사한다. DB rule과 기존 로컬 rule의 회귀 결과도 비교한다.
6. **고지·점진 배포** — README/UI 개인정보 설명을 "파일은 로컬 처리, 선택 시 가맹점명만 추가 조회"로 정확히 바꾸고 preview에서 확인한 뒤 점진 배포한다. 문제가 생기면 기능 플래그를 꺼서 로컬 전용 구조로 즉시 복귀한다.

**1차 범위에서 제외**: 엑셀 업로드 API, 서버 측 포인트 계산, 사용자 계정/결제, 기존 Apps Script 제보 수집기의 DB 이관, 자동 alias 승인, 사용자 앱 내 LLM. 이들은 각각 별도 필요성과 승인을 검토한다.
