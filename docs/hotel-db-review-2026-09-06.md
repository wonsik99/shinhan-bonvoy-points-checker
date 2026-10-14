# Marriott DB 패치 재정리 — 2026-09-06

## 범위와 승인 상태

기존 미커밋 DB 패치를 한국시간 2026-09-06 기준 공식 수집 결과에 맞춰 정리한 **검토용 로컬 변경**입니다. 자동 승인, 커밋, push, 배포는 하지 않았습니다. 전체 코드 보안 감사·배포 상태 점검은 이번 범위가 아닙니다.

- 수집 시각: 2026-09-05T17:49:58.695Z (한국시간 2026-09-06 02:49).
- 기준: 7월 26일 승인 파일 `data/marriott/official-property-snapshot.json` 그대로 유지.
- 최종 재검증(03:07 KST): 공식 코드 10,357개, 신규 79개, 소스 이탈 20개, URL slug 변경 36개. Marriott/Ritz/Bvlgari 수집 오류 0건.
- 최초 10,358개에서 QA 코드 AQAOA 1개가 소스에서 빠졌습니다. 비교 대상 10,348개와 실제 호텔 변경 수는 동일합니다.
- 상세 결정·출처·SHA-256: [구조화 검토 기록](../data/marriott/reviews/2026-09-06.json).
- 수집 원본과 전체 79/20/36 차이: 로컬 `.marriott-reports/2026-09-06-refresh/`. 수정 후 재검증: `.marriott-reports/2026-09-06-final/`. 두 폴더는 gitignore 대상이며 커밋에 포함되지 않습니다.

## 이번 재정리의 결과

| 항목 | 이번 변경 |
| --- | --- |
| 신규 활성 등록 패치 | 2건: AMDFL, BHJRB |
| 신규 보류 | 24건: 확인 필요 20, 예약 미개시 3, 운영 전 1 |
| 기존 활성 → 보류 | 5건: ALSSH, DPSUJ, LGWFP, SOUWX, STNCD |
| 공식 표시명 | 13건 갱신, 안정 ID·옛 이름 alias 유지 |
| 기존 보류 의미 정정 | 29건을 예약 미개시 → 확인 필요로 정정. 이전 검토일 유지 |
| 최종 로컬 DB | 활성 10,306개, 보류 88개, 운영 확인 소스 누락 예외 21개 |
| 미검토 소스 이탈 | 16건 유지. 자동 삭제·예외 승인 없음 |

기존 패치에 이미 있던 신규 활성 13건·보류 해제 9건은 유지합니다. 합치면 7월 승인 이후 공식 신규 79개는 활성 등록 패치 15개와 신규 보류 64개로 나뉩니다. 이 분류는 사용자 승인이나 운영 배포를 뜻하지 않습니다.

## 신규 26건의 검토 결과

새 활성 후보의 근거는 Marriott 공식 목록의 호텔명과 **숫자 요금 표시**입니다. 숙박일마다 예약 가능 여부가 다르며 실제 결제·예약은 실행하지 않았습니다.

| 코드 | 호텔 | 검토용 결정 |
| --- | --- | --- |
| AMDFL | [The Fern Sattva Resort Little Rann of Kutch, Series by Marriott](https://www.marriott.com/en-us/destinations/india/ahmedabad.mi) | 활성 등록 패치 |
| ANRCC | [The Belson Antwerp, a Tribute Portfolio Hotel](https://www.marriott.com/en-us/hotels/anrcc-the-belson-antwerp-a-tribute-portfolio-hotel/overview/) | 확인 필요 |
| BCNCB | [Condes Barcelona, Autograph Collection](https://www.marriott.com/en-us/hotels/bcncb-condes-barcelona-autograph-collection/overview/) | 확인 필요 |
| BHJRB | [The Fern Residency Bhuj, Series by Marriott](https://www.marriott.com/en-us/destinations/india/new-hotels.mi) | 활성 등록 패치 |
| CHIRX | [City Express by Marriott Rolling Meadows](https://www.marriott.com/en-us/hotels/chirx-city-express-rolling-meadows/overview/) | 확인 필요 |
| CTUWF | [Fairfield by Marriott Chengdu Wuhou District Yulin Road](https://www.marriott.com/en-gb/hotels/ctuwf-fairfield-chengdu-wuhou-district-yulin-road/photos/) | 예약 미개시 |
| EWRPO | [StudioRes by Marriott Piscataway Somerset](https://www.marriott.com/en-us/hotels/ewrpo-studiores-piscataway-somerset/overview/) | 확인 필요 |
| GEGCR | [Residence Inn by Marriott Coeur d'Alene](https://www.marriott.com/en-us/hotels/gegcr-residence-inn-coeur-dalene/overview/) | 확인 필요 |
| IADCN | [City Express by Marriott Chantilly Dulles Airport](https://www.marriott.com/en-us/hotels/iadcn-city-express-chantilly-dulles-airport/overview/) | 확인 필요 |
| IXMRT | [The Fern Residency Thekkady, Series by Marriott](https://www.marriott.com/en-us/hotels/ixmrt-the-fern-residency-thekkady-series/overview/) | 확인 필요 |
| JZHAS | [Four Points by Sheraton Aba Songpan](https://www.marriott.com/en-us/hotels/jzhas-four-points-aba-songpan/overview/) | 확인 필요 |
| LYIIF | [Fairfield by Marriott Linyi International Convention and Exhibition Center](https://www.marriott.com/en-us/hotels/lyiif-fairfield-linyi-international-convention-and-exhibition-center/overview/) | 확인 필요 |
| MGMPR | [StudioRes by Marriott Prattville](https://www.marriott.com/en-us/hotels/mgmpr-studiores-prattville/overview/) | 확인 필요 |
| OKARR | [Okinawa Marriott Rizzan Resort & Spa](https://www.marriott.com/en-us/hotels/okarr-okinawa-marriott-rizzan-resort-and-spa/overview/) | 운영 전 |
| PHXMF | [Fairfield by Marriott Inn & Suites Phoenix Mesa East](https://www.marriott.com/en-us/hotels/phxmf-fairfield-inn-and-suites-phoenix-mesa-east/overview/) | 확인 필요 |
| PHXOE | [Residence Inn by Marriott Phoenix Southeast](https://www.marriott.com/en-us/hotels/phxoe-residence-inn-phoenix-southeast/overview/) | 예약 미개시 |
| PVDTD | [Hotel Neptune, a Member of Design Hotels](https://www.marriott.com/en-us/hotels/pvdtd-hotel-neptune-a-member-of-design-hotels/overview/) | 확인 필요 |
| RMIAS | [Lyra Hotel Rimini Fiera, Series by Marriott](https://www.marriott.com/en-us/hotels/rmias-lyra-hotel-rimini-fiera-series/overview/) | 확인 필요 |
| SHEYC | [Courtyard by Marriott Shenyang](https://www.marriott.com/en-us/hotels/sheyc-courtyard-shenyang/overview/) | 확인 필요 |
| SVQCT | [Confidencia Sevilla, a Tribute Portfolio Hotel](https://www.marriott.com/en-us/hotels/svqct-confidencia-sevilla-a-tribute-porfolio-hotel/overview/) | 확인 필요 |
| SZXQP | [Four Points by Sheraton Shenzhen Qianhai CBD](https://www.marriott.com/en-us/hotels/szxqp-four-points-shenzhen-qianhai-cbd/overview/) | 예약 미개시 |
| TLLCY | [Courtyard by Marriott Tallinn City Center](https://www.marriott.com/en-us/hotels/tllcy-courtyard-tallinn-city-center/overview/) | 확인 필요 |
| UDRNH | [City Express by Marriott Udaipur Nathdwara Highway](https://www.marriott.com/en-us/hotels/udrnh-city-express-udaipur-nathdwara-highway/overview/) | 확인 필요 |
| VIESI | [Hotel Savoyen Vienna](https://www.marriott.com/en-us/hotels/viesi-hotel-savoyen-vienna/overview/) | 확인 필요 |
| WASSE | [Hotel Nell - Union Market, Series by Marriott](https://www.marriott.com/en-us/hotels/wasse-hotel-nell-union-market-series/overview/) | 확인 필요 |
| WUXJW | [JW Marriott Hotel Wuxi](https://www.marriott.com/en-us/hotels/wuxjw-jw-marriott-hotel-wuxi/overview/) | 확인 필요 |

- IXMRT: 공식 목적지 목록에는 요금이 있지만 [공식 개장 안내](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi)는 2027년 3분기입니다. 상충 상태를 보존했습니다.
- CHIRX/JZHAS/LYIIF/SHEYC/UDRNH: HWS 코드·URL은 확인됐으나 상세 페이지 표시명·현재 운영은 미확인입니다. 보류 이름은 URL 기반 검토용 표기입니다.
- BCNCB/PVDTD/VIESI/WUXJW 등: 일반 예약 버튼이나 시설 소개만으로 활성 등록하지 않았습니다.
- 표본 날짜의 매진·요금 불가는 폐업이나 예약 미개시의 증거로 사용하지 않았습니다.

## 기존 활성 5건의 보류 전환

| 코드 | 결정 | 근거 |
| --- | --- | --- |
| ALSSH | 예약 미개시 | [공식 자료](https://www.marriott.com/en-us/hotels/alssh-springhill-suites-alamosa-downtown/overview/) — Marriott 공식 호텔 페이지에서 새 표시명과 예약이 아직 제공되지 않는다는 안내를 확인했습니다. 이전 활성 seed를 삭제 확정하지 않고 보류 목록으로 이동합니다. |
| DPSUJ | 운영 전 | [공식 자료](https://www.marriott.com/en-us/marriott-brands/portfolio/openings.mi) — Marriott 공식 신규 개장 안내에서 2027년 2분기 예정으로 확인됩니다. 일반 예약 화면만으로 운영 확인 처리했던 소스 누락 예외를 철회하고 활성 seed를 보류 목록으로 이동합니다. |
| LGWFP | 확인 필요 | [공식 자료](https://www.marriott.com/en-us/hotels/lgwfp-four-points-london-gatwick-airport/overview/) — 공식 HWS에서 계속 누락되고 기존 공식 호텔 경로에서 현재 Marriott 운영·예약 상태를 재확인하지 못했습니다. 과거 소스 누락 예외를 철회하고 확인 필요로 보류하며 폐업·제휴 종료로 단정하지 않습니다. |
| SOUWX | 확인 필요 | [공식 자료](https://www.marriott.com/en-us/destinations/united-kingdom/winchester/new-hotels.mi) — 공식 HWS에서 계속 누락되고 공식 목적지 목록은 요금 불가이며 현재 Marriott 운영·예약 개시를 재확인하지 못했습니다. 과거 소스 누락 예외를 철회하고 확인 필요로 보류하며 폐업으로 단정하지 않습니다. |
| STNCD | 확인 필요 | [공식 자료](https://www.marriott.com/en-us/dining/restaurant-bar/stncd-delta-hotels-cheshunt/6811008-the-delta-restaurant.mi) — 공식 식음 소개는 남아 있으나 공식 HWS와 호텔 경로에서 현재 Marriott 숙박 운영·예약 상태를 재확인하지 못했습니다. 과거 소스 누락 예외를 철회하고 확인 필요로 보류하며 폐업·제휴 종료로 단정하지 않습니다. |

영구 삭제가 아닙니다. 이름·코드·과거 alias와 근거를 보류 파일에 보존합니다. 특히 영국 3건은 폐업·제휴 종료가 확인된 것이 아니라 기존의 “운영 확인” 예외를 재확인하지 못한 상태입니다. 이 이름이 카드 명세서에 나오면 자동 누락 의심 대신 확인 필요가 됩니다.

## 공식명 변경 13건

| 코드 | 이전 이름 | 새 공식 표시명 |
| --- | --- | --- |
| ABEEH | SpringHill Suites by Marriott Easton PA | [SpringHill Suites by Marriott Easton Bethlehem](https://www.marriott.com/en-us/hotels/abeeh-springhill-suites-easton-bethlehem/overview/) |
| ABEFA | Fairfield by Marriott Inn & Suites Bethlehem PA | [Fairfield by Marriott Inn & Suites Bethlehem Lehigh](https://www.marriott.com/en-us/hotels/abefa-fairfield-inn-and-suites-bethlehem-lehigh/overview/) |
| ATLLP | Residence Inn by Marriott Atlanta Buckhead/Lenox Park | [Residence Inn by Marriott Atlanta Buckhead](https://www.marriott.com/en-us/hotels/atllp-residence-inn-atlanta-buckhead/overview/) |
| AUSFW | Fairfield Inn & Suites Austin West | [Fairfield by Marriott Inn & Suites Austin Southwest](https://www.marriott.com/en-us/hotels/ausfw-fairfield-inn-and-suites-austin-southwest/overview/) |
| DALFP | Fairfield by Marriott Inn & Suites Dallas Plano | [Fairfield by Marriott Inn & Suites Dallas Plano West](https://www.marriott.com/en-us/hotels/dalfp-fairfield-inn-and-suites-dallas-plano-west/overview/) |
| MCOAK | Grand Bohemian Orlando, Autograph Collection | [Hotel Beauden, Autograph Collection](https://www.marriott.com/en-us/hotels/mcoak-hotel-beauden-autograph-collection/overview/) |
| MIASP | UNFRAMED, Autograph Collection | [UNFRAMED, Miami Beach, Autograph Collection](https://www.marriott.com/en-us/hotels/miasp-unframed-miami-beach-autograph-collection/overview/) |
| PHXMR | StudioRes by Marriott Mesa | [StudioRes by Marriott Mesa Gateway Airport](https://www.marriott.com/en-us/hotels/phxmr-studiores-mesa-gateway-airport/overview/) |
| SAVAK | Bohemian Hotel Savannah Riverfront, Autograph Collection | [Hotel Orielle, Autograph Collection](https://www.marriott.com/en-us/hotels/savak-hotel-orielle-autograph-collection/overview/) |
| SBYOT | Ashore Oceanfront Hotel | [Ashore Oceanfront Hotel, Ocean City, a Tribute Portfolio Hotel](https://www.marriott.com/en-us/hotels/sbyot-ashore-oceanfront-hotel-ocean-city-a-tribute-portfolio-hotel/overview/) |
| STFCT | Stamford Marriott Hotel & Spa | [Stamford Marriott](https://www.marriott.com/en-us/hotels/stfct-stamford-marriott/overview/) |
| PSECX | City Centro by Marriott Ponce Plaza Puerto Rico | [City Centro by Marriott Ponce Plaza & Casino, Puerto Rico](https://www.marriott.com/en-us/hotels/psecx-city-centro-ponce-plaza-and-casino-puerto-rico/overview/) |
| SZKAK | Leopard Sands, Kruger Park | [Leopard Sands Kruger Park, Autograph Collection](https://www.marriott.com/en-us/hotels/szkak-leopard-sands-kruger-park-autograph-collection/overview/) |

- ATLLP와 ATLBH는 표시명이 같아졌지만 호텔 동일성·코드 이전이 확인되지 않았습니다. 별도 ID를 유지하며 병합하지 않았습니다.
- GCMGC는 XML에 beach가 추가됐지만 실제 호텔 페이지는 기존 Grand Cayman Marriott Resort로 이동하므로 기존 이름을 유지했습니다.
- PHXLR의 이중 인코딩 공백과 YTYSP의 zero-width 문자 정리는 호텔 이름 변경으로 적용하지 않았습니다.
- 기존 패치에 반영된 Anaheim 2건 등은 그대로 유지합니다.

## 삭제 여부가 아직 확인 필요한 16건

- BJSLY: Courtyard by Marriott Langfang
- HGHHA: Aloft Huzhou
- SZXLP: Four Points by Sheraton Shenzhen Longhua
- TAOZY: Qingdao Zhanqiao Yours Hotel, a Member of Design Hotels™
- XIYCW: Courtyard by Marriott Xi'an West
- CULXC: City Express by Marriott Culiacán
- BOMFP: Four Points by Sheraton Navi Mumbai, Vashi
- MUCAT: Caro & Selig, Tegernsee, Autograph Collection
- NBOMM: Kinara, a Luxury Collection Safari Camp, Masai Mara
- ATLBH: Residence Inn by Marriott Atlanta Buckhead
- DAYLM: Fairfield by Marriott Inn & Suites Lima
- JANCY: Courtyard by Marriott Jackson Ridgeland
- LWCKS: SpringHill Suites by Marriott Lawrence Downtown
- MIAWS: W South Beach
- RSWNS: SpringHill Suites by Marriott Naples
- SRQSH: SpringHill Suites by Marriott Sarasota Bradenton

이들은 공식 XML에서 빠졌다는 사실만 확인된 항목입니다. 일부 공식 상세 페이지·후기는 남아 있지만 모든 호텔의 현재 운영 및 숙박 요금을 동일 기준으로 확인한 것은 아닙니다. 이탈만으로 활성 데이터를 삭제하거나 “운영 확인 소스 누락 예외”로 승인하지 않았습니다. 후속 검토는 현행 공식명·주소·코드·운영사 공지·실제 예약 가용성을 교차 확인해야 합니다.

## 수집기와 검증

- 전체 테스트 488개 통과. 커버리지 statements 98.67%, branches 93.08%, functions 100%, lines 98.85%. lint·정적 production build·diff 공백 검사 통과.
- 수정 후 공식 수집 재검증: 미분류 신규 후보 0건, 수집 오류 0건, 보류/활성 중복 0건. 보류 88건·미검토 소스 이탈 16건은 계속 보고합니다.
- Bvlgari 연락처·예약·식음료 등 비호텔 루트 7종을 도시 후보에서 제외합니다. 공유 예약 위젯의 단일 hotelCode가 호텔 URL을 잘못 덮는 경우를 회귀 테스트로 막았습니다. 신규 도시를 고정 allowlist로 제한하지 않습니다.
- `verification_required`를 추가해 미확인과 명시적 예약 미개시를 분리했습니다. 분류기는 두 경우 모두 확인 필요를 유지합니다.
- 26건의 결정 누락·중복 활성 등록, 보류 5건의 잘못된 예외 잔류, 13건의 안정 ID·옛 alias 손실, 16건의 임의 삭제·승인을 오프라인 회귀 테스트로 검사합니다.
- 이 검토 기록은 모든 활성 호텔 10,306개의 당일 운영을 개별 보증하는 자료가 아닙니다.
- 승인 snapshot을 갱신하지 않았으므로 정기 검사의 변경 감지 알림은 계속 남는 것이 정상입니다. 승인되지 않은 변경을 숨기기 위해 기준 파일을 갱신하지 않았습니다.

### 재현 명령

```bash
npm run hotels:check -- --output-dir .marriott-reports/review
npm run test:coverage
npm run lint
npm run build
```

수집 명령에는 `--write-baseline`을 넣지 않습니다. 인터넷 소스는 이후 달라질 수 있으므로 이번 결과의 재현 여부는 검토 JSON에 기록한 시각·SHA-256과 로컬 원본을 함께 확인합니다.
