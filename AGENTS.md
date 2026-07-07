<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bonvoy L5 Checker — Agent Handoff

신한 메리어트 본보이 카드 사용자가 포인트 적립 상세내역 엑셀을 올리면, 메리어트 계열 호텔 결제가 정상 특별적립(국내 L4 / 해외 L5)됐는지 검사해주는 웹 도구.

- **Live**: https://shinhan-bonvoy-l5-checker.vercel.app (Vercel, 완전 정적 — 서버 함수 없음)
- **Repo**: github.com/wonsik99/shinhan-bonvoy-l5-checker
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
lib/classifyMerchant    known rules → 한글 브랜드 → 호텔 alias DB(인덱스) → 영문 브랜드 → 운영사/후보 → 호텔 유사 키워드
lib/analyzeTransactions 상태 판정(ok_l5/missing_suspected/needs_review/not_marriott/canceled), 피드백 적용, 요약
lib/inquiryMessage      카드사 문의 문구 생성
lib/feedback            (선택) 익명 피드백 + 파싱 실패 원클릭 제보 — 기본은 Google Sheets(Apps Script), env 없으면 no-op
rules/marriott*.ts      브랜드 키워드·호텔 alias DB(한국 41 + 일본 128)·후보/운영사 룰 / rules/cardProfiles.ts 카드 프로필
components/             FileUpload(제보 UI 포함), SummaryCards, 3개 테이블, InquiryMessage, Disclaimer
google-apps-script/Code.gs  구글 시트 수집기(doPost) + 배포 안내
next.config.ts          CSP 헤더 (connect-src 'self' + Apps Script 수집기 도메인 자동 추가)
```

분석 규칙 요점: 취소→canceled / 비메리어트→not_marriott / 정상등급(국내 L4·L5, 해외 L5)→ok_l5 / 확신(certain·high)+양수차이→missing_suspected / 그 외→needs_review. `effectiveIncluded` = missing_suspected(제외 안 한 것) + 사용자가 ✅포함한 needs_review.

**피드백 전송 모델**: ✅/❌/모르겠음 버튼은 로컬 상태(합계·문의 문구)만 바꾼다. 실제 시트 전송은 절대 버튼 클릭마다 하지 않고, 사용자가 명시적으로 "내 판단으로 서비스 돕기" 버튼을 누를 때 최종 판단만 한 번에 `submitJudgments`로 보낸다(고민 중 클릭이 노이즈로 안 남게). 파싱 실패 제보도 별도 버튼(명시적). 둘 다 collector env 없으면 no-op/복사 fallback.

**False-negative 구제**: 앱이 아예 못 잡은(not_marriott) 거래를 사용자가 전체 거래 표에서 "🏨 메리어트로 표시"하면, `applyFeedback`이 예상 포인트를 계산해 `userDesignatedMarriott`로 마킹하고 합계·문의 문구에 반영(status는 not_marriott 유지 → 전체 거래 표에서 토글). 시트엔 detected_status="user_designated"로 전송돼 규칙 후보 중 최우선 신호가 됨.

## 검증

```bash
npm test          # vitest (72+개, 전부 통과 상태 유지할 것)
npm run lint && npm run build
npm run fixture   # docs/_local/sample.xlsx 생성 (실제 레이아웃 모사, gitignore)
```

fixture 기대값: 15건 / Marriott 12 / 정상 2 / 누락 의심 9 / 확인 필요 1(HOTEL 55 CHICAGO) / 예상 추가 6,305P (Hotel 55 포함 시 +420P). 실물 파일 검증 방법은 `docs/_local/HANDOFF.md` 참고. UI 변경 시 Playwright로 업로드→요약 수치→피드백 버튼→문의 문구까지 실제로 확인할 것.

## 배포

- `vercel --prod` (프로젝트 링크·인증 완료 상태). 배포 전 반드시 테스트+빌드+사용자 승인.
- 수집을 켜려면 Google Sheets 기반으로 `google-apps-script/Code.gs`를 구글 시트에 붙여 웹 앱 배포 → 그 URL을 Vercel에 `NEXT_PUBLIC_APPS_SCRIPT_URL`로 설정 → 재배포. CSP connect-src는 next.config.ts가 Google 도메인을 자동 추가.

## 로드맵 (사용자 확인된 방향)

1. **수집 활성화** — Google Sheets(Apps Script) 기반. 피드백 수집(가맹점 DB가 장기 자산) + 파싱 실패 원클릭 제보. 켜지면 페이지 하단 수집 고지가 자동 표시됨. (완료)
2. **더 클래식 카드 지원** — cardProfiles에 프로필 추가 + 카드 선택 UI.
3. 전세계 Marriott 호텔 alias DB 확장. 현재 구조는 `rules/marriottProperties.ts`에 한국 41개 + 일본 128개 호텔을 seed로 넣고, 공식명/짧은 영문명/한글명을 결정적 룰로 대조한다.
4. 피드백/제보 어드민 리뷰 페이지 (v2). 사용자 피드백은 절대 자동으로 규칙이 되지 않음: 집계 → 후보 → 수동 검토 → 규칙.

### v2.0 — 가맹점 DB 큐레이션 헬퍼 (LLM, 미착수)

> 사용자 확인(2026-07-06): 로드맵에만 잡아두고 **지금은 절대 구현하지 않음.**

시트에 쌓인 제보(특히 `user_designated` 가맹점: 앱이 못 잡았는데 사용자가 메리어트라고 표시한 것)를 **운영자 전용 도구**에서 LLM으로 규칙 후보를 추리는 것. 반드시 지켜야 할 제약:
- **사용자 앱 경로엔 절대 LLM 없음** — 판정·계산은 영원히 결정적 규칙. 이건 이 앱의 프라이버시·신뢰 스토리(파일이 브라우저 밖으로 안 나감, CSP `connect-src 'self'`)의 핵심.
- LLM은 **집계된 가맹점명(개인 거래 프로필 아님)** 만 다루는 **로컬/관리자 스크립트**로, 특정 사용자 파일에 접근하지 않음.
- LLM은 **후보만 제안**, `rules/marriottProperties.ts`/`rules/marriottOverrides.ts` 등록은 **사람 수동 승인**. 자동 규칙화 절대 금지(스펙 원칙 유지).
- 즉 "집계 → (LLM이 후보 제안) → 사람 검토 → 규칙"에서 후보 단계만 가속.
