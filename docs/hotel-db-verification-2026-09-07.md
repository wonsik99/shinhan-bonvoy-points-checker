# Marriott 보류·소스 이탈 104개 개별 검토 — 2026-09-07

검토 기준: 2026-09-07, Asia/Seoul. 사용자 지정 범위는 **보류 88개 + 미검토 소스 이탈 16개**입니다. 활성 호텔 10,306개 전체를 개별 실사한 결과가 아닙니다.

104개 모두 개별 접근 시도와 후속 공개 자료 검토를 마쳤습니다. 다만 **104개 모두 현재 운영·예약 가능을 확인했다는 뜻은 아닙니다.** 개별 예약 엔진의 실시간 재고 조회나 전화 확인은 수행하지 않았고, 확인되지 않은 사항은 아래 각 호텔에 남겼습니다.

## 결론

| 검토 제안 | 호텔 수 | 코드 |
| --- | ---: | --- |
| 보류 해제 후보 | 3 | BNACR, MRYCO, SFOPS |
| 조건부 보류 해제 검토 | 2 | RDURS, IXMRT |
| 현재 활성 제외 후보 | 2 | ATLBH, MIAWS |
| 확인 필요 보류 전환 후보 | 2 | HGHHA, SZXLP |
| 활성 유지·소스 예외 검토 후보 | 6 | CULXC, BOMFP, MUCAT, JANCY, LWCKS, SRQSH |
| 활성 현 상태 유지·확인 필요 | 6 | BJSLY, TAOZY, XIYCW, NBOMM, DAYLM, RSWNS |
| 보류 유지 | 83 | 아래 83개 전체 목록 |

이 문서와 [기계 검토용 JSON](../data/marriott/reviews/2026-09-07-verification.json)은 **미승인 제안**입니다. 이번 검토에서는 활성 seed, 보류 파일, 소스 예외, 승인 snapshot을 자동 변경하지 않았습니다. 이전 로컬 패치는 그대로 보존했으며 커밋·push·배포도 하지 않았습니다.

## 우선 검토할 사항

1. **MIAWS / W South Beach — 현재 활성 제외 우선 후보.** 소유주 FAQ는 Marriott 운영 마지막 날을 **2026-08-19**로 명시합니다. Hilton의 공식 전환 발표도 같은 2201 Collins Avenue 자산임을 확인합니다. 옛 Marriott 소개와 두 달 전 요금은 현재 제휴 근거가 아닙니다. [소유주 공지](https://2201collins.org/), [Hilton 공식 발표](https://stories.hilton.com/releases/waldorf-astoria-hotels-resorts-to-debut-in-miami-beach)
2. **ATLBH / 옛 Residence Inn Atlanta Buckhead — 현재 활성 제외 후보, 종료일은 확인 필요.** 2960 Piedmont Road NE는 현재 Fusion Buckhead 아파트 임대 목록과 일치합니다. 같은 이름의 **ATLLP는 2220 Lake Boulevard NE의 별개 호텔**이므로 코드나 별칭을 단순 병합하지 않아야 합니다. [현재 임대 목록](https://www.zillow.com/apartments/atlanta-ga/fusion-buckhead/9Ptpkw/), [다른 호텔 ATLLP](https://www.marriott.com/en-us/hotels/atllp-residence-inn-atlanta-buckhead/overview/)
3. **BNACR·MRYCO·SFOPS — 보류 해제 후보.** 해당 호텔의 Marriott 표본 객실 요금과 운영사 개장 공지 또는 공식 브랜드의 Bonvoy 참여 안내를 함께 확인했습니다. 미래 숙박일 요금은 오늘의 실시간 재고를 보장하지 않으며, 수동 승인과 별칭 회귀 테스트가 남아 있습니다.
4. **RDURS·IXMRT — 요금만으로 해제하지 않음.** RDURS는 운영사 개장 준비 공지가 남아 있고, IXMRT는 운영사·객실 요금과 Marriott의 2027년 3분기 개장 안내가 상충합니다.
5. **HGHHA·SZXLP — 확인 필요 보류 전환 후보.** 활성 seed에 있지만 공식 자료에 개장 예정 정황이 있습니다. HGHHA의 2027년 1월 일정은 오래된 공식 색인이므로 현재 일정으로 단정하지 않습니다.

MIAWS·ATLBH를 실제 제외할 때는 과거 거래의 Marriott 판정을 보존할 날짜 정책이 먼저 필요합니다. 현재 분류 함수는 가맹점명만 받습니다. seed 행만 삭제하면 일반 W/Residence Inn 브랜드 규칙이나 동명 호텔 별칭이 다시 매칭될 수 있으므로, 과거·종료 후 거래 및 ATLBH/ATLLP 구분 회귀 테스트를 함께 설계해야 합니다. 이번 범위에서 새 날짜 판정 구조를 구현하거나 과거 호텔 이력을 지우지 않았습니다.

## 공식 소스 재수집 상태

- 수집 완료: 2026-09-06T20:00:13.497Z (한국시간 2026-09-07 05:00).
- 공식 코드 10,357개, 비교 대상 10,348개, 소스 파일 17개, 수집 실패 0개.
- 7월 26일 승인 기준 대비 신규 코드 79개, 소스 이탈 20개, URL slug 변경 36개.
- 기존 패치 반영 상태: 활성 10,306개, 보류 88개, 승인된 소스 누락 예외 21개, 미검토 소스 이탈 16개.
- 처리되지 않은 신규 등록 후보는 0개입니다. 보류 중인 79개 코드가 공식 소스에 존재하며, 나머지 보류 9개는 소스에도 없습니다.
- 결과는 `review_required`이며 수집 장애가 아닙니다. 기본 `hotels:check`의 종료 코드는 0이고, `--fail-on-official-change`로 공식 변경을 알릴 때는 2입니다. 소스 무결성 실패인 `blocked`는 1입니다. (2026-10-03 설명 정정)
- 위 104개를 검토한 **문서 작성**과 16개를 소스 예외로 **승인·반영**하는 것은 다릅니다. 자동 반영하지 않았으므로 재실행해도 미검토 16개가 남는 것이 현재 기대 동작입니다.
- 원본 수집 산출물: `.marriott-reports/2026-09-07-verification/` (gitignore). GitHub Actions의 원격 실행·artifact 보관 상태 전체를 검증한 결과는 아닙니다.

| 고정 입력 / 산출물 | SHA-256 |
| --- | --- |
| 변경하지 않은 승인 snapshot | `d383fa1d6c8e9520ad704aa657c9b3aaffcc6a2f01644ba3e886be71dc12c1d8` |
| 오늘 수집 snapshot | `39de1cc2e3cbaeb66822cbe7c4dfc9324c494ae7409fe019fb05eed82722b01c` |
| 검토 시작 시 보류 파일 | `85143d3b74921587b67800a5efe7f5489a8155f4f159dbbeb37bc14fa400d32a` |
| 104개 대상 코드·분류 manifest | `9e198f35a7e878f6d457e4e611f9bb94d5efa292019c95d429943ec45dae0b78` |

## 근거 해석과 한계

- 아래 자료 신선도는 웹 도구가 반환한 **원래 상대 시간**입니다. 오늘 방문·조회했다는 사실과 원문의 작성일, 검색 색인 갱신일, 실제 호텔 영업 확인일은 다릅니다.
- 첫 호텔 페이지 조회 104건 중 29건은 조회 오류였습니다. 다른 언어 경로, 공식 목적지 목록, 운영사·브랜드 공지 등으로 후속 확인했습니다. 오류를 폐업으로 간주하거나 접근 차단을 우회하지 않았습니다.
- 표본일 매진, 요금 불가, 예약 버튼, 시설 소개, 사이트맵 존재만으로 개장 완료를 판단하지 않았습니다. 공항 교통비·주차비나 인접 호텔 요금도 객실 요금에서 제외했습니다.
- BOMFP·JANCY의 리노베이션, DAYLM·LWCKS의 일부 시설 휴장, SRQSH 부동산 매물의 거래 완료 표기를 호텔 전체 폐업으로 해석하지 않았습니다.
- 번호별 근거의 구체적 관찰 내용, 최초 접근 결과, 미확인 사항은 JSON에 기록했습니다. 모든 항목은 `applied: false`입니다.

## 104개 전체 개별 결과

표의 보류 상태 변경은 **제안**이며 아직 적용하지 않았습니다. 보류 유지 83개 중 36개는 기존 사유와 오늘 확보한 근거를 구분하기 위해 상태 설명 정리가 필요합니다. `예약 미개시 안내`는 공식 페이지 문구를 확인했다는 뜻이며, 특정 날짜 매진과 다릅니다.

### 보류 해제 후보 — 3개

| 코드 · 호텔 | 개별 검토 / 남은 확인 | 근거 · 자료 신선도 |
| --- | --- | --- |
| **BNACR** · StudioRes by Marriott Clarksville | 공식 목적지 목록에서 해당 호텔의 숫자 요금이 확인됐고, 운영사 HMC의 공식 계정이 Clarksville 개장·손님 맞이를 발표했습니다. 보류 해제 검토 근거가 충분합니다. 남은 확인: 수동 승인 후 seed·별칭 충돌 회귀 테스트. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/tennessee/extended-stay-hotels.mi) (yesterday)<br>[2. 운영사 공지](https://www.linkedin.com/posts/hotel-management-and-consulting_hmc-studiores-marriott-activity-7496673233405108224-xVWc) (last week) |
| **MRYCO** · Le Petit Pali at Ocean Ave, a Member of Design Hotels | 공식 Marriott 목적지 목록에 해당 호텔 숫자 요금이 표시되고, Design Hotels가 Marriott Bonvoy 예약 참여를 명시합니다. Ocean Ave와 별도 호텔인 8th Ave를 구분해 보류 해제 후보로 제안합니다. 남은 확인: 수동 승인 후 Ocean Ave/8th Ave 별도 ID·별칭 충돌 확인. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/california/monterey.mi) (yesterday)<br>[2. 공식 브랜드 호텔](https://www.designhotels.com/hotels/usa/california/carmel-by-the-sea/le-petit-pali-at-ocean-ave/) (3 days ago) |
| **SFOPS** · Palihotel San Francisco, a Member of Design Hotels | 운영사 Palisociety의 현재 호텔·객실 소개, Design Hotels의 Bonvoy 참여 안내, Marriott의 해당 호텔 숫자 요금을 함께 확인했습니다. 보류 해제 후보로 제안합니다. 남은 확인: 수동 승인 후 seed·별칭 충돌 회귀 테스트. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/california/san-francisco.mi) (4 days ago)<br>[2. 운영사 호텔](https://www.palisociety.com/hotels/san-francisco) (today)<br>[3. 공식 브랜드 호텔](https://www.designhotels.com/hotels/usa/california/san-francisco/palihotel-san-francisco/) (today) |

### 조건부 보류 해제 검토 — 2개

| 코드 · 호텔 | 개별 검토 / 남은 확인 | 근거 · 자료 신선도 |
| --- | --- | --- |
| **RDURS** · StudioRes by Marriott Raleigh Northeast | 공식 목록에 87 USD 객실 요금이 보입니다. 다만 운영사 채용 공지는 8월 27일 개장 예정과 개장 준비 문구가 남아 있어 실제 개장 완료 확인이 부족합니다. North/Northeast 표시명과 %09가 포함된 구 URL도 함께 검토해야 합니다. 남은 확인: 운영사 실제 개장 완료 확인; 같은 코드의 North/Northeast 공식 표시명 정리. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/north-carolina/durham-north-carolina/new-hotels.mi) (last week)<br>[2. 운영사 채용](https://www.linkedin.com/jobs/view/front-desk-clerk-new-studiores-marriott-raleigh-north-at-concord-hospitality-enterprises-4455055561) (last week)<br>[3. Marriott 호텔](https://www.marriott.com/en-gb/hotels/rdurs-studiores-raleigh-north%09/overview/) (4 days ago) |
| **IXMRT** · The Fern Residency Thekkady, Series by Marriott | Marriott 목록에 4,200 INR 객실 요금과 운영사 Fern의 Series by Marriott 소개가 있습니다. 그러나 Marriott 개장 안내는 2027년 3분기여서 공식 자료가 상충합니다. 예약 요금만으로 보류를 해제하지 않습니다. 남은 확인: Marriott 또는 Fern의 실제 전환·개장 완료일 확인; 2027년 3분기 안내가 오류/다른 단계인지 확인. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/india/family-friendly-hotels.mi?pg=3) (yesterday)<br>[2. 운영사 호텔](https://www.fernhotels.com/jungle-safaris-forest-resorts-wildlife-sanctuaries/the-fern-residency-thekkady-series-by-marriott) (yesterday)<br>[3. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |

### 현재 활성 제외 후보 — 2개

| 코드 · 호텔 | 개별 검토 / 남은 확인 | 근거 · 자료 신선도 |
| --- | --- | --- |
| **ATLBH** · Residence Inn by Marriott Atlanta Buckhead | 옛 ATLBH 주소 2960 Piedmont Road NE에 Fusion Buckhead 아파트의 현재 임대 목록이 존재하고, 해당 관리사 공식 링크 목록에도 아파트가 있습니다. 같은 이름의 ATLLP는 2220 Lake Boulevard NE로 별개 호텔입니다. ATLBH의 현재 활성 제외 후보이며 정확한 Marriott 종료일은 추가 확인이 필요합니다. 남은 확인: 정확한 호텔 운영·Marriott 제휴 종료일; 과거 결제를 보존할 날짜 정책; ATLLP와 공통 이름 별칭 충돌 해소. | [1. Marriott 과거 페이지](https://www.marriott.com/hotels/travel/atlbh-residence-inn-atlanta-buckhead/) (2 months ago)<br>[2. 관리사 임대 목록](https://www.zillow.com/apartments/atlanta-ga/fusion-buckhead/9Ptpkw/) (2 weeks ago)<br>[3. 운영사 프로필](https://linktr.ee/lifeatlpm) (last week)<br>[4. Marriott 호텔](https://www.marriott.com/en-us/hotels/atllp-residence-inn-atlanta-buckhead/overview/) (today) |
| **MIAWS** · W South Beach | 소유주 공지는 Marriott 운영 마지막 날을 2026-08-19로 명시하고 신규 호텔 예약 중단을 안내합니다. Hilton도 같은 2201 Collins Avenue 자산의 Waldorf Astoria 전환을 공식 발표했습니다. 오래된 Marriott 페이지·요금보다 이 근거를 우선해 현재 활성 제외 후보로 제안합니다. 남은 확인: 과거 Marriott 이용 결제를 보존할 날짜 정책; 제외 후에도 일반 W 브랜드 키워드가 다시 매칭되지 않는지 회귀 검증. | [1. 소유주 공지](https://2201collins.org/) (today)<br>[2. 후속 브랜드 공지](https://stories.hilton.com/releases/waldorf-astoria-hotels-resorts-to-debut-in-miami-beach) (today)<br>[3. Marriott 과거 요금](https://www.marriott.com/en-us/destinations/united-states/florida/hollywood/ev-charging-hotels.mi) (2 months ago) |

### 확인 필요 보류 전환 후보 — 2개

| 코드 · 호텔 | 개별 검토 / 남은 확인 | 근거 · 자료 신선도 |
| --- | --- | --- |
| **HGHHA** · Aloft Huzhou | 공식 Aloft 구 브랜드 목록의 검색 색인은 2027년 1월 개장 예정으로 표시합니다. 현재 개별 페이지는 존재하나 표본일은 매진이며 새 브랜드 목록에서는 이름·일정을 재확인하지 못했습니다. 과거 색인의 일정일 수 있어 확인 필요 보류 전환 후보로 제안합니다. 남은 확인: 2027년 1월 일정의 현재 유효성; 실제 개장 및 Marriott 예약 개시. | [1. Marriott 과거 일정](https://aloft-hotels.marriott.com/ru-RU/lokaciyi/) (2 months ago)<br>[2. Marriott 호텔](https://www.marriott.com/en-us/hotels/hghha-aloft-huzhou/overview/) (4 days ago)<br>[3. Marriott 목록](https://www.marriott.com/en-us/destinations/china/wuxi/pet-friendly-hotels.mi) (last week) |
| **SZXLP** · Four Points by Sheraton Shenzhen Longhua | 공식 개별 소개·주소는 있으나 최근 목적지 목록에 개장 예정 표시가 남아 있고 날짜·요금은 제공되지 않습니다. 운영 확인 seed로 유지할 근거가 부족해 확인 필요 보류 전환 후보로 제안합니다. 남은 확인: 날짜 없는 개장 예정 표시의 실제 일정; 현재 투숙 운영 및 예약 개시. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/szxlp-four-points-shenzhen-longhua/overview/) (5 days ago)<br>[2. Marriott 목록](https://www.marriott.com/en-us/destinations/china/huizhou/fitness-center-hotels.mi) (last week) |

### 활성 유지·소스 예외 검토 후보 — 6개

| 코드 · 호텔 | 개별 검토 / 남은 확인 | 근거 · 자료 신선도 |
| --- | --- | --- |
| **CULXC** · City Express by Marriott Culiacán | 공식 개별 페이지와 Culiacán 목적지 관련 목록에 호텔 정보가 남아 있습니다. 과거 색인에는 숫자 요금이 있지만 오늘 예약 재고는 검증하지 못했습니다. 삭제 근거는 없으며 최신 예약 확인 후 소스 누락 예외 검토가 가능합니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/culxc-city-express-culiacan/overview/) (last week)<br>[2. Marriott 과거 요금](https://www.marriott.com/en-us/destinations/mexico/fitness-center-hotels.mi?pg=3) (2 months ago) |
| **BOMFP** · Four Points by Sheraton Navi Mumbai, Vashi | 현재 공식 호텔·객실 페이지는 리노베이션 마지막 단계와 대체 시설 안내를 제공하고 과거 목적지 색인에는 객실 요금이 있습니다. 공사 안내를 호텔 전체 폐업으로 해석하지 않습니다. 활성 유지 및 소스 누락 예외 검토 후보입니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/bomfp-four-points-navi-mumbai-vashi/rooms/) (5 days ago)<br>[2. Marriott 과거 요금](https://www.marriott.com/es/destinations/india/navi-mumbai.mi) (last month) |
| **MUCAT** · Caro & Selig, Tegernsee, Autograph Collection | 최근 공식 객실·식음 페이지에서 Caro & Selig의 객실·레스토랑 운영 정보와 연락처를 확인했습니다. 과거 요금 색인을 현재 예약으로 오인하지 않으며 활성 유지·소스 누락 예외 검토 후보로 남깁니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/mucat-caro-and-selig-tegernsee-autograph-collection/rooms/) (5 days ago)<br>[2. Marriott 호텔](https://www.marriott.com/en-us/hotels/mucat-caro-and-selig-tegernsee-autograph-collection/dining/) (6 days ago)<br>[3. Marriott 과거 요금](https://www.marriott.com/en-gb/destinations/germany/pet-friendly-hotels.mi?pg=12) (2 months ago) |
| **JANCY** · Courtyard by Marriott Jackson Ridgeland | 최근 공식 개별 페이지가 리노베이션 중임을 안내하고 호텔 서비스·연락처를 유지합니다. 과거 객실 요금도 확인되지만 오늘 예약 재고는 별도입니다. 공사를 폐업으로 단정하지 않고 활성 유지·소스 누락 예외 검토 후보로 남깁니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/jancy-courtyard-jackson-ridgeland/overview/) (6 days ago)<br>[2. Marriott 과거 요금](https://www.marriott.com/en/destinations/mississippi.mi) (2 months ago) |
| **LWCKS** · SpringHill Suites by Marriott Lawrence Downtown | 최근 공식 개별 페이지는 수영장·피트니스의 정비 휴장을 알리며 숙박 소개와 연락처를 유지합니다. 호텔 전체 폐업 안내가 아닙니다. 과거 요금 자료와 함께 활성 유지·소스 누락 예외 검토 후보로 남깁니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/lwcks-springhill-suites-lawrence-downtown/overview/) (last week)<br>[2. Marriott 과거 요금](https://www.marriott.com/en-us/destinations/united-states/missouri/arrowhead-stadium/free-breakfast-hotels.mi?pg=3) (last month) |
| **SRQSH** · SpringHill Suites by Marriott Sarasota Bradenton | 최근 공식 호텔·객실 페이지에 Sarasota Bradenton의 운영 정보·연락처가 있으며 과거 목록에 객실 요금도 있습니다. 부동산 매물의 Closed는 거래 종료 표현이므로 호텔 폐업 근거로 쓰지 않습니다. 활성 유지·소스 누락 예외 검토 후보입니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/srqsh-springhill-suites-sarasota-bradenton/overview/) (3 days ago)<br>[2. Marriott 호텔](https://www.marriott.com/en-us/hotels/srqsh-springhill-suites-sarasota-bradenton/rooms/) (5 days ago)<br>[3. Marriott 과거 요금](https://www.marriott.com/en-us/destinations/united-states/florida/bradenton/business-center-hotels.mi?pg=4) (2 months ago) |

### 활성 현 상태 유지·확인 필요 — 6개

| 코드 · 호텔 | 개별 검토 / 남은 확인 | 근거 · 자료 신선도 |
| --- | --- | --- |
| **BJSLY** · Courtyard by Marriott Langfang | 공식 Langfang 개별 페이지와 식음·객실 정보, 주소·전화는 확인됩니다. 목적지 목록의 표본일은 매진입니다. 소스 누락만으로 삭제하지 않되 운영 확인 예외 승인도 보류합니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/bjsly-courtyard-langfang/overview/) (4 days ago)<br>[2. Marriott 목록](https://www.marriott.com/en-us/destinations/china/langfang/hotels-with-restaurant.mi?pg=3) (last month) |
| **TAOZY** · Qingdao Zhanqiao Yours Hotel, a Member of Design Hotels™ | 공식 개별·객실·식음 페이지에서 Qingdao Zhanqiao Yours를 확인했습니다. 공식 신규 호텔 목록의 표본일은 매진이며 현재 운영·예약 개시를 입증하지 않습니다. 자동 삭제나 예외 승인은 하지 않습니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/taozy-qingdao-zhanqiao-yours-hotel-a-member-of-design-hotels/overview/) (2 days ago)<br>[2. Marriott 목록](https://www.marriott.com/en-us/destinations/china/qingdao/new-hotels.mi) (5 days ago) |
| **XIYCW** · Courtyard by Marriott Xi'an West | 공식 Xi'an West 개별 페이지에는 291객실, 주소·전화·시설 정보가 있지만 공식 신규 호텔 목록은 요금 불가입니다. 200 CNY는 공항 이동 비용으로 객실 요금이 아닙니다. 등록 당시 운영 검증 근거 재확인이 필요합니다. 남은 확인: 현재 개장·Marriott 객실 예약 개시; 최초 활성 등록 시 운영 검증 근거. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/xiycw-courtyard-xian-west/overview/) (4 days ago)<br>[2. Marriott 목록](https://www.marriott.com/en-us/destinations/china/xian/new-hotels.mi) (last week) |
| **NBOMM** · Kinara, a Luxury Collection Safari Camp, Masai Mara | Marriott Luxury Group 소개에 Kinara는 남아 있지만 개별 예약 경로는 직접 조회하지 못했고 과거 Kenya 신규 호텔 표본일은 매진입니다. 이전 개장 예정일이 지났다고 실제 개장을 추정하지 않습니다. 소스 누락 예외 승인 전 우선 재확인 대상입니다. 남은 확인: Kinara의 실제 첫 투숙·개장 완료일; 현재 Marriott 예약 경로와 제휴 확인. | [1. Marriott 디렉터리](https://www.marriott.com/luxury) (today)<br>[2. Marriott 목록](https://www.marriott.com/en-gb/destinations/kenya/new-hotels.mi) (last month) |
| **DAYLM** · Fairfield by Marriott Inn & Suites Lima | Lima, Ohio 호텔의 과거 공식 호텔·식음 페이지가 남아 있고 수영장 일시 폐쇄 안내가 있습니다. 수영장 휴장을 호텔 폐업으로 간주하지 않습니다. 그러나 자료가 한두 달 전이므로 오늘 Marriott 숙박 운영·예약은 추가 확인이 필요합니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. Marriott 과거 페이지](https://www.marriott.com/hotels/travel/daylm-fairfield-inn-and-suites-lima/) (2 months ago)<br>[2. Marriott 과거 페이지](https://www.marriott.com/en-us/hotels/daylm-fairfield-inn-and-suites-lima/dining/) (last month) |
| **RSWNS** · SpringHill Suites by Marriott Naples | Marriott 개별 경로는 직접 재조회하지 못했지만 운영사 GF Hotels의 자산 소개에 SpringHill Suites Naples가 남아 있습니다. 옛 프랜차이즈 목록은 과거 이력일 뿐 현재 제휴 증거가 아니므로 현재 예약 경로·브랜드 유지 여부는 확인 필요입니다. 남은 확인: 소스 누락 원인과 현재 Marriott 예약·제휴 상태 확인. | [1. 운영사 호텔](https://www.gfhotels.com/about-us/property-portfolio/springhill-suites-naples-naples-fl) (2 months ago)<br>[2. Marriott 과거 공시](https://www.hotel-development.marriott.com/ResourceFiles/fdd-document/2025-springhill-suites-fdd-3-31-2025.pdf) (unknown) |

### 보류 유지 — 83개

| 코드 · 호텔 | 개별 검토 / 남은 확인 | 근거 · 자료 신선도 |
| --- | --- | --- |
| **BKIFI** · Fairfield by Marriott Kota Kinabalu | Marriott 공식 개장 안내는 2026년 4분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. 상태 제안: 예약 미개시 안내 → 개장·전환 대기. | [1. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **CAEFW** · Fairfield by Marriott Inn & Suites West Columbia Airport | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/caefw-fairfield-inn-and-suites-west-columbia-airport/overview/) (4 days ago) |
| **CTUFF** · Fairfield by Marriott Chengdu Fenghuangshan Sports Park | 공식 Chengdu 신규 호텔 목록의 표본 숙박일은 매진입니다. 호텔 소개·연락처는 있으나 현재 운영이나 예약 미개시 어느 쪽도 이 결과만으로 판단할 수 없습니다. 상태 제안: 예약 미개시 안내 → 확인 필요. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/china/new-hotels.mi?pg=2) (yesterday) |
| **EUGCX** · City Express by Marriott Corvallis | 공식 영국어 객실 페이지에 예약 미개시 안내가 남아 있습니다. 이 자료는 약 한 달 전 색인으로, 오늘 예약 엔진의 상태까지 직접 확인한 것은 아닙니다. | [1. Marriott 호텔](https://www.marriott.com/en-gb/hotels/eugcx-city-express-corvallis/rooms/) (last month) |
| **HGHFU** · Fairfield by Marriott Hangzhou Fuyang | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/hghfu-fairfield-hangzhou-fuyang/overview/) (2 weeks ago) |
| **MSPXE** · City Express by Marriott Minneapolis Airport | 공식 Minnesota 신규 호텔 목록의 표본 숙박일은 매진입니다. 시설·연락처는 확인되지만 매진을 예약 미개시나 폐업으로 해석하지 않습니다. 상태 제안: 예약 미개시 안내 → 확인 필요. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/minnesota/new-hotels.mi) (today) |
| **NUMAK** · Oraya, Sindalah, Autograph Collection | 공식 사이트맵 검색 색인에 이름은 남아 있지만 실제 사이트맵 조회·상세 경로에서는 현재 투숙 운영과 예약 개시를 확인하지 못했습니다. 섬 행사·과거 개장 계획을 호텔의 현재 영업으로 간주하지 않습니다. 상태 제안: 개장·전환 대기 → 확인 필요. | [1. Marriott 디렉터리](https://www.marriott.com/en-us/hotel-sitemap/saudi-arabia-hotel-sitemap) (today) |
| **NUMLC** · The Syanne, A Luxury Collection Resort, Sindalah | 공식 사이트맵 검색 색인에 이름은 남아 있지만 실제 사이트맵 조회·상세 경로에서는 현재 투숙 운영과 예약 개시를 확인하지 못했습니다. 섬 행사·과거 개장 계획을 호텔의 현재 영업으로 간주하지 않습니다. 상태 제안: 개장·전환 대기 → 확인 필요. | [1. Marriott 디렉터리](https://www.marriott.com/en-us/hotel-sitemap/saudi-arabia-hotel-sitemap) (today) |
| **NUMSA** · Seratoro, Sindalah, Apartments by Marriott Bonvoy | 공식 사이트맵 검색 색인에 이름은 남아 있지만 실제 사이트맵 조회·상세 경로에서는 현재 투숙 운영과 예약 개시를 확인하지 못했습니다. 섬 행사·과거 개장 계획을 호텔의 현재 영업으로 간주하지 않습니다. 상태 제안: 개장·전환 대기 → 확인 필요. | [1. Marriott 디렉터리](https://www.marriott.com/en-us/hotel-sitemap/saudi-arabia-hotel-sitemap) (today) |
| **NUMSL** · Coramar, A Luxury Collection All-Suites Hotel, Sindalah | 공식 사이트맵 검색 색인에 이름은 남아 있지만 실제 사이트맵 조회·상세 경로에서는 현재 투숙 운영과 예약 개시를 확인하지 못했습니다. 섬 행사·과거 개장 계획을 호텔의 현재 영업으로 간주하지 않습니다. 상태 제안: 개장·전환 대기 → 확인 필요. | [1. Marriott 디렉터리](https://www.marriott.com/en-us/hotel-sitemap/saudi-arabia-hotel-sitemap) (today) |
| **OKCTD** · TownePlace Suites by Marriott Oklahoma City Downtown | 공식 목적지 목록에서 해당 호텔의 표본 날짜는 매진입니다. Oklahoma City Downtown의 호텔 소개·연락처는 확인되며 현재 개장 상태는 추가 확인이 필요합니다. 상태 제안: 예약 미개시 안내 → 확인 필요. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/oklahoma/pet-friendly-hotels.mi) (today) |
| **PUSAH** · Anook Signature Busan Haeundae, Series by Marriott | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/pusah-anook-signature-busan-haeundae-series-by-marriot/overview/) (today) |
| **SELAI** · Anook Signature Incheon Guwol, Series by Marriott | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/selai-anook-signature-incheon-guwol-series/overview/) (3 days ago) |
| **SHAHQ** · Fairfield by Marriott Shanghai Hongqiao Airport Qibao | 공식 신규 호텔 목록에 Shanghai Hongqiao Airport Qibao가 있으며 표본 날짜는 매진입니다. 호텔 연락처는 확인됐지만 실제 운영·예약 개시는 확인 필요입니다. 상태 제안: 예약 미개시 안내 → 확인 필요. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/china/suzhou/new-hotels.mi) (2 days ago) |
| **TIJPC** · Courtyard by Marriott Tijuana, Plaza Toreo | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/tijpc-courtyard-tijuana-plaza-toreo/overview/) (5 days ago) |
| **VCEOX** · Moxy Venice Airport | 이탈리아 공식 사이트맵에서 해당 이름을 찾지 못했고 개별 Marriott 예약·운영 근거도 확보하지 못했습니다. 과거 개장 계획을 현재 상태로 재사용하지 않고 확인 필요로 유지합니다. 상태 제안: 개장·전환 대기 → 확인 필요. | [1. Marriott 디렉터리](https://www.marriott.com/en-us/hotel-sitemap/italy-hotel-sitemap) (yesterday) |
| **XICQP** · Four Points by Sheraton Xichang Qionghai | 공식 신규 호텔 목록에 개장 예정 표시가 있지만 날짜는 비어 있고 표본일은 매진입니다. 개장일을 추정하지 않고 보류 유지합니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/china/new-hotels.mi?pg=9) (yesterday) |
| **ZUHXP** · Four Points by Sheraton Zhuhai Xiangzhou | 공식 목적지 목록에 날짜 없는 개장 예정 표시와 표본일 매진이 있습니다. 과거 예약 미개시 사유를 현재 예약 실패로 단정하지 않고 개장 확인 대기로 정리합니다. 상태 제안: 예약 미개시 안내 → 개장·전환 대기. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/china/zhongshan/new-hotels.mi) (yesterday) |
| **ANCMT** · Courtyard by Marriott Midtown Anchorage | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/ancmt-courtyard-midtown-anchorage/overview/) (today) |
| **ATLDS** · SpringHill Suites by Marriott Dawsonville | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/atlds-springhill-suites-dawsonville/overview/) (4 days ago) |
| **BAHSW** · Aqua Vista Bahrain Hotel | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/bahsw-aqua-vista-bahrain-hotel/overview/) (yesterday) |
| **DENFE** · Fairfield by Marriott Inn & Suites Denver Central Park | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/denfe-farifield-inn-and-suites-denver-central-park/overview/) (2 days ago) |
| **GGGRI** · Residence Inn by Marriott Longview | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/gggri-residence-inn-longview/overview/) (yesterday) |
| **KNOCY** · Courtyard by Marriott Medan | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/knocy-courtyard-medan/overview/) (5 days ago) |
| **LASFN** · Fairfield by Marriott Inn & Suites Las Vegas North | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/lasfn-fairfield-inn-and-suites-las-vegas-north/overview/) (3 days ago) |
| **MLBCW** · The Westin Cocoa Beach Resort & Spa | Marriott의 과거 미개장 목록 및 2027년 행사 주최 측 장소 안내가 개장 전 정황을 뒷받침합니다. 2027년 예정으로 보류하되 정확한 월은 자료마다 달라 확정하지 않습니다. | [1. Marriott 과거 공시](https://www.hotel-development.marriott.com/ResourceFiles/fdd-document/2025-westin-fdd-3-31-2025.pdf) (unknown)<br>[2. 행사 주최자](https://iscn.carrickinstitute.com/the-experience) (last week) |
| **MOBST** · StudioRes by Marriott Mobile | 공식 Mobile 신규 호텔 목록에 호텔은 있으나 표본 숙박일이 매진입니다. 이름이 노출된 사실만으로 운영 개시를 판단하지 않습니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/alabama/mobile/new-hotels.mi) (today) |
| **OSAKM** · Kyoto Marriott Hotel | Marriott 공식 개장 안내는 2026년 4분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **POZFP** · Four Points by Sheraton Poznan | 운영사 PHH Hotele는 옛 Ikar 호텔의 Four Points 전환 개장을 2026년 10월로 안내합니다. Marriott 호텔 페이지의 예약 미개시 안내와 함께 보류를 유지합니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/pozfp-four-points-poznan/overview/) (last week)<br>[2. 운영사 공지](https://phhhotele.pl/o-spolce/) (today) |
| **PVRMI** · Marriott Playa Vallarta, An All-Inclusive Resort | 공식 PVRMI 소개는 있으나 표본 숙박일은 예약 불가입니다. 기존 Marriott Puerto Vallarta의 전환 대상인지 주소·코드 관계와 전환 완료일 확인 전 신규 활성 등록을 보류합니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/pvrmi-marriott-playa-vallarta-an-all-inclusive-resort/overview/) (today)<br>[2. Marriott 목록](https://www.marriott.com/es/destinations/mexico/puerto-vallarta/new-hotels.mi) (today) |
| **SDFEI** · Residence Inn by Marriott Elizabethtown | 공식 Kentucky 신규 호텔 목록의 해당 호텔 표본일이 매진입니다. Elizabethtown 호텔 소개·전화번호는 확인되며 실제 영업 개시는 확인 필요입니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/kentucky/new-hotels.mi) (today) |
| **SELUI** · UH Seoul Insadong, Series by Marriott | Marriott 공식 개장 안내는 2026년 4분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **SJOLP** · Four Points by Sheraton San Jose Airport Alajuela | 운영사 Faranda의 2026-07-29 공지에 공사 70% 진행·2026년 4분기 개장 예정으로 명시됩니다. 공식 예약 미개시 안내와 일치해 보류 유지합니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/sjolp-four-points-san-jose-airport-alajuela/overview/) (4 days ago)<br>[2. 운영사 공지](https://es.linkedin.com/pulse/four-points-sheraton-san-jos%C3%A9-airport-alajuela-alcanza-o4x5e) (5 days ago) |
| **SRQRS** · StudioRes by Marriott Sarasota | 공식 Sarasota/Florida 신규 호텔 목록에서 해당 호텔의 표본일이 매진입니다. 연락처·시설 소개 외 실제 예약 개시 근거는 추가 확인이 필요합니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/florida/new-hotels.mi) (yesterday) |
| **SYXAC** · AC Hotel Sanya Downtown | 공식 Sanya 신규 호텔 목록의 표본일은 매진 또는 요금 불가입니다. AC Hotel Sanya Downtown의 존재는 확인되지만 이 결과만으로 운영 상태를 결정하지 않습니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/china/lingshui/hotels-with-restaurant.mi?pg=2) (today) |
| **TRIJT** · TownePlace Suites by Marriott Johnson City | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/trijt-towneplace-suites-johnson-city/overview/) (3 days ago) |
| **TSNGP** · Four Points by Sheraton Tianjin Gulou | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/tsngp-four-points-tianjin-gulou/overview/) (2 weeks ago) |
| **UKBCY** · Courtyard by Marriott Kobe | Marriott 공식 개장 안내는 2026년 4분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **ZNZBM** · Maya Resort Zanzibar, a Tribute Portfolio Hotel | 공식 Zanzibar 호텔 페이지는 시설·전화번호를 제공하지만 목적지 목록의 표본일은 매진입니다. 페이지의 주차 요금은 객실 요금 근거에서 제외했습니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/tanzania/pool-hotels.mi) (today) |
| **ZUHSF** · Fairfield by Marriott Zhongshan Sunwen East Road | 공식 Zhuhai 인근 목록에서 Zhongshan Sunwen East Road의 표본일은 매진입니다. 이전 예약 미개시 안내는 현재 확인 범위에서 재확인되지 않아 확인 필요로 정리합니다. 상태 제안: 예약 미개시 안내 → 확인 필요. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/china/zhuhai.mi?pg=2) (today) |
| **MYRFI** · Fairfield by Marriott Inn & Suites Myrtle Beach Oceanfront | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/myrfi-fairfield-inn-and-suites-myrtle-beach-oceanfront/overview/) (today) |
| **BHMXT** · City Express by Marriott Tuscaloosa | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/bhmxt-city-express-tuscaloosa/overview/) (2 days ago) |
| **CTUHT** · Chengdu Marriott Hotel High-Tech Zone West | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/ctuht-chengdu-marriott-hotel-high-tech-zone-west/overview/) (today) |
| **DPSCL** · Courtyard by Marriott Nusa Lembongan Bali Resort | Marriott 공식 개장 안내는 2027년 1분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/dpscl-courtyard-nusa-lembongan-bali-resort/overview/) (today)<br>[2. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **DXBZR** · Marriott Executive Apartments Sheikh Zayed Road, Dubai | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/dxbzr-marriott-executive-apartments-sheikh-zayed-road-dubai/overview/) (today) |
| **FUONJ** · Four Points by Sheraton Foshan Jiujiang | 미국어 경로의 직접 조회는 실패했지만 공식 검색에서 호텔 소개와 주소를 확인했습니다. 전화·객실 FAQ가 미완성이고 숫자 요금 또는 개장 공지는 확인하지 못했습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/fuonj-four-points-foshan-jiujiang/overview/) (2 weeks ago) |
| **GDLPA** · Four Points by Sheraton Guadalajara | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/gdlpa-four-points-guadalajara/overview/) (last week) |
| **GSPEH** · SpringHill Suites by Marriott Greenville East | 공식 신규 호텔 목록에 Greenville East가 있으며 표본 숙박일은 매진입니다. 개별 호텔 소개·전화와 함께 확인했으나 현재 예약 개시는 확인 필요입니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/south-carolina/new-hotels.mi) (yesterday) |
| **MGMSS** · St James Hotel, Selma, Series by Marriott | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/mgmss-st-james-hotel-selma-series/overview/) (last week) |
| **NGBCH** · Courtyard by Marriott Ningbo Hangzhou Bay | 공식 객실 페이지에 예약 미개시 안내가 있습니다. 소개 페이지는 최신 시설 정보를 제공하지만 예약 개시 확인 전 보류 유지합니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/ngbch-courtyard-ningbo-hangzhou-bay/rooms/) (2 weeks ago) |
| **ORHSX** · City Express by Marriott Shrewsbury | 공식 호텔 소개에는 889 Boston Turnpike 주소가 있으나 연락처가 비어 있고 객실 FAQ도 미완성입니다. 소개 문구만으로 Marriott 전환 개시를 판단하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/orhsx-city-express-shrewsbury/overview/) (3 days ago) |
| **PARMX** · Moxy Paris Montmartre | 공식 Paris 목록의 Moxy Paris Montmartre 표본일은 매진입니다. 인접 호텔의 132 EUR 요금을 이 호텔의 요금으로 사용하지 않았습니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/france/paris/hotels-near-les-grands-boulevards.mi) (today) |
| **PQCFI** · Fairfield by Marriott Phu Quoc Hon Thom | Marriott 공식 개장 안내는 2027년 1분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/pqcfi-fairfield-phu-quoc-hon-thom/overview/) (last week)<br>[2. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **PQCOX** · Moxy Phu Quoc Hon Thom | Marriott 공식 개장 안내는 2027년 1분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/pqcox-moxy-phu-quoc-hon-thom/overview/) (yesterday)<br>[2. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **SANDS** · Stellen, San Diego Gaslamp, Series by Marriott | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/sands-stellen-san-diego-gaslamp-series/overview/) (today) |
| **ANRCC** · The Belson Antwerp, a Tribute Portfolio Hotel | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/anrcc-the-belson-antwerp-a-tribute-portfolio-hotel/overview/) (today) |
| **BCNCB** · Condes Barcelona, Autograph Collection | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/bcncb-condes-barcelona-autograph-collection/overview/) (today) |
| **CHIRX** · City Express by Marriott Rolling Meadows | 공식 객실·체험 페이지에 예약 미개시가 명시돼 있습니다. 영국어 소개는 향후 호텔 운영을 설명하며 주소·전화번호는 확인됐습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/chirx-city-express-rolling-meadows/rooms/) (yesterday) |
| **CTUWF** · Fairfield by Marriott Chengdu Wuhou District Yulin Road | 영국어 공식 소개에서 호텔명·주소·연락처를 재확인했습니다. 이번 객실 조회는 일반 안내만 제공하고 표본일은 매진입니다. 이전 예약 미개시 문구를 오늘 재확인한 것으로 기록하지 않습니다. 상태 제안: 예약 미개시 안내 → 확인 필요. | [1. Marriott 호텔](https://www.marriott.com/en-gb/hotels/ctuwf-fairfield-chengdu-wuhou-district-yulin-road/overview/) (last week)<br>[2. Marriott 목록](https://www.marriott.com/en-us/destinations/china/new-hotels.mi?pg=2) (yesterday) |
| **EWRPO** · StudioRes by Marriott Piscataway Somerset | 공식 목록에서 Piscataway Somerset의 표본일은 매진입니다. 소개·전화와 예약 검색 버튼만 확인됐으며 실제 운영 개시를 추가 확인해야 합니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/new-jersey/jersey-city/hotels-with-kitchen.mi) (today) |
| **GEGCR** · Residence Inn by Marriott Coeur d'Alene | 개발사 Providence의 프로젝트 페이지는 향후 105객실 호텔과 2025년 1분기 착공을 설명합니다. 완료·개장 공지는 확인하지 못했습니다. 근거에서 확인되지 않은 2027년 초 개장일을 확정하지 않습니다. | [1. developer_project](https://providencedevco.com/residence-inn-cda/) (5 days ago) |
| **IADCN** · City Express by Marriott Chantilly Dulles Airport | 영국어 객실 페이지에 예약 미개시 안내가 있습니다. 미국어 페이지의 일반 객실 정보와 구분해 보류 유지합니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-gb/hotels/iadcn-city-express-chantilly-dulles-airport/rooms/) (yesterday) |
| **JZHAS** · Four Points by Sheraton Aba Songpan | 공식 체험 페이지에 예약 미개시 안내가 있습니다. 표시명은 Four Points by Sheraton Aba, Songpan이며 주소·전화번호도 확인됐습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-gb/hotels/jzhas-four-points-aba-songpan/experiences/) (yesterday) |
| **LYIIF** · Fairfield by Marriott Linyi International Convention and Exhibition Center | 영국어 공식 페이지에서 표시명과 NO.138 Yihe Road 주소를 확인했습니다. 연락처·객실 정보가 미완성이므로 현재 운영은 확인 필요입니다. | [1. Marriott 호텔](https://www.marriott.com/en-gb/hotels/lyiif-fairfield-linyi-international-convention-and-exhibition-center/overview/) (yesterday) |
| **MGMPR** · StudioRes by Marriott Prattville | 공식 Montgomery/Prattville 목적지 목록에서 StudioRes Prattville의 표본일은 매진입니다. 주변 다른 호텔 요금과 분리해 보류 유지합니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/alabama/montgomery/hotels-near-prattville.mi) (today) |
| **OKARR** · Okinawa Marriott Rizzan Resort & Spa | Marriott 공식 개장 안내는 2026년 4분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **PHXMF** · Fairfield by Marriott Inn & Suites Phoenix Mesa East | 공식 호텔 소개와 1544 South 105th Place 주소는 확인했으나 연락처와 객실 FAQ가 미완성입니다. 예약 버튼만으로 활성 등록하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/phxmf-fairfield-inn-and-suites-phoenix-mesa-east/overview/) (3 days ago) |
| **PHXOE** · Residence Inn by Marriott Phoenix Southeast | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/phxoe-residence-inn-phoenix-southeast/overview/) (yesterday) |
| **PVDTD** · Hotel Neptune, a Member of Design Hotels | 운영사 Ash가 Neptune 호텔과 같은 전화번호를 안내하고 Marriott 개별 페이지도 존재합니다. 공식 목적지 표본일은 매진으로, 독립호텔 운영과 Marriott 예약 참여 개시는 구분해 추가 확인합니다. | [1. 운영사 호텔](https://ash.world/contact) (today)<br>[2. Marriott 호텔](https://www.marriott.com/en-us/hotels/pvdtd-hotel-neptune-a-member-of-design-hotels/overview/) (today)<br>[3. Marriott 목록](https://www.marriott.com/en-us/destinations/united-states/rhode-island/providence/new-hotels.mi) (today) |
| **RMIAS** · Lyra Hotel Rimini Fiera, Series by Marriott | 공식 이탈리아어 페이지에서 Lyra Hotel Rimini Fiera와 객실·위치 소개를 확인했습니다. 공식 목적지 표본일은 예약 불가이며 일부 영어 페이지 제목의 Amapa 표기는 본문과 달라 새 이름 근거로 쓰지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/it/hotels/rmias-lyra-hotel-rimini-fiera-series/overview/) (today)<br>[2. Marriott 목록](https://www.marriott.com/en-us/destinations/italy.mi?pg=6) (today) |
| **SHEYC** · Courtyard by Marriott Shenyang | 미국어 공식 객실 페이지에 예약 미개시 안내가 명시됩니다. 영국어 소개의 일반 시설 문구만으로 보류를 해제하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/sheyc-courtyard-shenyang/rooms/) (today) |
| **SVQCT** · Confidencia Sevilla, a Tribute Portfolio Hotel | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. 상태 제안: 확인 필요 → 예약 미개시 안내. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/svqct-confidencia-sevilla-a-tribute-porfolio-hotel/overview/) (2 days ago) |
| **SZXQP** · Four Points by Sheraton Shenzhen Qianhai CBD | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/szxqp-four-points-shenzhen-qianhai-cbd/overview/) (yesterday) |
| **TLLCY** · Courtyard by Marriott Tallinn City Center | 공식 Tallinn 목록의 표본 숙박일은 매진이고 호텔명·주소·전화는 확인됩니다. 예정 개장 시점이 지났다는 이유만으로 운영 완료로 처리하지 않습니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/estonia/tallinn.mi) (today) |
| **UDRNH** · City Express by Marriott Udaipur Nathdwara Highway | 영국어 공식 페이지에서 표시명·주소·연락처를 확인했습니다. Marriott 개장 목록은 2026년 3분기 예정이며 실제 전환·예약 개시는 별도 확인이 필요합니다. | [1. Marriott 호텔](https://www.marriott.com/en-gb/hotels/udrnh-city-express-udaipur-nathdwara-highway/overview/) (yesterday)<br>[2. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **VIESI** · Hotel Savoyen Vienna | 현재 Austria Trend가 Savoyen을 소개하며 예약 연락처를 제공합니다. 향후 운영사 MHP는 2027년 초 인수·Sheraton 전환을 발표했습니다. 기존 호텔의 영업을 Marriott 전환 완료로 간주하지 않습니다. 상태 제안: 확인 필요 → 개장·전환 대기. | [1. 운영사 호텔](https://www.austria-trend.at/en/hotels/savoyen) (yesterday)<br>[2. 운영사 공지](https://www.mhphotels.com/2025/11/04/adhoc-mhp-hotel-ag-uebernimmt-hotel-savoyen-vienna-aus-renommiertem-konferenzhotel-wird-sheraton-vienna/) (3 days ago) |
| **WASSE** · Hotel Nell - Union Market, Series by Marriott | 영국어 공식 페이지에서 Hotel Nell - Union Market, Series by Marriott 표시명·411 New York Ave NE 주소·전화번호를 확인했습니다. 미국어 객실 페이지도 존재하지만 실제 Marriott 요금·예약 개시를 확인하지 못했습니다. | [1. Marriott 호텔](https://www.marriott.com/en-gb/hotels/wasse-hotel-nell-union-market-series/overview/) (yesterday)<br>[2. Marriott 호텔](https://www.marriott.com/en-us/hotels/wasse-hotel-nell-union-market-series/rooms/) (yesterday) |
| **WUXJW** · JW Marriott Hotel Wuxi | 공식 Wuxi 목록에서 JW Marriott Hotel Wuxi의 표본일은 매진입니다. 개별 호텔·식음 소개는 있으나 객실 FAQ가 미완성이라 운영 개시 확인이 필요합니다. | [1. Marriott 목록](https://www.marriott.com/en-us/destinations/china/wuxi.mi) (today) |
| **ALSSH** · SpringHill Suites by Marriott Alamosa Downtown | 공식 호텔 페이지에 예약이 아직 제공되지 않는다는 안내가 있습니다. 호텔 자체의 폐업을 뜻하지 않습니다. | [1. Marriott 호텔](https://www.marriott.com/en-us/hotels/alssh-springhill-suites-alamosa-downtown/overview/) (last week) |
| **DPSUJ** · JW Marriott Bali Ubud Resort & Spa | Marriott 공식 개장 안내는 2027년 2분기 예정입니다. 기존 호텔 영업과 Marriott 전환·신규 개장을 구분해 보류 유지. | [1. Marriott 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) (today) |
| **LGWFP** · Four Points by Sheraton London Gatwick Airport | 현재 공식 상세 경로는 재조회하지 못했습니다. Marriott Hosted Content에 이름이 남아 있으나 FAQ·검색 색인의 잔존은 실제 영업이나 예약 가능 증거가 아닙니다. 제휴 종료·폐업을 단정하지 않고 보류 유지합니다. | [1. Marriott 디렉터리](https://context.marriott.com/) (4 days ago) |
| **SOUWX** · Four Points Flex by Sheraton Winchester South | 과거 Marriott 식음·목적지 페이지는 남아 있습니다. 주소와 전화번호는 Marwell Hotel과 일치하지만 Marriott 브랜드 전환 완료·현재 예약은 확인되지 않았습니다. Marwell 영업과 Four Points 참여를 구분합니다. | [1. Marriott 과거 페이지](https://www.marriott.com/en-us/hotels/souwx-four-points-flex-winchester-south/dining/) (4 months ago)<br>[2. Marriott 호텔](https://www.marriott.com/en-us/hotels/souwx-four-points-flex-winchester-south/reviews/) (2 months ago)<br>[3. 운영사 프로필](https://at.linkedin.com/company/marwell-hotel) (3 months ago) |
| **STNCD** · Delta Hotels Cheshunt | 이전 Marriott 식음 경로는 현재 오류 페이지로 이동합니다. 호텔 공식 LinkedIn 소개는 남아 있으나 숙박 예약 재개·제휴 상태를 확인하지 못했습니다. 오래된 소개만으로 소스 누락 예외를 복원하지 않습니다. | [1. 운영사 프로필](https://uk.linkedin.com/company/delta-by-marriott-cheshunt) (2 weeks ago) |

## 승인 후 패치 체크리스트 — 아직 적용하지 않음

| 대상 | 검토할 로컬 파일 | 반드시 함께 확인할 것 |
| --- | --- | --- |
| BNACR·MRYCO·SFOPS 보류 해제 | `rules/marriottProperties/us.ts`, `data/marriott/property-review-holds.json`, 코드·ID 메타데이터 | 안정 ID 유지, Ocean Ave/8th Ave 분리, 별칭 충돌, 승인 후에만 활성 매칭 |
| RDURS·IXMRT | 보류 파일·검토 기록 | 실제 개장·전환 완료 확인, 공식 일정 상충 해소 |
| HGHHA·SZXLP 보류 전환 | `rules/marriottProperties/cn.ts`, 보류 파일 | 원래 ID·별칭 보존, 보류가 일반 브랜드 매칭보다 먼저 적용되는지 |
| MIAWS·ATLBH 현재 활성 제외 | `rules/marriottProperties/us.ts`, 분류 규칙·유효일 정책, 모니터 종료 근거 | 종료 전 거래 보존, 종료 후 일반 브랜드 재매칭 방지, ATLBH/ATLLP 별도 자산 유지 |
| 유지 검토 6개 | `data/marriott/property-source-exceptions.json` | 현재 Marriott 예약·제휴 재확인 후에만 예외 승인. 오래된 요금만으로 승인하지 않음 |
| 보류 유지 83개 | `data/marriott/property-review-holds.json` | 오늘 관찰과 과거 보류 사유를 구분하고 확인 필요 항목 유지 |
| 모든 변경 | `lib/__tests__/classifyMerchant.test.ts`, `lib/__tests__/marriottUpdateMonitor.test.ts` | 일반 브랜드로 보류를 우회하지 않음, 신규 후보 중복 없음, 과거 결제 회귀 방지 |

이번에 추가한 [검토 기록 테스트](../lib/__tests__/marriottIndividualReview.test.ts)는 104개 대상의 완전성·유일성, 근거 필드, 분류별 수량, 미승인 상태, 상충 근거의 보수적 유지 및 종료 후보의 후속 검증 사항을 검사합니다. 호텔의 실제 영업을 자동 증명하는 테스트는 아닙니다.
