# 2026-10-04 호텔 DB 승인 전 정리

기준일은 America/Detroit의 2026-10-04입니다. UTC 조회가 10월 5일에 해당하는 경우도 같은 검토일로 기록했습니다.

## 먼저 볼 결론

- 오늘 공식 코드 목록은 10월 3일과 동일합니다. 공식 XML 17개 수집에 실패는 없었습니다.
- **활성 불확실 호텔 3개**는 삭제보다 ‘확인 필요’ 보호를 권고합니다. 현재는 활성 목록에 그대로 있으며 실제 판정 보호 변경은 아직 적용하지 않았습니다.
- **신규 후보 45개**는 등록하지 않습니다. 개별 공식 주소 45개를 재조회했고 38개 본문 반환 / 7개 접근 실패였습니다. 예약 미개시 안내 20개 / 확인 필요 25개입니다.
- **보류 해제 우선 검토 7개**도 보류를 유지합니다. 개장·참여 근거가 강한 후보와 상충 근거가 있는 후보를 분리했습니다.
- 이번 검토에서 **현재 예약 가능 객실을 확인한 호텔은 0개**입니다. 예약 버튼·캐시 요금·소개 페이지를 실시간 객실 판매 증거로 올려 해석하지 않았습니다.
- 신규 등록 0 / 보류 해제 0 / 호텔 삭제 0입니다. 커밋·push·웹앱 배포를 하지 않았습니다.

이 문서의 55개 = 활성 불확실 3개 + 보류 해제 우선 검토 7개 + 신규 후보 45개입니다. 나머지 10월 3일 검토 행을 오늘 다시 개별 확인했다고 주장하지 않습니다. **활성 10,306개 전체의 운영 확인을 뜻하지 않습니다.**

## 적용 가능 / 확인 필요

| 구분 | 지금 정리할 내용 | 판정·등록 상태 |
| --- | --- | --- |
| 적용 가능 | 공식 코드 수집 결과, 호텔별 근거·확인 날짜·접근 실패·검토 우선순위 기록, 승인 큐와 회귀 테스트 | 이번 로컬 검토 자료에 반영 |
| 승인 후 준비할 보호 변경 | HGHHA / SZXLP / SHAFO를 자동 누락 의심에서 분리하는 ‘확인 필요’ 보호 | 아직 미적용; 아래 결정 기준 먼저 확인 |
| 확인 필요 | 신규 45개 등록, 보류 7개 해제, 개장·전환일, 실시간 객실 재고 | 모두 승인 전 대기 |
| 별도 보안 후속 | 공식 권고 재조회, 실제 배포의 서버/이미지 처리 경로 확인, 호환 패키지 업데이트안 | 버전 변경·배포 미실행 |

‘release_candidate’는 해제 검토 우선순위이지 승인 완료라는 뜻이 아닙니다. 실제 개장 발표가 확인된 경우에도 카드 특별적립을 보장하지 않습니다.

## 1. 활성 불확실 호텔 3개

| 코드 | 호텔 | 검토 결론 | 공식 근거 |
| --- | --- | --- | --- |
| HGHHA | Aloft Huzhou | 확인 필요 보호 후보 | [호텔 페이지](https://www.marriott.com/en-us/hotels/hghha-aloft-huzhou/overview/) |
| SZXLP | Four Points by Sheraton Shenzhen Longhua | 확인 필요 보호 후보 | [호텔 페이지](https://www.marriott.com/en-us/hotels/szxlp-four-points-shenzhen-longhua/overview/) |
| SHAFO | Fairfield by Marriott Shanghai Hongqiao NECC | 확인 필요 보호 후보 | [호텔 페이지](https://www.marriott.com/en-us/hotels/shafo-fairfield-shanghai-hongqiao-necc/overview/) |

- **HGHHA — Aloft Huzhou**: 공식 캐시 소개는 남아 있지만 실제 브라우저는 Marriott 404였습니다. 과거 2027년 1월 일정의 현재 유효성도 미확인입니다.
- **SZXLP — Four Points Shenzhen Longhua**: 색인에는 호텔 동일성·개장 예정 흔적이 있으나 실제 개장 완료·객실 판매가 확인되지 않았습니다.
- **SHAFO — Fairfield Shanghai Hongqiao NECC**: 이전 공식 휴업 안내가 색인에 남아 있지만 오늘 실제 페이지에서는 404여서 휴업 안내의 현재 유효성을 확인하지 못했습니다.

**권고**: 폐업·제휴 종료로 삭제하지 않습니다. 정확한 영업/전환일이 없으므로 과거 거래에 임의 종료일을 적용하지 않습니다. 별도 승인 시 ‘운영 확인 필요’ 보호안을 준비하되, 정상 L4/L5 등급 판정과 사용자의 수동 확인 경로를 유지해야 합니다. 기존 제휴 종료 보호 5개와 같은 종료 사건으로 합치면 안 됩니다.

## 2. 보류 해제 우선 검토 7개

| 코드 | 호텔 | 검토 결론 | 공식 근거 |
| --- | --- | --- | --- |
| UKBCY | Courtyard by Marriott Kobe | 보류 해제 우선 검토 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ukbcy-courtyard-kobe/overview/) |
| MRYCO | Le Petit Pali at Ocean Ave, a Member of Design Hotels | 보류 해제 우선 검토 | [호텔 페이지](https://www.marriott.com/en-us/hotels/mryco-le-petit-pali-at-ocean-ave-a-member-of-design-hotels/overview/) |
| SFOPS | Palihotel San Francisco, a Member of Design Hotels | 보류 해제 우선 검토 | [호텔 페이지](https://www.marriott.com/en-us/hotels/sfops-palihotel-san-francisco-a-member-of-design-hotels/overview/) |
| BNACR | StudioRes by Marriott Clarksville | 조건부 해제 검토 | [호텔 페이지](https://www.marriott.com/en-us/hotels/bnacr-studiores-clarksville/overview/) |
| HGHFU | Fairfield by Marriott Hangzhou Fuyang | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/hghfu-fairfield-hangzhou-fuyang/overview/) |
| MGMSS | The St. James Hotel, Selma, Series by Marriott | 조건부 해제 검토 | [호텔 페이지](https://www.marriott.com/en-us/hotels/mgmss-the-st-james-hotel-selma-series/overview/) |
| IXMRT | The Fern Residency Thekkady, Series by Marriott | 조건부 해제 검토 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ixmrt-the-fern-residency-thekkady-series/overview/) |

| 코드 | 오늘 근거가 뒷받침하는 것 | 다음 확인 |
| --- | --- | --- |
| UKBCY | Marriott 실제 개장 발표·Bonvoy 참여 | 현재 예약 객실·운영자 해제 승인 |
| MRYCO | 공식 호텔 소개·Design Hotels 참여 | 실제 예약 객실·참여 효력일 |
| SFOPS | Design Hotels 참여·운영사 동일 호텔 | 표본 날짜와 예약 링크 불일치 해소·실제 예약 |
| BNACR | 운영사 개장 발표 검색 색인 재확인 | 발표/개장일·현재 객실 판매 |
| MGMSS | 호텔별 Bonvoy 참여 본문 | 참여 전환일·현재 객실 판매 |
| IXMRT | Fern 소개·Marriott 예약 연결 | 과거 일정/객실 수 상충 해소·실제 예약 |
| HGHFU | 소개와 오래된 rooms 예약 미개시 안내 상충 | 현재 안내 유효성·개장일·객실 판매; 보류 유지 |

강한 근거가 있는 UKBCY / MRYCO / SFOPS부터 다음 수동 승인 검토를 진행하는 것이 효율적입니다. 이번에는 해제하지 않았습니다.

## 3. 신규 후보 45개 전수 주소 재조회

| 코드 | 호텔 | 검토 결론 | 공식 근거 |
| --- | --- | --- | --- |
| ATQFM | The Fern Amritsar, GT Road, Series by Marriott | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/atqfm-the-fern-amritsar-gt-road-series/overview/) |
| BHMAC | AC Hotels by Marriott Downtown Birmingham | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/bhmac-ac-hotels-downtown-birmingham/overview/) |
| BHMLD | Element by Marriott Birmingham Downtown | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/bhmld-element-birmingham-downtown/overview/) |
| BLRXR | ARTEZIA | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/blrxr-artezia-bengaluru/overview/) |
| BNAOG | StudioRes by Marriott Oak Grove | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/bnaog-studiores-oak-grove/overview/) |
| BZEFG | Fort George, Belize, Autograph Collection | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/bzefg-fort-george-belize-autograph-collection/overview/) |
| BZNFW | Fairfield by Marriott Inn & Suites Bozeman West | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/bznfw-fairfield-inn-and-suites-bozeman-west/overview/) |
| CGOSM | Zhengzhou Marriott Hotel Shuanghe Lake | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/cgosm-zhengzhou-marriott-hotel-shuanghe-lake/overview/) |
| CKGDS | Sheraton Chongqing West | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ckgds-sheraton-chongqing-west/overview/) |
| CLEHM | The Legacy, Medina, a Tribute Portfolio Hotel | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/clehm-the-legacy-medina-a-tribute-portfolio-hotel/overview/) |
| CRPNW | Fairfield Inn & Suites Corpus Christi Northwest | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/crpnw-fairfield-inn-and-suites-corpus-christi-northwest/overview/) |
| CTGAC | AC Hotel by Marriott Cartagena Colombia | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ctgac-ac-hotel-cartagena-colombia/overview/) |
| CUNRA | BlueBay Grand Esmeralda, Riviera Maya, An All Inclusive Resort | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/cunra-bluebay-grand-esmeralda-riviera-maya-an-all-inclusive-resort/overview/) |
| DALDN | TownePlace Suites by Marriott Denton | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/daldn-towneplace-suites-denton/overview/) |
| DOYBP | 미확인 | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/doybp-four-points-binzhou/overview/) |
| DPSRB | The Royal Beach Seminyak Bali | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/dpsrb-the-royal-beach-seminyak-bali/overview/) |
| DSABF | Four Points Flex by Sheraton Doncaster | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/dsabf-four-points-flex-doncaster/overview/) |
| ECPER | StudioRes by Marriott Panama City East | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ecper-studiores-panama-city-east/overview/) |
| EJHAZ | The Ritz-Carlton, AMAALA | 확인 필요 | [호텔 페이지](https://www.ritzcarlton.com/en/hotels/ejhaz-the-ritz-carlton-amaala/overview/) |
| EWRPI | Residence Inn by Marriott Parsippany | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ewrpi-residence-inn-parsippany/overview/) |
| GPTWF | 미확인 | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/gptwf-fairfield-inn-and-suites-waveland/overview/) |
| GPTWT | TownePlace Suites by Marriott Waveland | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/gptwt-towneplace-suites-waveland/overview/) |
| HFESU | 미확인 | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/hfesu-fairfield-hefei-shushan-university-town/overview/) |
| HGHFA | Faery Xixi Hotel Hangzhou, a Member of Design Hotels™ | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/hghfa-faery-xixi-hotel-hangzhou-a-member-of-design-hotels/overview/) |
| HOUXW | City Express by Marriott Houston Northwest | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/houxw-city-express-houston-northwest/overview/) |
| HSVCT | 미확인 | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/hsvct-towneplace-suites-cullman/overview/) |
| HUZLF | Fairfield By Marriott Huizhou Longmen | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/huzlf-fairfield-huizhou-longmen/overview/) |
| IXBRD | 미확인 | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ixbrd-the-fern-denzong-hotel-and-spa-gangtok-series-/overview/) |
| IXKRS | The Fern Residency Somnath, Series by Marriott | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/ixkrs-the-fern-residency-somnath-series/overview/) |
| JANFF | Fairfield by Marriott Inn & Suites Flowood | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/janff-fairfield-inn-and-suites-flowood/overview/) |
| LASHT | TownePlace Suites by Marriott Henderson | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/lasht-towneplace-suites-henderson/overview/) |
| LKYMP | Mereshi Safari Camp Serengeti, Autograph Collection | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/lkymp-mereshi-safari-camp-serengeti-autograph-collection/overview/) |
| MCTCY | Courtyard by Marriott Nizwa Resort | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/mctcy-courtyard-nizwa-resort/overview/) |
| OKCXE | 미확인 | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/okcxe-city-express-oklahoma-city-south/overview/) |
| OOLAC | AC Hotel Gold Coast | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/oolac-ac-hotel-gold-coast/overview/) |
| SAVER | StudioRes by Marriott Savannah East | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/saver-studiores-savannah-east/overview/) |
| SDFRS | Residence Inn By Marriott Louisville South | 예약 미개시 안내 | [호텔 페이지](https://www.marriott.com/en-us/hotels/sdfrs-residence-inn-louisville-south/overview/) |
| SHAST | Four Points by Sheraton Shanghai Songjiang Thames Town | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/shast-four-points-shanghai-songjiang-thames-town/overview/) |
| SINHS | Hotel Stripes Singapore Chinatown, Autograph Collection | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/sinhs-hotel-stripes-singapore-chinatown/overview/) |
| SLCDF | Fairfield Inn by Marriott Salt Lake City Draper | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/slcdf-fairfield-inn-salt-lake-city-draper/overview/) |
| SYDEW | Emirates Wolgan Valley, a Ritz-Carlton Lodge | 예약 미개시 안내 | [호텔 페이지](https://www.ritzcarlton.com/en/hotels/sydew-emirates-wolgan-valley-a-ritz-carlton-lodge/overview/) |
| SZXPF | Four Points by Sheraton Shenzhen Futian CBD | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/szxpf-four-points-shenzhen-futian-cbd/overview/) |
| TVSLP | 미확인 | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/tvslp-four-points-tangshan-lubei/overview/) |
| UTPMA | MASON, a Member of Design Hotels™ | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/utpma-mason-a-member-of-design-hotels/overview/) |
| YYZBT | TownePlace Suites Barrie | 확인 필요 | [호텔 페이지](https://www.marriott.com/en-us/hotels/yyzbt-towneplace-suites-barrie/overview/) |

접근 실패 7개는 DOYBP / GPTWF / HFESU / HSVCT / IXBRD / OKCXE / TVSLP입니다. 공식 본문 접근 실패가 미영업·폐업을 뜻하지 않습니다.

다음 변화는 등록 결정과 분리해서 보존했습니다.

- BHMAC: 현재 반환 주소 2000 1st Ave North와 이전 주소 불일치. 이전 주소를 지우거나 다른 호텔과 합치지 않았습니다.
- BLRXR: 현재 공식 제목 ARTEZIA. 이전 Bengaluru 표기와 구분한 명칭 검토 후보입니다.
- GPTWT / MCTCY / SHAST: 이전 실패와 달리 이번에 본문이 반환됐습니다. 이 사실만으로 개장 완료를 승인하지 않았습니다. MCTCY에는 예약 미개시 안내가 있습니다.
- SINHS: 현재 Marriott 명칭에 Autograph Collection이 있지만 운영사 10월 1일 발표는 전환·변화 시작을 설명합니다. 완료일과 같은 뜻으로 취급하지 않습니다.
- SLCDF: 기존 SLCDR과 주소·전화가 달라 신규 코드를 기존 호텔과 자동 합치지 않습니다.
- UTPMA: MASON의 Design Hotels/Bonvoy 참여 근거는 있지만 날짜별 표본 요금이 오늘의 실시간 객실 재고를 증명하지 않습니다.

## 4. 공식 코드 수집 결과

| 항목 | 결과 |
| --- | ---: |
| 공식 코드 전체 | 10,399 |
| 수집 정책상 안전한 공식 코드 | 10,390 |
| 로컬 활성 호텔 | 10,306 |
| 기존 보류 | 88 |
| 신규 등록 검토 후보 | 45 |
| 검토 필요한 로컬 소스 이탈 | 19 |
| 수집 파일 / 실패 | 17 / 0 |
| 7월 26일 승인 snapshot 대비 추가 / 소스 누락 / slug 변경 | 124 / 23 / 45 |

소스 누락 23개와 로컬 소스 이탈 19개는 서로 다른 비교 대상입니다. 어느 쪽도 폐업 수가 아닙니다. ‘안전한 코드’는 제외 정책을 통과했다는 뜻이지 운영 완료 검증을 뜻하지 않습니다.

10월 3일 대비 propertyCode / slug / source 투영값은 동일했습니다. approved 7월 snapshot은 덮어쓰지 않았고 SHA-256은 기존 값과 같습니다.

## 5. 보안 경고 영향 — 배포 승인 아님

10월 3일 저장한 npm audit에는 패키지 경고 16개(critical 1 / high 11 / moderate 4)가 있습니다. 오늘 설치 버전과 실제 사용 경로를 대조했으나 **오늘 새로운 네트워크 npm audit를 실행한 결과는 아닙니다**. 16개는 독립 앱 취약점 16건이라는 의미가 아닙니다.

- 로컬 빌드에서 Server Actions·middleware·rewrites·dynamic routes는 비어 있습니다.
- next/og는 고정 JSX만 사용하고 업로드 Excel이나 요청 값이 들어가는 경로가 확인되지 않았습니다.
- Excel 파싱은 브라우저 내부 SheetJS 경로입니다. 개발·검사 도구의 glob / YAML / CSS / mock 입력을 Excel 내용과 연결하는 경로가 확인되지 않았습니다.
- 다만 next start 실행 경로가 남아 있고 output:export 설정은 없습니다. 정적 prerender 결과만으로 실제 Vercel의 함수·이미지 최적화·캐시 처리까지 없다고 단정할 수 없습니다.
- 따라서 Next·이미지 처리·캐시 경고는 실제 배포 경로 확인과 호환되는 업데이트 검토가 필요합니다. **테스트 통과나 도달 경로 미발견이 취약 패키지 수정 완료를 뜻하지 않습니다.**
- 파일 미전송 근거는 로컬 파서와 명시적 제보 payload 필드 제한을 함께 확인해야 합니다. CSP만으로 전송 내용까지 제한한다고 설명하면 부정확합니다.
- 일반 제보 응답은 no-cors 때문에 불투명합니다. 요청 전송 성공과 시트 저장 성공은 구분해야 합니다.

이번 보안 검토는 의존성 경고에 한정된 부분 검토입니다. 병렬 검토자의 최종 결과가 사용량 한도로 중단돼 전체 독립 보안감사를 완료했다고 주장하지 않습니다. 실제 배포 점검·최신 권고 조회·패키지 업데이트는 남아 있습니다. 패키지/lockfile은 변경하지 않았습니다.

## 6. 검토 파일과 테스트

- 승인 큐: data/marriott/reviews/2026-10-04-approval-queue.json
- 우선 호텔 근거: data/marriott/reviews/2026-10-04-priority-evidence.json
- 신규 45개 근거: data/marriott/reviews/2026-10-04-new-candidates-a.json 및 -b.json
- 회귀 테스트: lib/__tests__/marriottApprovalQueue.test.ts
- 이전 전체 호텔 근거: docs/hotel-db-verification-2026-10-03.md

새 테스트는 호텔 코드 누락/중복, 이전 근거 날짜 보존, 45개 조회 성공·실패 합계, 승인 전 등록·해제·삭제 금지, 3개와 제휴 종료 구분, approved snapshot 보존을 검사합니다.

최종 검증: 16개 테스트 파일 / 593개 테스트 통과, lint 통과, build 통과(정적 prerender). 커버리지는 Statements 98.72% / Branches 93.34% / Functions 100% / Lines 98.89%로 기준을 충족했습니다. UI/판정 경로 변경은 없으며 이번 검토에서 브라우저 E2E는 재실행하지 않았습니다.

보안 도구의 정식 보고서는 [부분 보안 검토 보고서](/Users/wonsikjung/.codex/state/plugins/codex-security/scans/shinhan-bonvoy-l5-checker/7971de99202ccf63cc11f16f4d33db58df0adb68_20261004T234407Z_oymeh7ix/report.md)에 저장됐습니다. [Coverage](/Users/wonsikjung/.codex/state/plugins/codex-security/scans/shinhan-bonvoy-l5-checker/7971de99202ccf63cc11f16f4d33db58df0adb68_20261004T234407Z_oymeh7ix/coverage.json)와 [manifest](/Users/wonsikjung/.codex/state/plugins/codex-security/scans/shinhan-bonvoy-l5-checker/7971de99202ccf63cc11f16f4d33db58df0adb68_20261004T234407Z_oymeh7ix/scan-manifest.json)는 범위·제약을 보존합니다.

점검 중 새 호텔 검토 자료와 테스트가 추가되어 도구는 ‘작업 트리가 변경됐으며 시작 시점 snapshot에 대한 결과로 저장됨’ 경고를 반환했습니다. 의존성·앱 소스는 이 검토에서 편집하지 않았지만, 이 보고서를 최종 전체 패치에 대한 보안 인증으로 사용하면 안 됩니다.

사용량: 도구가 반환한 codex_rollout 11개 대화 합산 값은 totalTokens 19,156,212 / inputTokens 19,060,856 / outputTokens 95,356 / cachedInputTokens 18,048,128입니다. 이 값은 이번 보안 작업만의 사용량이나 청구 비용을 뜻하지 않습니다. coverage 필드의 usage ‘complete’는 사용량 집계 범위이며 보안 소스 검토 completeness는 ‘partial’입니다.
