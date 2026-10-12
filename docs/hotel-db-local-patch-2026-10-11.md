# 2026-10-11 사용자 승인 — 호텔 3개 로컬 패치

## 적용 결과

사용자의 명시적 요청에 따라 아래3개만 로컬 활성 호텔 seed에 추가했습니다. 운영 서비스에 배포한 것이 아닙니다.

| 호텔 코드 | 호텔 | 국가·지역 | 내부 브랜드 | 안정 ID |
| --- | --- | --- | --- | --- |
| BLRXR | ARTEZIA Bengaluru | 인도 IN · 해외 | Independent | in-blrxr |
| IXKRS | The Fern Residency Somnath | 인도 IN · 해외 | Series by Marriott | in-ixkrs |
| UTPMA | MASON Pattaya | 태국 TH · 해외 | Design Hotels | th-utpma |

3개 모두 브랜드 그룹은 `marriott`, 국내외 구분은 `overseas`입니다. 앱의 현재 더 베스트 카드 규칙에 따라 해외 호텔 L5 적립 여부를 검사합니다. 호텔 DB 등록이 카드 특별적립을 보장하는 것은 아닙니다.

- 활성 seed: **10,306 → 10,309개**. 기존10,306개의 ID·공식코드·국가·공식명은 그대로 보존했습니다.
- 신규45개 중 나머지 **42개는 미등록 검토큐에 유지**했습니다. 정식 보류88개에42개를 새로 추가한 것은 아닙니다. 따라서42개 이름에 대해 기존 일반 브랜드 규칙까지 일괄 차단하거나 확인 필요로 강제 변경하지 않았습니다.
- 정식 보류: **88개 유지**. 별도 보류 해제7개(BNACR, HGHFU, IXMRT, MGMSS, MRYCO, SFOPS, UKBCY)는 모두 그대로입니다.
- 삭제·보류 해제·승인 snapshot 덮어쓰기: **0개**. 기존 dirty patch를 보존했습니다.
- 커밋·push·배포, 수집기·영구 환경 변수 변경: **없음**.

## 이름과 제휴 시점의 안전장치

| 입력 이름 | 처리 |
| --- | --- |
| ARTEZIA BENGALURU | 등록된 개별 호텔명으로 인식. 전환 중 혜택 조건은 설명에 확인 필요로 표시 |
| ARTEZIA 단독 | exact · medium · 확인 필요. 자동 누락 의심 및 합계 포함으로 올리지 않음 |
| 현재 Fern Somnath 이름 + Series by Marriott | 활성 매칭. 쉼표 유무·FOH 접미사를 테스트 |
| 기존 THE FERN RESIDENCY SOMNATH만 있는 상호 | medium · 확인 필요. Marriott 참여 전 결제를 현재 제휴로 소급하지 않도록 보호 |
| MASON + Design Hotels / MASON PATTAYA | 현재 개별 호텔명이 구체적인 경우 활성 매칭 |
| MASON 단독 | exact · medium · 확인 필요. generic high-confidence 파생 alias 생성을 막음 |
| 미국 Cincinnati/Mason의 기존 호텔4개 | 태국 MASON으로 바뀌지 않도록 회귀 테스트 |

ARTEZIA의 Independent는 내부 분류입니다. 법적 소유·운영관계를 확인했다는 뜻이 아니며 St. Regis·Autograph Collection·Design Hotels로 표시하지 않았습니다. 과거 Shangri-La 이름도 Marriott alias로 넣지 않았습니다.

정확한 실제 개장일·Marriott 참여 시작일은 이번 패치에서도 **null/미확인**입니다. 날짜를 추정해 거래일 가드를 만들지 않았습니다. 짧거나 전환 전 상호로 보이는 이름은 확인 필요로 남겨 사용자가 실제 거래를 확인할 수 있게 했습니다. 기존 L4/L5 정상 적립·취소 우선순위는 그대로입니다.

## 근거와 승인 기록

운영사 조사·날짜별 객실 확인은10/10, 공식 overview 재조회는10/11의 기존 검토를 사용했습니다. 이 패치에서 새 운영·객실 재고 조사를 한 것으로 날짜를 바꾸지 않았습니다.

- [등록 전45개 검토](hotel-new-candidates-2026-10-11.md)
- [수동 승인·로컬 적용 기록](../data/marriott/reviews/2026-10-11-local-approved-three.json)
- [등록 전 검토 JSON](../data/marriott/reviews/2026-10-11-new-candidates.json)

이전 검토 JSON은 당시 `applied:false` 상태 그대로 보존하고, 이번 명시적 사용자 승인과3개 적용은 별도 기록에 남겼습니다. 과거 검토 테스트도 이 시간 순서를 구분하도록 조정했으며, 현재 활성 변화는 정확히3개만 허용하도록 새 테스트가 검사합니다.

## 타입 오류4개 해결

이전 전체 타입 검사에서 `marriottUpdateMonitor.test.ts`의221·267·317·358행은 객체가 `never`에 할당된다는 TS2322 오류를 냈습니다. 원인은 `compareMarriottCatalogs`의 두 빈 기본 배열이 `never[]`로 추론된 것입니다.

`scripts/marriott/monitor.mjs`의 기본 배열에 기존 JSON 자료형을 연결하는 JSDoc 타입 주석2개만 추가했습니다. 기본값은 여전히 빈 배열이고 수집·비교·등록·삭제 동작은 변경하지 않았습니다. 타입 검사와 빌드가 통과했습니다.

## 검증 결과

| 검사 | 결과 |
| --- | --- |
| npm test | **627개 / 18개 파일 통과**. 이번3개용 신규 회귀 테스트26개 포함 |
| npm run test:coverage | **통과**. 문장98.72%, 분기93.34%, 함수100%, 라인98.89%; 설정된 하한선 통과 |
| npm run lint | 통과 |
| npx tsc --noEmit | 통과. 이전4개 타입 오류 해결 |
| npm run build | 통과. Next.js16.2.10의 모든 앱 경로가 Static으로 빌드됨 |
| npm run test:e2e | **5개 통과**. 이번 호텔명 분류·업로드 테스트1개 포함 |
| git diff --check | 통과 |
| 주요 기존 파일 SHA-256 | 적용 전후13개 일치. 별도로 캡처한16개 중 변경된 것은 in.ts, th.ts, monitor.mjs뿐 |

### 브라우저 검증 흐름

합성 XLSX 업로드 → 브라우저 파싱·정규화 → 로컬 호텔 DB 판정 → 요약 렌더링을 검사했습니다. 이 분석 경로에 서버 API나 외부 호텔 조회를 추가하지 않았습니다.

새 테스트는 해외 L2 거래6건(각100,000원·실제300P)을 사용했습니다. 현재 이름이 구체적인3건은 누락 의심, 짧거나 기존 상호인3건은 확인 필요이며, 자동 포함된 예상 추가 포인트는 **600P**였습니다. 이는 합성 테스트 기대값이지 실제 고객 적립액이 아닙니다.

- 실제 렌더링 요약: 전체6건 / Marriott 추정3건 / 정상0건 / 누락 의심3건 / 확인 필요3건 / 예상 추가600P.
- 분석 중 HTTP 변경 요청0건, 브라우저 미처리 예외0건을 검사했습니다. 모든 네트워크 방식의 전량 감청·실서비스 보안 인증을 뜻하지는 않습니다.
- 기존4개 E2E도 통과해 명시적 제보·피드백·반응형·파싱 실패 흐름의 회귀를 확인했습니다.
- Google 수집기는 가짜 URL/응답 모킹을 사용했습니다. 실제 Google Sheets에 테스트 제보를 넣지 않았습니다.
- 첫 시도는 실행 환경의 localhost listen EPERM으로 시작되지 못했습니다. 필요한 실행 권한으로 재실행한5개 테스트가 통과했고, 소유한 테스트 서버는 종료됐습니다.

검증 스킬은 단위 함수뿐 아니라 업로드부터 화면 요약까지 확인하도록 범위를 잡는 데 사용했습니다. 운영 서비스 배포·실제 카드 명세서·호텔 현장 운영 검증은 수행하지 않았습니다.

## 검토할 코드

- [인도 호텔2개·ARTEZIA 브랜드·Fern 상호 가드](../rules/marriottProperties/in.ts)
- [태국 MASON·단독 이름 가드](../rules/marriottProperties/th.ts)
- [신규26개 회귀 테스트](../lib/__tests__/marriottApprovedThree.test.ts)
- [합성 엑셀 업로드 E2E](../e2e/bonvoy-flow.spec.ts)

코드·데이터·테스트가 로컬에 준비된 상태입니다. 운영 서비스 반영은 별도의 사용자 승인과 커밋·배포 단계가 필요합니다.

