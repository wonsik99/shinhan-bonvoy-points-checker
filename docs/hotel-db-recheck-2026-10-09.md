# Marriott 공식 DB·불확실 호텔 3개 재확인 — 2026-10-09

## 결론

10월 4일 이후 **호텔 코드 구성에는 변화가 없고, 호텔 3개의 운영 확인 공백도 해소되지 않았습니다.** 삭제·신규 등록·보류 해제를 진행할 새 근거는 확보하지 못했습니다.

요청에 인용된 계획은 ‘10월 8일 기준’이지만 실제 조회일은 America/Detroit 기준 **10월 9일**입니다. 10월 8일 당시 상태를 복원하거나 그날 확인한 것으로 기록하지 않았습니다.

## 공식 DB 비교

비교 단위는 공식 propertyCode입니다. 같은 코드의 slug·source·officialUrl을 별도로 대조했습니다.

| 10월 4일 → 10월 9일 | 결과 |
| --- | ---: |
| 공식 코드 수 | 10,399 → 10,399 |
| 추가 코드 | 0 |
| 소스에서 사라진 코드 | 0 |
| slug 변경 | 0 |
| source 변경 | 0 |
| 공식 호텔 URL 변경 | 0 |
| lastmod 수정일 표시 변경 | 1 |
| 중복 코드 | 0 |
| 목록 소스 수 / 수집 실패 | 17 / 0 |

lastmod가 달라진 것은 **DXBBG — Bvlgari Dubai**입니다. [공식 sitemap](https://www.bulgarihotels.com/sitemap.xml)의 해당 호텔 [페이지](https://www.bulgarihotels.com/en_US/dubai) 수정일 표시가 2026-07-30에서 2026-10-09로 바뀌었습니다. 코드·URL·slug는 그대로입니다. 원문 페이지 내용의 변경분이나 영업 상태 변화를 확인한 것은 아닙니다.

공식 수집 결과의 review_required는 기존 미승인 변경안이 남아 있다는 뜻입니다. 수집 실패나 호텔 폐업 판정이 아닙니다. 기본 보고서의 추가 124 / 소스 누락 23 / slug 변경 45는 **7월 26일 승인 snapshot 대비** 값입니다. 이번 **10월 4일 대비** 추가·누락·slug 변경은 모두 0입니다.

활성 10,306개 / 보류 88개 / 신규 등록 검토 후보 45개도 그대로입니다. 신규 45개 전체의 개별 운영 상태를 오늘 다시 조회한 것은 아닙니다.

- 오늘 snapshot 생성 시각: 2026-10-09T22:30:59.950Z (Detroit 18:30:59)
- 비교한 이전 snapshot: 2026-10-04T23:50:37.096Z
- 승인된 7월 snapshot SHA-256: d383fa1d6c8e9520ad704aa657c9b3aaffcc6a2f01644ba3e886be71dc12c1d8 — 변경 없음
- [오늘 수집 보고서](/Users/wonsikjung/Desktop/shinhan-bonvoy-l5-checker/docs/_local/marriott-refresh-2026-10-09.Tg0wXh/report.md)
- [10월 4일 대비 비교 결과](/Users/wonsikjung/Desktop/shinhan-bonvoy-l5-checker/docs/_local/marriott-refresh-2026-10-09.Tg0wXh/comparison-to-2026-10-04.json)

## 호텔 3개 재확인

세 호텔은 오늘 공식 코드 묶음에도 없지만, 이것만으로 폐업·제휴 종료를 판단하지 않습니다.

| 코드·호텔 | 오늘 추가 또는 재확인한 근거 | 남은 확인 | 권고 |
| --- | --- | --- | --- |
| HGHHA — Aloft Huzhou | 미국판 overview·rooms 조회 오류(404), 영국판 캐시 소개·객실 설명 유지. 구 브랜드 색인의 2027년 1월 예정은 현재 유효성 미확인 | 실제 개장·영업 여부, 예정일 유효성, 현재 객실 판매 | 기존 확인 필요 보호 후보 유지 |
| SZXLP — Four Points Shenzhen Longhua | 영국판 rooms 캐시에 예약 미개시 안내를 추가 확인. 미국판 overview·rooms 조회 오류(404) | 실제 개장일·운영·현재 객실 판매 | 기존 확인 필요 보호 후보 유지 |
| SHAFO — Fairfield Shanghai Hongqiao NECC | 기존 rooms 외에 overview 검색 색인에서도 휴업 안내 확인. 직접 overview·rooms 조회 오류(404) | 현재 휴업 안내 유효성, 휴업·재개일, 일시 휴업과 제휴 종료 구분 | 기존 확인 필요 보호 후보 유지 |

공식 근거:

- HGHHA: [미국판 소개](https://www.marriott.com/en-us/hotels/hghha-aloft-huzhou/overview/), [영국판 소개](https://www.marriott.com/en-gb/hotels/hghha-aloft-huzhou/overview/), [영국판 객실](https://www.marriott.com/en-gb/hotels/hghha-aloft-huzhou/rooms/).
- SZXLP: [미국판 소개](https://www.marriott.com/en-us/hotels/szxlp-four-points-shenzhen-longhua/overview/), [영국판 객실](https://www.marriott.com/en-gb/hotels/szxlp-four-points-shenzhen-longhua/rooms/).
- SHAFO: [공식 소개](https://www.marriott.com/en-us/hotels/shafo-fairfield-shanghai-hongqiao-necc/overview/), [공식 객실](https://www.marriott.com/en-us/hotels/shafo-fairfield-shanghai-hongqiao-necc/rooms/).

## 판단에 영향을 주는 한계

- 오늘 직접 공식 목록 수집과 웹 페이지·검색 색인 재조회는 수행했습니다. **실시간 브라우저 예약 UI는 재확인하지 않았습니다.**
- 반환 소개는 캐시일 수 있습니다. SZXLP 예약 미개시 본문은 last month 수집 표시이며, SHAFO 휴업 안내는 overview 2 weeks ago / rooms 4 weeks ago 색인입니다. 오늘의 영업 상태로 단정하지 않았습니다.
- 예약 버튼, 일반 소개, 색인의 표본 요금, Sold Out 및 404는 실제 운영·폐업 여부와 별개입니다.
- [공식 개장 목록](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi)의 Asia Pacific 구간은 중국을 제외한다고 명시합니다. 세 중국 호텔의 미등재를 개장 여부 판단에 사용하면 안 됩니다. 이 범위 제한을 이번 검토에서 추가로 기록했습니다.
- SHAHF — Fairfield Shanghai Hongqiao 및 Hongqiao Airport Qibao는 SHAFO와 다른 호텔입니다. 최근 소개나 요금을 SHAFO 재개 근거로 합치지 않았습니다.
- 개장·휴업·재개·제휴 종료일 중 공식 근거가 없는 값은 미확인/null로 유지했습니다.
- 이번 개별 호텔 검토 범위는 정확히 3개입니다. 전체 활성 호텔의 영업 상태를 전수 확인한 결과가 아닙니다.

자료 품질 관점에서 캐시·소스 이탈을 운영 상태로 오해할 위험은 중간 수준입니다(3개에 국한된 자동 판정 오인 위험). ‘운영 확인 공백이 남아 있다’는 판단의 근거는 강하지만, 실제 영업·미영업 어느 쪽의 신뢰도를 높일 근거는 부족합니다. 코드 구성 변화 없음과 수정일 표시 1개 변경은 직접 수집한 snapshot 비교로 확인했습니다.

## 다음 결정

호텔 3개를 폐업으로 삭제하거나 이미 운영 중이라고 처리할 근거는 여전히 부족합니다. 기존 호텔 기록을 보존한 채 자동 누락 의심을 피하도록 ‘확인 필요’ 보호안을 준비하는 방향을 권고합니다. **그 보호 변경은 이번에 적용하지 않았습니다.**

운영 상태를 더 확인하려면 현재 Marriott 예약 화면의 날짜별 선택 가능한 객실·요금 또는 호텔/운영사의 개장·재개 발표가 필요합니다. 보호 패치와 실제 영업 확인은 서로 다른 작업입니다.

## 증거·검증·변경 여부

- [전체 재확인 근거 JSON](/Users/wonsikjung/Desktop/shinhan-bonvoy-l5-checker/docs/_local/marriott-recheck-2026-10-09.json)
- 개별 호텔 근거 38개: HGHHA 10 / SZXLP 17 / SHAFO 11. 서로 독립된 38건의 운영 증거라는 뜻이 아니라 조회·관찰 기록 수입니다.
- 수집기·기존 승인 큐 관련 테스트 2파일 / 34개 통과.
- 승인 snapshot·보류·소스 예외·코드 메타데이터·중국 seed·판정 코드·package/lockfile의 전후 해시가 같습니다.
- 신규 등록·보류 해제·삭제·판정 변경·커밋·push·배포 모두 미실행.
- 전체 테스트·build·브라우저 E2E는 이번 읽기 전용 재확인에서 재실행하지 않았습니다.

데이터 품질 점검에서는 코드 중복·수집 누락·비교 날짜와 실제 호텔 사건 날짜를 분리했습니다. 특히 캐시의 예약 미개시/휴업 표시와 현재 상태의 확인 공백을 그대로 남겼습니다.
