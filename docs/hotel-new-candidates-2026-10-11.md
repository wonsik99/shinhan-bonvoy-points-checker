# 신규 Marriott 호텔 45개 — 운영·참여 검토

정리 완료: 2026-10-11 · 기준 시간대: America/Detroit

이 문서는 3개 등록 전 검토 시점의 기록입니다. 이후 사용자의 명시적 승인으로
BLRXR·IXKRS·UTPMA를 로컬 seed에 추가했습니다. 현재 적용 상태와 테스트 결과는
[별도 로컬 패치 기록](hotel-db-local-patch-2026-10-11.md)을 참고하세요.
아래의 미등록45개·10,306개 seed·타입 오류4개 표시는 당시 검토 상태를 보존한 것입니다.

45개가 모두 현재 영업 중이라고 확인된 것은 아닙니다. 숙박 운영과 Marriott/Bonvoy 참여 근거를 함께 갖춘 **수동 승인 검토 후보는 3개**, 나머지 **42개는 확인 필요**입니다. 45개 모두 앱 활성 DB에는 미등록 상태를 유지했습니다.

이번 범위는 신규45개뿐입니다. 보류 해제7개(UKBCY, MRYCO, SFOPS, BNACR, HGHFU, MGMSS, IXMRT)는 조회·해제하지 않았습니다. 사용자가 활성 유지로 결정한 HGHHA·SZXLP·SHAFO도 변경하지 않았습니다. **활성 10,306개 전체의 운영 확인을 뜻하지 않습니다.**

## 먼저 볼 후보 3개

| 코드 | 수동 승인 검토 후보 | 근거와 남은 확인 |
| --- | --- | --- |
| BLRXR | ARTEZIA Bengaluru | [소유주](https://www.adarshdevelopers.com/projects/hospitality/artezia/)의 기존 호텔 운영·완공 설명, 현 Marriott/Bonvoy 안내, 실제 객실 요금. 기존 Shangri-La 별칭 중복과 전환 중 포인트 지급·혜택 조건은 확인 필요. |
| IXKRS | The Fern Residency Somnath | [운영사 포트폴리오](https://www.fernhotels.com/temple-towns/the-fern-residency-somnath), Marriott 호텔별 참여 안내, 실제 객실 요금. 10/9 재개장 발표 전재도 보조 근거지만 호텔 자체 게시 원문·정확한 실제 재개장일은 미확인. |
| UTPMA | MASON Pattaya | [운영사 숙박 안내](https://www.masonpattaya.com/special-offers/book-direct-beyond-fulfilling), [Design Hotels의 개별 Bonvoy 참여](https://www.designhotels.com/hotels/thailand/pattaya/mason/), 실제 객실 요금. 정확한 참여 시작일·기존 별칭 중복은 확인 필요. |

등록 승인이나 카드 특별적립 보장이 아닙니다. 사용자 승인과 중복 대조 후 별도 등록 패치를 검토할 수 있도록 후보만 추렸습니다. 모든 항목에 `readyForActivation:false`, `applied:false`를 유지했습니다.

## 확인일과 조회 범위

- **10/10:** 45개 공식 호텔 페이지를 실제 브라우저에서 모두 읽고, 운영사·소유주·공식 개발 자료 등을 개별 대조했습니다. 예약 미개시 안내는19개였습니다.
- **10/10:** BLRXR·IXKRS·UTPMA는 공개 객실·요금 목록까지 열어 호텔 헤더·주소를 대조했습니다. 객실이나 요금을 선택하지 않았고 예약도 제출하지 않았습니다.
- **10/11:** 같은45개 URL을 재조회했습니다. 본문 확인44개, 접근 차단 **YYZBT 1개**입니다. 읽힌44개 중 예약 미개시17개·안내 없음27개이며 차단된1개의 안내 상태는 **null/미확인**입니다.
- **10/11:** ATQFM·TVSLP는 1차 본문에서 어제의 예약 미개시 안내가 보이지 않았습니다. 실제 객실 확인을 위한 재접속은 두 페이지 모두403으로 차단되어 중단했습니다. 안내 부재만으로 승인 후보로 올리지 않았습니다.

10/11 전체 URL 재조회:12:31:15~12:33:43 UTC. 추가 확인 차단:12:34~12:35 UTC. 운영사 자료·객실 요금의 확인일을 오늘로 바꾸지 않았습니다. 전화·현장·실제 투숙 검증은 수행하지 않았습니다.

### 실제 객실 요금 관찰 — 10/10 확인

**2026-10-17 체크인~10-18 체크아웃, 1실·1인** 조건입니다. 조회 당시의 표시값이며 최종 결제액·당일 투숙·모든 날짜의 판매를 뜻하지 않습니다. 10/11에 새로 객실 재고를 조회한 값도 아닙니다.

| 코드 | 표시 객실 | 표시 시작 요금/박 |
| --- | --- | --- |
| BLRXR | Bangalore View 킹 / 트윈 | 각13,500 INR |
| IXKRS | Winter Green 킹 / 트윈 | 각6,750 INR |
| UTPMA | Garden Pool Villa / Duplex Grand Pool Villa | 11,700 / 17,100 THB |

10/10~11 당일 검색에서 Sold Out으로 표시된 경우와 다른 날짜의 해당 호텔 객실 요금을 구분했습니다. 검색 목록과 객실 목록의 표시값도 달라 검색 요약값을 최종 요금으로 쓰지 않았습니다. Sold Out은 폐업·미영업의 근거가 아닙니다.

## 45개 개별 결과

호텔 운영과 Marriott 참여는 별도 판단입니다. 신규 코드 등재·New 표시·시설 사진·일반 예약 버튼만으로 개장 완료를 판단하지 않았습니다.

| 코드 | 호텔·공식 페이지 | 숙박 운영 판단 | Marriott 참여 | 10/11 미개시 안내 | 결론·핵심 근거 |
| --- | --- | --- | --- | --- | --- |
| ATQFM | [The Fern Amritsar, GT Road, Series by Marriott](https://www.marriott.com/en-us/hotels/atqfm-the-fern-amritsar-gt-road-series/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 10/11 안내가 사라졌지만 추가 객실 확인은 접근 차단. 개장 준비 공고와 실제 운영 완료를 구분. |
| BHMAC | [AC Hotels by Marriott Downtown Birmingham](https://www.marriott.com/en-us/hotels/bhmac-ac-hotels-downtown-birmingham/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 운영사 공동 AC/Element 프로젝트 개장 준비 공고. 현재 완료 확인 필요. |
| BHMLD | [Element by Marriott Birmingham Downtown](https://www.marriott.com/en-us/hotels/bhmld-element-birmingham-downtown/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 공동 AC/Element 프로젝트 개장 준비 공고. 별도 호텔 코드로 유지. |
| BLRXR | [Artezia Bengaluru](https://www.marriott.com/en-us/hotels/blrxr-artezia-bengaluru/overview/) | 숙박 운영 근거 있음 | 참여 근거 있음 | 안내 없음¹ | 승인 검토: 소유주 기존 운영 설명 + 호텔별 Bonvoy + 실제 객실 요금. 전환 중 혜택 조건은 확인 필요. |
| BNAOG | [StudioRes by Marriott Oak Grove](https://www.marriott.com/en-us/hotels/bnaog-studiores-oak-grove/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 예약 미개시. 공사·개발 자료는 실제 완료 증거가 아님. |
| BZEFG | [Fort George, Belize, Autograph Collection](https://www.marriott.com/en-us/hotels/bzefg-fort-george-belize-autograph-collection/overview/) | 숙박 운영 근거 있음 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 기존 Fort George 영업 근거는 있지만 Autograph 전환 준비 문구가 남음. |
| BZNFW | [Fairfield by Marriott Inn & Suites Bozeman West](https://www.marriott.com/en-us/hotels/bznfw-fairfield-inn-and-suites-bozeman-west/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 미개시 | 확인 필요: Marriott가 Winter 2027 개장 계획을 명시. |
| CGOSM | [Zhengzhou Marriott Hotel Shuanghe Lake](https://www.marriott.com/en-us/hotels/cgosm-zhengzhou-marriott-hotel-shuanghe-lake/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 미개시 | 확인 필요: Marriott 명의 발표는 2026년 4분기 계획. 완료 발표 미확인. |
| CKGDS | [Sheraton Chongqing West](https://www.marriott.com/en-us/hotels/ckgds-sheraton-chongqing-west/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 연회 부문 시운영과 객실 일반 투숙·제휴 완료를 구분. |
| CLEHM | [The Legacy, Medina, a Tribute Portfolio Hotel](https://www.marriott.com/en-us/hotels/clehm-the-legacy-medina-a-tribute-portfolio-hotel/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 프로젝트 예정 자료는 있으나 개장 완료 미확인. |
| CRPNW | [Fairfield Inn & Suites Corpus Christi Northwest](https://www.marriott.com/en-us/hotels/crpnw-fairfield-inn-and-suites-corpus-christi-northwest/overview/) | 운영 확인 필요 | 참여 확인 필요 | 안내 없음¹ | 확인 필요: 과거 캐시 미개시 안내와 실페이지 안내 부재가 다름. 영업 확인 필요. |
| CTGAC | [AC Hotel by Marriott Cartagena Colombia](https://www.marriott.com/en-us/hotels/ctgac-ac-hotel-cartagena-colombia/overview/) | 운영 확인 필요 | 참여 확인 필요 | 안내 없음¹ | 확인 필요: 동일 주소 기존 Holiday Inn과 전환 완료 대조 필요. 스페인 동명 호텔 제외. |
| CUNRA | [BlueBay Grand Esmeralda, Riviera Maya, An All Inclusive Resort](https://www.marriott.com/en-us/hotels/cunra-bluebay-grand-esmeralda-riviera-maya-an-all-inclusive-resort/overview/) | 숙박 운영 근거 있음 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 기존 BlueBay 운영 근거는 있음. Marriott 예약 미개시와 참여 안내가 함께 있어 전환 확인 필요. |
| DALDN | [TownePlace Suites by Marriott Denton](https://www.marriott.com/en-us/hotels/daldn-towneplace-suites-denton/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 공사 완료 예정일을 실제 개장일로 사용하지 않음. 예약 미개시. |
| DOYBP | [Four Points by Sheraton Binzhou](https://www.marriott.com/en-us/hotels/doybp-four-points-binzhou/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: Binzhou 본문·주소 확인. 예약 미개시. |
| DPSRB | [The Royal Beach Seminyak Resort Bali, Autograph Collection](https://www.marriott.com/en-us/hotels/dpsrb-the-royal-beach-seminyak-bali/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 미개시 | 확인 필요: 기존 빌라 구역 일부 운영과 Autograph 개장을 구분. Marriott 계획은 2027년 2분기. |
| DSABF | [Four Points Flex by Sheraton Doncaster](https://www.marriott.com/en-us/hotels/dsabf-four-points-flex-doncaster/overview/) | 숙박 운영 근거 있음 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 기존 Doncaster 영업 근거는 있음. '15th October' 전환 예고는 연도 미확인. |
| ECPER | [StudioRes by Marriott Panama City East](https://www.marriott.com/en-us/hotels/ecper-studiores-panama-city-east/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: Panama City East 주소의 개발 자료만 연결. 예약 미개시. |
| EJHAZ | [The Ritz-Carlton, AMAALA](https://www.ritzcarlton.com/en/hotels/ejhaz-the-ritz-carlton-amaala/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: AMAALA 다른 리조트 개장을 해당 Ritz-Carlton 개장으로 사용하지 않음. |
| EWRPI | [Residence Inn by Marriott Parsippany](https://www.marriott.com/en-us/hotels/ewrpi-residence-inn-parsippany/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 미개시 | 확인 필요: 운영사 공사 중 분류. 신규 주소와 과거 Residence Inn 구분. |
| GPTWF | [Fairfield Inn & Suites by Marriott Waveland](https://www.marriott.com/en-us/hotels/gptwf-fairfield-inn-and-suites-waveland/overview/) | 운영 확인 필요 | 참여 확인 필요 | 안내 없음¹ | 확인 필요: 539 US 90 신규 Fairfield. 개발·듀얼 브랜드 자료만으로 영업 확인 불가. |
| GPTWT | [TownePlace Suites by Marriott Waveland](https://www.marriott.com/en-us/hotels/gptwt-towneplace-suites-waveland/overview/) | 운영 확인 필요 | 참여 확인 필요 | 안내 없음¹ | 확인 필요: 535 US 90 별도 TownePlace. 개장 완료 미확인. |
| HFESU | [Fairfield by Marriott Hefei Shushan University Town](https://www.marriott.com/en-us/hotels/hfesu-fairfield-hefei-shushan-university-town/overview/) | 운영 확인 필요 | 참여 확인 필요 | 안내 없음¹ | 확인 필요: 과거 사진 색인 안내와 최신 본문이 달라 영업 확인 필요. |
| HGHFA | [Faery Xixi Hotel Hangzhou, a Member of Design Hotels™](https://www.marriott.com/en-us/hotels/hghfa-faery-xixi-hotel-hangzhou-a-member-of-design-hotels/overview/) | 운영 확인 필요 | 참여 확인 필요 | 안내 없음¹ | 확인 필요: 과거 독립 호텔 영업 자료는 있지만 현재 Marriott 참여·운영 완료 미확인. |
| HOUXW | [City Express by Marriott Houston Northwest](https://www.marriott.com/en-us/hotels/houxw-city-express-houston-northwest/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 동일 주소 Best Western 자료와 Marriott 전환을 추가 대조해야 함. |
| HSVCT | [TownePlace Suites by Marriott Cullman](https://www.marriott.com/en-us/hotels/hsvct-towneplace-suites-cullman/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 예약 미개시. 인근 Fairfield의 영업 자료를 대신 사용하지 않음. |
| HUZLF | [Fairfield By Marriott Huizhou Longmen](https://www.marriott.com/en-us/hotels/huzlf-fairfield-huizhou-longmen/overview/) | 운영 확인 필요 | 참여 근거 있음 | 안내 없음¹ | 확인 필요: 호텔별 Bonvoy 설명은 있음. 10/9 개장 준비 조달 신호와 실제 개장 완료 구분. |
| IXBRD | [The Fern Denzong Hotel & Spa Gangtok, Series by Marriott](https://www.marriott.com/en-us/hotels/ixbrd-the-fern-denzong-hotel-and-spa-gangtok-series-/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 기존 Fern 호텔 실체와 Marriott 제휴 효력 구분. 예약 미개시. |
| IXKRS | [The Fern Residency Somnath, Series by Marriott](https://www.marriott.com/en-us/hotels/ixkrs-the-fern-residency-somnath-series/overview/) | 숙박 운영 근거 있음 | 참여 근거 있음 | 안내 없음¹ | 승인 검토: 10/9 재개장 발표 전재 + 현재 Marriott 호텔별 참여 안내 + 실제 객실 요금. |
| JANFF | [Fairfield by Marriott Inn & Suites Flowood](https://www.marriott.com/en-us/hotels/janff-fairfield-inn-and-suites-flowood/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 예약 미개시. FDD는 2024년 말 기준 과거 자료이며 실제 개장일 아님. |
| LASHT | [TownePlace Suites by Marriott Henderson](https://www.marriott.com/en-us/hotels/lasht-towneplace-suites-henderson/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 예약 미개시. 과거 FDD·공사 자료와 기존 LASHN 호텔 구분. |
| LKYMP | [Mereshi Safari Camp Serengeti, Autograph Collection](https://www.marriott.com/en-us/hotels/lkymp-mereshi-safari-camp-serengeti-autograph-collection/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 소유주 10월 개발 중·운영사 11월 예정 자료. 완료 미확인. |
| MCTCY | [Courtyard by Marriott Nizwa Resort](https://www.marriott.com/en-us/hotels/mctcy-courtyard-nizwa-resort/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: Nizwa 본문 예약 미개시. 설계·채용 자료는 완료 증거가 아님. |
| OKCXE | [City Express By Marriott Oklahoma City South](https://www.marriott.com/en-us/hotels/okcxe-city-express-oklahoma-city-south/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 동일 주소 Comfort Inn과 Marriott 전환 구분. 예약 미개시. |
| OOLAC | [AC Hotel Gold Coast](https://www.marriott.com/en-us/hotels/oolac-ac-hotel-gold-coast/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 2026년 4분기 계획·개장 준비팀 자료. 기존 Vibe 운영을 전환 완료로 쓰지 않음. |
| SAVER | [StudioRes by Marriott Savannah East](https://www.marriott.com/en-us/hotels/saver-studiores-savannah-east/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 과거 캐시 미개시와 실페이지 안내 부재가 다름. 완료 확인 필요. |
| SDFRS | [Residence Inn By Marriott Louisville South](https://www.marriott.com/en-us/hotels/sdfrs-residence-inn-louisville-south/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 과거 캐시 미개시와 10/10·10/11 실페이지 안내 부재가 상충. 현재는 영업 확인 필요. |
| SHAST | [Four Points by Sheraton Shanghai Songjiang Thames Town](https://www.marriott.com/en-us/hotels/shast-four-points-shanghai-songjiang-thames-town/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 공식 개장 목록은 날짜가 비어 있음. 소개·시설만으로 현재 영업 판단 안 함. |
| SINHS | [Hotel Stripes Singapore Chinatown, Autograph Collection](https://www.marriott.com/en-us/hotels/sinhs-hotel-stripes-singapore-chinatown/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 10/1 YTL 운영 체제 전환·변화 시작과 Autograph 개장·편입 완료를 구분. |
| SLCDF | [Fairfield Inn by Marriott Salt Lake City Draper](https://www.marriott.com/en-us/hotels/slcdf-fairfield-inn-salt-lake-city-draper/overview/) | 운영 확인 필요 | 참여 확인 필요 | 안내 없음¹ | 확인 필요: 별도 주소의 신규 Fairfield. 기존 SLCDR 영업 자료 사용 안 함. |
| SYDEW | [Emirates Wolgan Valley, a Ritz-Carlton Lodge](https://www.ritzcarlton.com/en/hotels/sydew-emirates-wolgan-valley-a-ritz-carlton-lodge/overview/) | 예약 미개시·운영 확인 필요 | 개시·전환 확인 필요 | 미개시 | 확인 필요: 예약 미개시. 과거 2026년 중반 계획과 실제 개장 완료 구분. |
| SZXPF | [Four Points by Sheraton Shenzhen Futian CBD](https://www.marriott.com/en-us/hotels/szxpf-four-points-shenzhen-futian-cbd/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 신규 Futian CBD 코드. 기존 Shenzhen Four Points 자료 대신 사용 안 함. |
| TVSLP | [Four Points by Sheraton Tangshan, Lubei](https://www.marriott.com/en-us/hotels/tvslp-four-points-tangshan-lubei/overview/) | 운영 확인 필요 | 개시·전환 확인 필요 | 안내 없음¹ | 확인 필요: 10/11 안내가 사라졌지만 추가 객실 확인은 접근 차단. 영업·참여 개시 확인 필요. |
| UTPMA | [MASON, a Member of Design Hotels™](https://www.marriott.com/en-us/hotels/utpma-mason-a-member-of-design-hotels/overview/) | 숙박 운영 근거 있음 | 참여 근거 있음 | 안내 없음¹ | 승인 검토: 운영사 현행 숙박·재방문 자료 + Design Hotels 개별 Bonvoy 참여 + 실제 객실 요금. |
| YYZBT | [TownePlace Suites Barrie](https://www.marriott.com/en-us/hotels/yyzbt-towneplace-suites-barrie/overview/) | 개장·전환 계획(완료 미확인) | 개시·전환 확인 필요 | 차단·미확인 | 확인 필요: 10/10 본문과 공사·개장 예정 자료를 보존. 10/11 조회는 접근 차단으로 최신 상태 미확인. |

¹ 안내 없음은 1차 본문에서 미개시 문구를 관찰하지 못했다는 뜻일 뿐 현재 영업·즉시 예약·제휴 완료의 증명이 아닙니다. ATQFM·TVSLP는 이후 추가 확인이 차단됐습니다.

## 혼동하지 말아야 할 근거

- **기존 호텔 영업 ≠ 새 Marriott 참여 완료:** BZEFG(Fort George)·CUNRA(BlueBay)·DSABF(Doncaster)는 기존 영업 근거가 있지만 전환 완료가 미해결입니다. 동일 주소의 IHG/Choice/Best Western 자료가 남는 CTGAC·OKCXE·HOUXW도 구분했습니다.
- **일부 영업 ≠ 브랜드 개장:** DPSRB는 기존 빌라 구역 일부 운영 근거가 있지만 [Marriott 공식 개장 목록](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi)은 Autograph 개장을2027년2분기로 안내합니다. CKGDS의 연회 부문 시운영도 일반 투숙·참여 완료로 쓰지 않았습니다.
- **계획 ≠ 완료:** BZNFW의 Winter2027, CGOSM의2026년4분기, LKYMP의10월/11월 계획은 일정 자료입니다. DSABF의 “15th October”는 연도 미확인 그대로 보존했습니다. 계획이 지났다는 이유로 실제 개장일을 채우지 않았습니다.
- **캐시 ≠ 최신 실페이지:** SDFRS의 과거 캐시 미개시와10/10·10/11 실페이지 안내 부재를 함께 보존하고 현재 운영 확인 필요로 정리했습니다. IXKRS는 과거 rooms·힌디어 캐시의 미개시를 보존하되 실제 객실 요금과 최근 재개장 신호를 더해 승인 검토 후보로 상향했습니다. [10/9 재개장 기사](https://hospitality.economictimes.indiatimes.com/news/hotels/the-fern-hotels-resorts-announces-the-relaunch-of-the-fern-residency-somnath-series-by-marriott/134829406)는 호텔측 발표 전재이며 자체 게시 원문으로 표시하지 않았습니다.
- **오래된 FDD ≠ 현재 영업 상태:** JANFF·LASHT FDD 발행일2025-03-31은 PDF 표지를 직접 읽은 값입니다. 호텔 목록의 기준일은2024-12-31이며 오늘의 미영업 증거·실제 개장일로 사용하지 않았습니다.
- **다른 호텔 ≠ 신규 코드:** 스페인 AC Cartagena, 기존 SLCDR·LASHN·JANFA, 인근 Fairfield Cullman, AMAALA 다른 리조트 자료를 해당 신규 호텔의 운영 근거로 빌리지 않았습니다.

예약 미개시17개는 운영·참여 판단과 중복되는 **별도 관찰**입니다. 승인 검토3개·확인 필요42개에 더해 합산하면 안 됩니다. 폐업·제휴 종료로 삭제하자는 제안은0개지만, 모든 호텔이 영업한다는 뜻은 아닙니다. 정확한 개장일·참여 시작일은 전부 미확인으로null입니다.

## 그대로 둔 것과 다음 순서

활성 seed10,306개·보류88개·기존 승인 snapshot·분류 규칙을 유지했습니다. 신규45개는 활성 DB에도 보류 DB에도 추가하지 않았고 보류 해제7개도 그대로입니다. 자동 등록·해제·삭제, 커밋·push·배포, 수집기 변경은 하지 않았습니다. 주요11개 파일의 작업 전후 SHA-256도 일치합니다. 기존7/26 승인 snapshot과10/4 고정 리뷰·승인 큐는 덮어쓰지 않았습니다.

1. 먼저 위3개 후보의 미해결 조건을 읽습니다. 특히 BLRXR의 전환 중 혜택 조건을 확인하고, 실제 반영은 별도 사용자 승인 후 진행합니다.
2. ATQFM·TVSLP는 접근 가능해졌을 때 실제 객실 또는 공식 운영 완료 안내를 우선 대조할 항목으로 남깁니다. 지금은 등록하지 않습니다.
3. BZEFG·CUNRA·DSABF는 Marriott 참여·전환 완료 근거를 우선 확인합니다. 나머지 예정·미확인 항목도 근거 확보 전 미등록을 유지합니다. 보류 해제7개는 별도 요청 전 그대로 둡니다.

## 검토 파일과 테스트

- [기계 판독 검토자료](../data/marriott/reviews/2026-10-11-new-candidates.json):45개 코드/index, 초기 판단과 부모 추가 판단, 날짜별 실페이지·차단 관찰,252개 근거 항목을 담았습니다. 추적 URL·브라우저 세션 식별자는 싣지 않았습니다.
- [자료 검증 테스트](../lib/__tests__/marriottNewCandidatesReview.test.ts):범위·중복·확인일·차단의null처리·승인 검토 조건·미등록/보류 유지·보고서 누락을 검사합니다.
- 비공개 조사 기록·원문 브라우저 로그는 gitignore된 `docs/_local/`에 보관합니다.

테스트는 검토자료와 DB 비변경 조건을 검사하며 호텔의 실제 영업이라는 외부 사실을 자동으로 증명하지 않습니다.

### 이번 검증 결과

- `npm test`: 601개 테스트,17개 파일 통과. 이번 자료 검증8개도 포함합니다.
- `npm run lint`: 통과.
- `git diff --check`: 통과. 주요11개 파일 SHA-256: 전후 일치.
- `npx tsc --noEmit`: 실패. 이번에 수정하지 않은 `lib/__tests__/marriottUpdateMonitor.test.ts`의221·267·317·358행에서 `TS2322` 오류4개가 반환됐습니다(객체가 `never`에 할당된다는 타입 오류). 이번 호텔 검토 범위에서는 수정하지 않았으며 별도 타입 정리가 필요합니다. 타입 검사까지 모두 통과한 상태는 아닙니다.
- 앱 UI·판정·패키지·배포를 변경하지 않아 새 E2E나 배포 빌드는 실행하지 않았습니다. 테스트·린트 통과를 빌드나 운영 서비스 검증 통과로 표시하지 않습니다.

이번에 추가한 공개 검토 파일은 이 보고서,10/11 신규45개 JSON,해당 자료 검증 테스트3개뿐입니다. 기존 dirty patch는 보존했습니다. 브라우저 자동 생성 로그는 저장소 루트에서 gitignore된 `docs/_local/new45-playwright-2026-10-10-11/`로 옮겨 보관했으며 삭제하지 않았습니다.

