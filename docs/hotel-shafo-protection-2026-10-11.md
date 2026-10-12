# SHAFO 운영 상태 확인 필요 — 로컬 보호 패치

검토·승인·로컬 적용 기준일: 2026-10-11 (America/Detroit).

## 적용한 변경

중국의 **Fairfield by Marriott Shanghai Hongqiao NECC (SHAFO)** 기록은
`cn-shafo` ID와 기존 공식명·국가·코드를 그대로 보존합니다. 호텔 신규 등록이나
삭제가 아니라, 해당 호텔로 식별되는 거래를 자동 누락 의심에서 제외하는 보호입니다.

| 합성 거래: 해외 L2, 100,000원, 실제 300P | 패치 전 | 패치 후 |
| --- | --- | --- |
| 판정 | 누락 의심 | 확인 필요 |
| 기본 추가 포인트 합계 | 200P 반영 | 0P 반영 |
| 기본 문의 문구 | 자동 포함 | 제외 |
| 사용자가 직접 문의에 포함 | 포함 | 200P 반영·문의 문구 포함 |

L4/L5로 이미 특별 적립된 거래는 정상 판정을 유지하고, 취소 거래는 계속 제외합니다.
휴업 시작·재개 시점이 미확인이므로 과거·현재·날짜 없는 거래에도 같은 확인 필요
보호를 적용합니다. 한국어 상호와 공백·문장부호 변형은 좁은 호텔별 이름으로
대조하며, 기존 토큰 인덱스가 SHAFO를 식별한 경우에도 같은 보호가 적용됩니다.
`FAIRFIELD`처럼 호텔을 특정할 수 없는 브랜드명 전체를 변경하는 작업은 아닙니다.

## 근거와 한계

10/11 다시 검색한 [Marriott 개요](https://www.marriott.com/en-us/hotels/shafo-fairfield-shanghai-hongqiao-necc/overview/)와
[객실 안내](https://www.marriott.com/en-us/hotels/shafo-fairfield-shanghai-hongqiao-necc/rooms/)의
검색 캐시에 휴업 안내가 남아 있습니다. 개요는 약 3주 전, 객실 안내는 약 1개월 전
수집된 캐시이므로 오늘의 실제 운영 상태를 확인한 것은 아닙니다.

현재 운영·재개 여부, 휴업 기간, Marriott 참여 상태와 카드 특별 적립 대상 여부는
계속 **확인 필요**입니다. 영구 폐업·제휴 종료로 단정하지 않으며, 제휴 전환이
확인된 기존 5개 가드와도 분리했습니다.

## 변경하지 않은 항목

- 보존 호텔 10,309개, 정식 등록 보류 88개: 그대로.
- 다른 호텔 10,308개의 공식명 판정: 패치 전 결과와 동일한지 회귀 비교.
- HGHHA·SZXLP·인접 SHAHF/SHAOX, 기존 제휴 전환 5개 가드: 그대로.
- 보류 해제 후보 7개: 모두 보류 유지. 신규 검토 대기 42개: 미등록 유지.
- 승인 snapshot·이전 검토 JSON·원본 국가별 seed·수집기·CSP·파일 로컬 처리: 그대로.
- 자동 등록·보류 해제·삭제, 커밋·push·배포: 하지 않음. 운영 사이트는 바뀌지 않음.

## 검토 가능한 코드와 승인 기록

- `rules/marriottPropertyOperatingReviews.ts`: SHAFO만 포함하는 운영 불확실성 규칙.
- `lib/marriottPropertyOperatingReviews.ts`: 호텔별 이름 및 기존 property code 식별 보호.
- `lib/classifyMerchant.ts`: 일반 브랜드 판정보다 먼저 보호하며, 식별된 토큰/alias 경로에도 적용.
- `data/marriott/reviews/2026-10-11-shafo-operating-review.json`: 사용자 승인, 미확인 날짜, 변경 전후 코드 해시와 보호 파일 해시.
- `lib/__tests__/marriottPropertyOperatingReviews.test.ts`: 날짜·등급·취소·수동 포함·인접 호텔·전체 다른 공식명 회귀 검증.
- `e2e/bonvoy-flow.spec.ts`: SHAFO 합성 XLSX 업로드→요약→수동 포함/제외→문의 문구 브라우저 검증.

기존 3개 등록 승인 JSON은 덮어쓰지 않았습니다. 기존 테스트의 코드 해시 감사는
이번에 별도 승인된 `lib/classifyMerchant.ts` 변경 한 개만 정확한 변경 전후 해시로
연결하며, 다른 보호 파일 검증을 생략하지 않습니다.

## 검증

- `npm test`: 19개 파일 / 674개 테스트 통과.
- `npm run test:coverage`: 동일 674개 통과, statements 98.40% / branches 92.86% / functions 100% / lines 98.92%. 기존 하한선을 낮추지 않았습니다.
- `npm run lint`, `npx tsc --noEmit`: 통과.
- `npm run build`: 통과. `/`, `/_not-found`, `/opengraph-image` 모두 정적 생성 유지.
- `npm run test:e2e`: Chromium 브라우저 테스트 6개 통과.
- `git diff --check`: 통과.

검증·Playwright 스킬에 따라 합성 파일만 사용하고, 제보 수집기를 테스트 응답으로
대체했습니다. SHAFO 업로드→합계→수동 포함/제외→문의 문구 흐름의 변경 요청은
0건, 브라우저 오류도 0건이었습니다. 실제 파일·실제 수집기·운영 사이트는 사용하지
않았고, 테스트 서버는 종료되었습니다.

이번 작업 시작 시 기록한 242개 파일의 해시를 대조했습니다. 기존 파일 중 바뀐 것은
판정 연결부·브라우저 테스트·이전 승인 해시 연결 테스트·유지관리 문서 4개뿐이고,
나머지 238개는 동일합니다. 국가별 원본 seed와 이전 승인 기록은 보존했습니다.
10,309개 전체 호텔의 ID·코드·국가·공식명도 변경 전 해시와 동일합니다.

비공개 상세 검증 기록은 gitignore된
`docs/_local/marriott-shafo-protection-validation-2026-10-11.json`에 남겼습니다.

다음 별도 검토는 보류 해제 우선 후보 UKBCY·MGMSS·MRYCO·SFOPS의 최종 확인입니다.
이번 패치에서는 이 4개를 포함해 어떤 보류도 해제하지 않았습니다.
