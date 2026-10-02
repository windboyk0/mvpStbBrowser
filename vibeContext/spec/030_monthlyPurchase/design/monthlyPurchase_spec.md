# 030_monthlyPurchase — 월정액구매 Spec (v1.0 확정 · v1.1 쿠폰 작성 중)

## 0. 구현 전 필독

1. **`../history/` 폴더의 모든 파일을 날짜순으로 먼저 확인한다.** (개발완료 / 수정이력)
2. 아래 **참고 파일** 목록의 파일을 확인한다.
3. 구현 완료 또는 수정 후에는 `../history/`에 이력을 작성한다. (규칙: 루트 `CLAUDE.md` › Spec 구조)
4. **구현은 `1.1 1차 확정 범위` 만 진행한다.** `추후` 항목은 구현하지 않는다.
   - `1.2 2차 범위 — 쿠폰` 은 **작성 중** — 사용자 구현 지시(2026-10-02)에 따라 확인 필요 항목(Q6 ~ Q12)은 **`1.3 쿠폰 잠정값`** 으로 구현한다. 확인 결과가 바뀌면 수정이력으로 반영
5. **모듈 원칙 (낮은 결합도 · 높은 응집도):** 이 spec 만으로 구현한다. 다른 화면 spec · 소스를 참조하지 않으며, 다른 화면과 **병렬로 동시에** 구현된다. 공유는 루트 `CLAUDE.md` › 화면 모듈 계약(폴더 소유권 · 연결 방식 · 설정값 계약)으로만 한다
6. **실제 서버 주소 · Api_Key · Auth_Val · 계정 등 실제 값을 코드 · 문서에 기재하지 않는다.** 서버 주소 · 식별 정보는 설정값을 사용한다

## 모듈 경계

| 구분 | 내용 |
|---|---|
| 소유 폴더 (생성 · 수정) | `src/renderer/src/screens/monthlyPurchase/**`, `src/main/monthlyPurchase/**`, `vibeContext/spec/030_monthlyPurchase/**` |
| 진입점 | renderer `screens/monthlyPurchase/index.tsx` (default export), main `main/monthlyPurchase/ipc.ts` (`register(ipcMain)`) |
| IPC 채널 | `monthlyPurchase:search` (목록 · 건수), `monthlyPurchase:agreements` (약정 옵션), `monthlyPurchase:purchase` (STB ID 조회 + IF-EPS-001), `monthlyPurchase:checkSettings` (필수 설정 존재 여부), `monthlyPurchase:couponList` (사용가능 쿠폰 조회 — 2차) |
| 사용 (계약) | 설정값 **읽기** — CLAUDE.md › 설정값 계약 대로 store 를 이 모듈 안에서 직접 읽고 복호화. Oracle 접속(oracledb Thin) · IF-EPS-001 호출도 이 모듈 안에서 직접 |
| 사용 (읽기 전용) | 디자인 토큰 `src/renderer/src/styles/*`, `window.api.invoke`, 화면 이동 `app:navigate` 이벤트 |
| 수정 금지 | 다른 화면 폴더, 공통 파일(`App.tsx`, `menus.ts`, `preload/index.ts`, `main/index.ts`, `package.json`) |
| 컴포넌트 | 이 화면에서 쓰는 컴포넌트(팝업 · 행 · 금액 패널 · 구매완료 등)는 모두 `screens/monthlyPurchase/` 안에 둔다 (다른 화면과 공유 · import 금지) |

## 참고 파일

| 구분 | 파일 | 용도 |
|---|---|---|
| 디자인 시안 | `prototype_monthlyPurchase.html` | [A] 상품 조회 · [C] 약정·결제·할인 · [D] 구매완료 (Mock 데이터) |
| Query | `query_productList_{유형}.sql` (7개) | [A] 상품유형별 목록 · 전체 건수 — 매핑은 R1.2 |
| Query | `query_agreementList.sql` | [C] 약정기간 옵션 (무약정 제외) |
| Query | `query_stbId.sql` | IF-EPS-001 요청 직전 STB ID 조회 (이 모듈 소유 사본) |
| Query | `query_couponList.sql` | [C] 사용가능 쿠폰 조회 Procedure 호출 (바인드 변수 · REF CURSOR, Package 정의 전체 복사, 이 모듈 소유 사본) — 2차 |
| Query 원본 | `vibeContext/Reference/020_singlePurchase/Query/사용가능쿠폰조회.txt` | 사용가능 쿠폰 조회 Procedure 원본 — 로컬 전용 · 추후 삭제 (구현에는 위 `query_couponList.sql` 사용) |
| Query 원본 | `vibeContext/Reference/030_monthlyPurchase/Query/*.txt` | 로컬 전용 · 추후 삭제 (구현에는 위 `query_*.sql` 사용) |
| 연동정의서 | `vibeContext/Reference/030_monthlyPurchase/Api/IF-EPS-001.pdf` | 로컬 전용 · 필요한 내용은 이 spec 4. 설계 에 반영됨 |
| 디자인 토큰 | 루트 `CLAUDE.md` › Design Tone | |

---

## 1. 개요

메인 › 월정액구매 진입 시 **가입가능 월정액 상품을 자동 조회** → 상품 선택(구매 확인 팝업) → 약정 · 결제 · 할인 수단 선택 → 구매 요청(IF-EPS-001) → 구매완료.

### 1.1 1차 확정 범위

| 구분 | 1차 (구현) | 추후 |
|---|---|---|
| [A] 상품 조회 | 전체 (검색조건 상품유형 · 상품명, 진입 시 자동 조회, 목록, 페이지, 구매 확인 팝업) | — |
| [C] 약정 선택 | 전체 (무약정 + 약정기간 옵션, 가격, 약정필수 규칙) | — |
| [C] 결제 수단 | **청구서** 만 활성 | 청구서 외 6개 |
| [C] 할인 수단 | 쿠폰 · T멤버십 **2개만 표시, 비활성** | 쿠폰번호 · T멤버십 정보 조회 후 활성 |
| 구매 요청 | IF-EPS-001 | — |
| [D] 구매완료 | 전체 | — |

- 추후 항목의 행은 화면에 표시하되 **비활성**(☒, 클릭 불가)

### 1.2 2차 범위 — 쿠폰 (작성 중)

할인 수단을 **하나씩** 추가한다. 2차는 **쿠폰만** 다룬다 (T멤버십은 계속 비활성).

| 구분 | 2차 (구현) | 추후 |
|---|---|---|
| [C] 할인 수단 쿠폰 | 진입 시 사용가능 쿠폰 조회 (DB Procedure, `query_couponList.sql`), 쿠폰 목록에서 1장 선택, 할인 금액 반영 (R5) | — |
| 구매 요청 | IF-EPS-001 `useCoupon` / `couponNo` | — |

- 쿠폰과 다른 할인 수단을 함께 쓸 때의 규칙은 **2차에서 다루지 않는다** (할인 수단별로 따로 진행)
- 할인 금액은 Procedure 결과값을 사용한다 — **IF-EPS-005(할인금액조회)는 사용하지 않는다**

### 1.3 쿠폰 잠정값 (제가 정한 부분 — 확인 필요, 구현은 이 값으로)

| # | 항목 | 잠정값 |
|---|---|---|
| Q6 | 파라미터 | `I_ID_CUST_SVC` = 서비스관리번호, `I_ID_PRODUCT` = 선택 행 `ID_PRODUCT`, `I_PRD_AGMT_ID` = 선택 약정 `PRD_AGMT_ID`(무약정 NULL), `I_CTZ_CORP_SER_NUM` = 서비스관리번호로 `IESM_CUST_SVC` 조회 (Query 내부) |
| Q7 | `I_AMT_PRICE` | 선택 약정 옵션 가격 (부가세 포함) |
| Q8 | 약정 변경 시 | 파라미터(약정 ID · 금액)가 바뀌므로 **쿠폰 재조회 + 적용 중인 쿠폰 해제**. 결과 `PRD_AGMT_ID` 는 별도 필터하지 않음 (Procedure 결과 그대로) |
| Q9 | 쿠폰명 / 쿠폰번호 / 유효기간 | `NM_COUPON` / `NO_COUPON` → `couponNo` / `DD_APPLY_END` |
| Q10 | 할인 금액 | `AMT_DISCOUNT` = 부가세 포함 기준 할인액, **상품 금액을 넘으면 상품 금액까지만** |
| Q11 | 쿠폰 조회 실패 | 쿠폰 행 비활성(☒) + 쿠폰 행에 `조회에 실패했습니다. ({오류 메시지})` (`danger`) |
| Q12 | 쿠폰 선택 팝업 | 4. 설계 › 쿠폰 선택 팝업 안 그대로 |

## 2. 화면 흐름

```
메인 ─▶ [A] 상품 조회 (진입 시 자동 조회) ─(행 클릭 → 구매 확인 팝업)─▶ [C] 약정·결제·할인 ─(N원 결제)─▶ [D] 구매완료
             ▲                                                              │ 구매취소                    │ 홈으로 → 메인
             └──────────── 조회조건 · 페이지 유지 + 자동 조회 ◀──────────────┴─────────────────────────────┘ 구매 계속하기
```

### 공통 동작 — "조회 화면으로 복귀"
`[구매취소]` ([C]), `[구매 계속하기]` ([D]) 는 동일하게 동작한다.
- [A] 로 이동하면서 **직전 조회조건(상품유형, 상품명)과 페이지를 유지**하고 **자동 재조회**
- 이 화면 내부 상태로 관리 (다른 화면과 공유하지 않음)

---

## 3. 요구사항

### R0. 진입 조건
- R0.1 진입 시 `monthlyPurchase:checkSettings` 로 필수 설정(`serverUrl`, `svcMgmtNo`, `dbConnectString`, `dbUser`, `dbPasswordEnc`) 확인
- R0.2 하나라도 없으면 팝업 `설정을 먼저 입력해 주세요.` — `[취소]` → `app:navigate` `main`, `[설정으로]` → `app:navigate` `settings`
- R0.3 설정이 모두 있으면 R1.4 자동 조회

### R1. [A] 상품 조회
- R1.1 가입가능 월정액 상품을 Oracle 에서 조회 (`query_productList_{유형}.sql`)
- R1.2 검색 조건 2개
  - **상품유형** (선택, 기본 `전체`) — WHERE 조건이 아니라 **선택값에 따라 실행할 Query 파일을 바꾼다** (쿼리 분리)

| 상품유형 선택 | 실행 Query | 조회 대상 (`GUBUN`) |
|---|---|---|
| 전체 | `query_productList_all.sql` | CUG · OMNI 제외 전 유형 |
| VOD | `query_productList_vod.sql` | VOD (VOD PPM / 복합 VOD PPM) |
| CMP | `query_productList_cmp.sql` | CMP (PPM커머스, PRD_TYP_CD 36) |
| YTP | `query_productList_ytp.sql` | YTP |
| DNP | `query_productList_dnp.sql` | DNP |
| VAS | `query_productList_vas.sql` | VAS |
| IPTV | `query_productList_iptv.sql` | IPTV |

  - 선택 표시명은 `GUBUN` 코드 그대로 (목록 `구분` 컬럼과 동일)
  - **CUG · OMNI 는 조회하지 않는다** (Query 에 반영됨)
  - **상품명** (텍스트) — NULL 또는 빈 문자열이면 전체, 대소문자 구분 없음. 모든 유형 Query 에 동일 적용
  - 검색 실행: `[검색]` 클릭 또는 상품명 입력 중 Enter → 1페이지로 이동
- R1.3 바인드 변수: `:svcMgmtNo` (설정값), `:prdNm` (빈 문자열 → NULL), `:offset` ((페이지-1)×10), `:pageSize` (10). **문자열 결합 금지**
  - 주민법인일련번호는 Query 내부에서 서비스관리번호로 조회됨 (별도 입력 없음)
- R1.4 **메인에서 진입 시 자동 조회** (상품유형 전체, 상품명 빈 값)
- R1.5 결과 목록 컬럼 (Query 결과 전체)

| 컬럼 | 필드 | 비고 |
|---|---|---|
| 구분 | `GUBUN` | |
| 상품ID | `ID_PRODUCT` | IF-EPS-001 Path `{상품가격ID}` |
| 상품명 | `NM_PRODUCT` | |
| 패키지ID | `ID_PACKAGE` | |
| 상위상품ID | `ID_PRODUCT_PAR` | |
| PPM유형 | `TP_PPM` | |
| 가격 | `AMT_PRICE` | **부가세 포함**, 우측 정렬 + `원` |
| 무료가입기간 | `PPM_FREE_JOIN_PERD_CD` | 코드 그대로 |
| 약정필수 | `AGMT_MNDT_YN` | Y / N |

- R1.6 정렬: `NM_PRODUCT` → `ID_PRODUCT` 오름차순 (Query 에 반영됨)
- R1.7 페이지 처리: **페이지당 10건**, 페이지 번호 / 이전 / 다음. 목록 Query + 건수 Query(같은 파일 내 2개 문). 최소 창 크기(1280×800)에서 세로 스크롤 없이 표시
- R1.8 결과 없음: 목록 영역에 `조회된 상품이 없습니다`
- R1.9 조회 실패 (DB 접속 · Query 오류): 목록 영역에 `조회에 실패했습니다. ({오류 메시지})` (`danger`), 건수 · 페이지 숨김, `[검색]` 으로 재시도
- R1.10 행 클릭 → 확인 팝업 `[상품명] 을 구매하겠습니까?` — `[확인]` → [C] / `[취소]` 또는 Esc · 배경 클릭 → 팝업 닫기

### R2. [C] 약정 · 결제 · 할인 수단 선택
- R2.1 상단 가운데: 상품명(크게), 안내문구 `결제 및 할인 수단을 선택해 주세요.` (스텝 칩 없음)
- R2.2 **약정 선택** (라디오, 단일 선택) — 첫 번째 컬럼
  - 옵션 구성

    | 옵션 | 표시 | 가격 | `prdAgmtId` |
    |---|---|---|---|
    | 무약정 (약정필수 N 일 때만, **조회 없이 화면에서 생성**) | `무약정` | 목록의 `AMT_PRICE` | null |
    | 약정기간 (`query_agreementList.sql`, `:prdPrcId` = 선택 행 `ID_PRODUCT`) | `{PER_MM_CNTR}개월` | `AMT_SALE` (부가세 포함) | `PRD_AGMT_ID` |

  - **무약정은 약정 Query 로 조회하지 않는다** (약정기간 0, 가격 = 상품 금액)
  - **약정필수(`AGMT_MNDT_YN`) = Y** 상품은 `무약정` 옵션 없음
  - 순서: 무약정 → 개월 수 오름차순. 기본 선택: 첫 번째 옵션
  - 선택 변경 시 결제 금액 패널 · `[N원 결제]` 금액 즉시 반영
  - 약정필수 Y 인데 약정 Query 0건: `선택 가능한 약정이 없습니다`, `[N원 결제]` 비활성
  - 약정 Query 실패: 약정 영역에 `조회에 실패했습니다. ({오류 메시지})`, `[N원 결제]` 비활성
  - 참고(표시하지 않음): `CNTR_NAME`, `AMT_DSC`, `RT_DSC`
- R2.3 **결제 수단** (라디오) — 청구서, 신용카드, 휴대폰, 카카오페이, 네이버페이, PAYCO, SK pay. 1차는 **청구서만 활성(기본 선택)**, 나머지 비활성
- R2.4 **할인 수단** (체크박스) — **쿠폰, T멤버십 2개만**. 1차는 **둘 다 비활성**(☒), 금액 `0원`
- R2.5 **결제 금액** 패널: 상품 금액 = 선택한 약정 옵션 가격 (부가세 포함) / 할인 금액 = `0원` / 부가세 = `포함` / 구매 금액 = 상품 금액 − 할인 금액 (밑줄 강조)
- R2.6 하단 액션바 (화면 하단 고정): `상품 선택 내역` = `{상품명} | {무약정 또는 N개월}`, 버튼 `[구매취소]` `[N원 결제]` (`[N원 결제]` 만 `primary`)
- R2.7 `[구매취소]` → 2. 공통 동작, `[N원 결제]` → R3 구매 요청 → [D]

### R3. 구매 요청 (main, `monthlyPurchase:purchase`)
- R3.1 순서: ① `query_stbId.sql` 로 STB ID 조회 → ② IF-EPS-001 호출 → ③ 결과를 [D] 로 전달
- R3.2 STB ID 0건: 호출하지 않고 에러 `서비스관리번호에 해당하는 STB가 없습니다.` / 조회 실패: `조회에 실패했습니다. ({오류 메시지})`
- R3.3 요청 매핑은 4. 설계 › IF-EPS-001 요청 매핑

### R4. [D] 구매완료
- R4.1 성공(`result = "0000"`): ✔ + `구매가 완료되었습니다.`
- R4.2 에러: ✖ + 응답 `reason` (`\n` 문자열은 줄바꿈 처리). 응답 없음(통신 오류): `구매 요청에 실패했습니다.` / R3.2 에러 메시지
- R4.3 버튼: `[홈으로]` → `app:navigate` `main`, `[구매 계속하기]` (`primary`) → 2. 공통 동작
- R4.4 참고(표시하지 않음): `senderPurchaseNo`, `purchaseType`(`VODPPM` / `IPTVPPM`), `productName`, `needsCancel`, `purchaseList`

### R5. [C] 할인 수단 쿠폰 (2차 — 작성 중)
- R5.1 **[C] 화면 진입 시** main 에서 사용가능 쿠폰을 조회한다 (`monthlyPurchase:couponList`, `query_couponList.sql`)
  - Procedure `BTVSMS.UI5_ITP_PKG_COUPON_APPLY_LIST.P_COPN_APLYPSBL_LIST` 호출, OUT REF CURSOR 결과를 전부 읽는다
  - 약정 옵션 변경 시 재조회 여부 — 확인 필요 (Q8, 잠정: 재조회 + 적용 쿠폰 해제)
- R5.2 입력 파라미터 (바인드 변수)

| 파라미터 | 값 | 상태 |
|---|---|---|
| `I_ID_CUST_SVC` | 설정 › 서비스관리번호 (`svcMgmtNo`) | 확인 필요 (Q6) |
| `I_ID_PRODUCT` | 선택 행 `ID_PRODUCT` | 확인 필요 (Q6) |
| `I_PRD_AGMT_ID` | 선택 약정 옵션의 `PRD_AGMT_ID`, 무약정 = NULL | 확인 필요 (Q6) |
| `I_ID_CONTENTS` | NULL | — |
| `I_AMT_PRICE` | 선택 약정 옵션 가격 (부가세 포함) | 확인 필요 (Q7) |
| `I_CTZ_CORP_SER_NUM` | 주민법인일련번호 — 같은 PL/SQL 블록 안에서 `SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo` 로 조회해 전달 (상품 조회 Query 와 같은 방식, 별도 입력 없음) | 확인 필요 (Q6) |

- 실행 형태: `query_couponList.sql` 은 **PL/SQL 익명 블록** (`DECLARE … BEGIN … END;`) — `connection.execute` 로 실행하고 OUT 바인드 `couponCursor` (`type: oracledb.CURSOR, dir: oracledb.BIND_OUT`) 의 ResultSet 을 끝까지 읽은 뒤 닫는다
  - **끝의 `END;` 세미콜론을 제거하지 않는다** — 기존 `sql.ts` 는 Query 끝 `;` 를 제거하므로 이 파일에는 적용하지 않아야 함 (헤더 주석 제거는 그대로 사용 가능, 목록/건수 분리 대상 아님)
  - 서비스관리번호가 `IESM_CUST_SVC` 에 없으면 `ORA-01403` → 조회 실패 (R5.6)
- R5.3 결과 필드 사용

| 결과 필드 | 사용 | 상태 |
|---|---|---|
| `NO_COUPON` | 쿠폰번호 → IF-EPS-001 `couponNo` | 제가 정한 부분 (Q9) |
| `NM_COUPON` / `NM_COUPON2` | 화면 쿠폰명 — 둘 중 어느 쪽인지 | 확인 필요 (Q9) |
| `AMT_DISCOUNT` | 할인 금액 | 부가세 포함 기준 여부 확인 필요 (Q10) |
| `DD_APPLY_END` / `EXPIRE_DAY` | 쿠폰 목록의 유효기간 표시 | 제가 정한 부분 (Q9) |
| `PRD_AGMT_ID` / `PRD_AGMT_PERD_CD` | 쿠폰 대상 약정 — 선택 약정과 맞지 않는 쿠폰 처리 | 확인 필요 (Q8) |
| 그 외 (`FG_DISC`, `VAL_DISC`, `YN_DUP_APPLY`, `LANDING_*`, `DTL_DESC`, `PPM_DC_MON` …) | 2차 미사용 | — |

- R5.4 **쿠폰 0건이면 쿠폰 행 비활성**(☒, 클릭 불가, 금액 `0원`) — 1차와 같은 표시
- R5.5 쿠폰이 1건 이상이면 쿠폰 행 활성 → **목록을 보여 주고 사용자가 1장 고른다** (4. 설계 › 쿠폰 선택 팝업)
  - 선택하면 쿠폰 행 체크 + 쿠폰명 · 할인 금액 표시 → 결제 금액 패널 할인 금액 · 구매 금액 · `[N원 결제]` 반영
  - 체크 해제 시 쿠폰 미적용 (할인 금액 `0원`)
- R5.6 조회 실패 (DB 접속 · Procedure 오류) 시 처리 — 확인 필요 (Q11)
- R5.7 결제 금액: 상품 금액 = 선택 약정 가격 (부가세 포함) / 할인 금액 = `-AMT_DISCOUNT` / 부가세 = `포함` / 구매 금액 = 상품 금액 − 할인 금액. 할인 금액이 상품 금액보다 클 때 처리 — 확인 필요 (Q10)
- R5.8 구매 요청: 쿠폰 적용 시 IF-EPS-001 `useCoupon: true`, `couponNo: NO_COUPON` / 미적용 시 `false` / null

---

## 4. 설계

### 레이아웃 — [A] 상품 조회

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ 상품유형 [ 전체       ▾ ]   상품명 [ 상품명 입력 (비우면 전체)            ]  [검색] │
 └──────────────────────────────────────────────────────────────────────────┘
 총 N건
 ┌────┬────────┬──────────────┬────────┬──────────┬───────┬────────┬────────────┬────────┐
 │구분│ 상품ID │ 상품명       │패키지ID│상위상품ID│PPM유형│   가격 │무료가입기간│약정필수│  ← 10행, 클릭 → 팝업
 └────┴────────┴──────────────┴────────┴──────────┴───────┴────────┴────────────┴────────┘
                          ‹  1  2  3  4  5  ›
```

| 요소 | 값 |
|---|---|
| 검색 영역 | `surface` 카드(모서리 12px), select + input + `[검색]`(`primary`) |
| 목록 | 테이블, 헤더 13px `text-2`, 행 높이 44px, hover 배경 `surface-2`, 가격 우측 정렬 |
| 페이지 | 가운데 정렬, 36px 정사각 버튼, 현재 페이지 `primary` 배경 |

### 레이아웃 — 구매 확인 팝업
- 화면 가운데 모달(폭 480px, `surface`, 모서리 14px), 배경 어둡게
- 문구 `[상품명] 을 구매하겠습니까?`, 버튼 `[취소]` `[확인]`(`primary`)

### 레이아웃 — [C] 약정 · 결제 · 할인

```
                                      {상품명}
                              결제 및 할인 수단을 선택해 주세요.
 약정 선택          │ 결제 수단    │ 할인 수단                      │ 결제 금액
 ◉ 무약정   9,900원 │ ◉ 청구서     │ ☒ 쿠폰                  0원    │ 상품 금액    {선택 약정 가격}
 ○ 12개월   8,900원 │ ☒ 신용카드   │ ☒ T멤버십               0원    │ 할인 금액        0원
 ○ 24개월   7,900원 │ ☒ 휴대폰     │                                │ 부가세          포함
                    │ ☒ …         │                                │ 구매 금액    {선택 약정 가격}
 ─────────────────────────────────────────────────────────────────────────────────
 상품 선택 내역  {상품명} | 무약정                           [구매취소] [N원 결제]
```

| 요소 | 값 |
|---|---|
| 컬럼 폭 | 약정 230px · 결제 수단 200px · 할인 수단 가변 · 결제 금액 320px |
| 선택 행 | 상하 구분선, hover 시 테두리 `focus`, 선택 시 텍스트 `focus`, 라디오 선택 원 `focus` |
| 비활성 행 | 투명도 0.55, 클릭 불가, 체크박스 `✕` |
| 결제 금액 패널 | `surface` 카드, 구매 금액 26px + 밑줄 `primary` |
| 하단 액션바 | 배경 `#120F26`, 상단 1px 라인, 버튼 높이 약 56px |

### 레이아웃 — 쿠폰 선택 팝업 (2차 — 작성 중, 제가 정한 부분 Q12)

```
        ┌────────────────────────────────────────────────┐
        │ 쿠폰 선택                                       │
        │ ─────────────────────────────────────────────  │
        │ {쿠폰명}                 ~{유효기간}   -N원     │ ← 행 클릭 = 선택 · 팝업 닫힘
        │ {쿠폰명}                 ~{유효기간}   -N원     │
        │ …                                    (세로 스크롤) │
        │                                       [취소]   │
        └────────────────────────────────────────────────┘
```
- 열기: [C] 쿠폰 행(미적용 상태) 클릭. 화면 가운데 모달(`surface`, 모서리 14px), 배경 어둡게. Esc / 배경 클릭 / `[취소]` = 선택 없이 닫기
- 행 hover: 테두리 `focus` + 배경 `surface-2`. 이미 적용 중인 쿠폰은 텍스트 `focus`
- 적용된 상태에서 쿠폰 행 클릭 = 체크 해제 (R5.5)
- 쿠폰 행에 `자동 적용` 말풍선은 표시하지 않음 (사용자 선택)

### 레이아웃 — [D] 구매완료
- 화면 가운데: 아이콘(✔ 성공 `#3DDC97` / ✖ 에러 `danger`, 64px) → 메시지 24px → `[홈으로]` `[구매 계속하기]`(`primary`)

### IF-EPS-001 요청 매핑 (main)

- `POST {serverUrl}/eps/v5/payment/product/{ID_PRODUCT}?method=POST` (`contentId` 미전송)
- Header — 값이 없는 항목은 빈 문자열

| Header | 값 |
|---|---|
| `Content-Type` | `application/json` |
| `Api_Key` · `Auth_Val` · `Client_IP` · `Referer` | 빈 값 |
| `Client_ID` | STB ID (`query_stbId.sql`) |
| `TimeStamp` | 요청 시각 `YYYYMMDDHHmmss.SSS` |
| `Trace` | `IPTV` |

| Body 필드 | 값 |
|---|---|
| `if` | `"IF-EPS-001"` |
| `ver` | `"5.0"` |
| `ui_name` | `"BTVUH2V500"` |
| `client_name` | null |
| `response_format` | `"json"` |
| `stb_id` | STB ID (`query_stbId.sql`) |
| `mac` | 생략 |
| `requestDateTime` | 요청 시각 `YYYYMMDDHH24MISS` |
| `prdAgmtId` | 선택 약정의 `PRD_AGMT_ID`, 무약정 = null |
| `useCoupon` / `couponNo` | 쿠폰 적용 시 `true` / `NO_COUPON`, 미적용 시 `false` / null (2차 — R5.8, 1차는 `false` / null) |
| `useBcash` · `useNewBpoint` | `false` |
| `useUniverseDiscount` · `useUniversePoint` · `useTmembership` | `false` |
| `useOcb` / `ocbAmount` / `ocbSequence` / `ocbPassword` | `false` / `0` / `0` / null |
| `useTvpoint` / `tvpointAmount` | `false` / `0` |
| `paymentType` | 청구서 = null |
| `ifSequence` / `totalAmount` / `phoneData` | null |
| `track_id` / `session_id` / `cw_call_id` | 빈 값 |

- Response: `result` (`"0000"` 성공), `reason` (메시지). HTTP 상태는 항상 200, `result` 로 성공/실패 판단

### 소스 위치
- renderer: `src/renderer/src/screens/monthlyPurchase/` (화면 · 팝업 · 행 · 금액 패널 · 구매완료 컴포넌트 전부)
- main: `src/main/monthlyPurchase/` (설정값 읽기 · 복호화, oracledb 접속, Query 파일 로드 · 실행, IF-EPS-001 호출, `ipc.ts`)
- Query 파일은 빌드 산출물에서 읽을 수 있도록 main 모듈에 포함 (예: `?raw` import 로 문자열 번들)

---

## 5. 작업 목록

> 1차 확정 범위(1.1) 기준. 선행: `010_main` T10 ~ T13 (자동 연결 · 의존성) 만. 설정 · 단건구매 화면과 **의존 없음 — 병렬 구현**

- [x] T1. 진입점 `screens/monthlyPurchase/index.tsx` + `main/monthlyPurchase/ipc.ts` 생성 (자동 연결), 진입 조건 팝업 — R0
- [x] T2. main 설정값 읽기 · 복호화 + oracledb 접속 헬퍼 (이 모듈 안) — 모듈 경계
- [x] T3. `monthlyPurchase:search` — 상품유형 → `query_productList_{유형}.sql` 선택 실행, 바인드, 목록 · 건수 — R1.1 ~ R1.7
- [x] T4. [A] 상품 조회 화면 (상품유형 · 상품명, 자동 조회, 9컬럼, 페이지, 결과 없음 · 실패 표시) — R1
- [x] T5. 구매 확인 팝업 — R1.10
- [x] T6. `monthlyPurchase:agreements` — `query_agreementList.sql` — R2.2
- [x] T7. [C] 화면 (약정 · 결제 수단 · 할인 수단 · 금액 패널 · 액션바) + 약정 선택 규칙 단위 테스트 — R2
- [x] T8. `monthlyPurchase:purchase` — STB ID 조회 → IF-EPS-001 요청 · 응답 파싱 — R3, 4. 설계 › IF-EPS-001 요청 매핑
- [x] T9. [D] 구매완료 화면 + `[구매취소]` / `[구매 계속하기]` 복귀 (조건 · 페이지 유지 자동 조회) — R4, 2. 공통 동작

### 2차 — 쿠폰 (작성 중 · `1.3 쿠폰 잠정값` 으로 구현)
- [x] T10. `monthlyPurchase:couponList` — `query_couponList.sql` Procedure 호출 · REF CURSOR 읽기 (끝 `;` 유지) — R5.1 ~ R5.3, R5.6
- [x] T11. [C] 쿠폰 행 활성화 + 쿠폰 선택 팝업 (0건 비활성, 선택 · 해제) — R5.4, R5.5, 4. 설계 › 쿠폰 선택 팝업
- [x] T12. 결제 금액에 쿠폰 할인 반영 + 단위 테스트 (쿠폰 미적용 / 적용) — R5.7
- [x] T13. IF-EPS-001 `useCoupon` / `couponNo` 매핑 + 단위 테스트 — R5.8

- 추후: T멤버십 활성, 할인 수단 동시 적용 규칙, 청구서 외 결제 수단

---

## 6. 확인 필요 사항

| # | 항목 | 결정 |
|---|---|---|
| Q1 | 가격 부가세 표시 | 부가세 포함으로 표시 |
| Q2 | CUG 행 | 조회에서 제외 |
| Q3 | `'802059'` | 주민법인일련번호 — 서비스관리번호로 조회 (Query 내부) |
| Q4 | 약정 Query | `query_agreementList.sql` 반영 |
| Q5 | OMNI | 조회에서 제외 |
| Q6 | 쿠폰 파라미터: `I_ID_CUST_SVC` = 서비스관리번호, `I_ID_PRODUCT` = `ID_PRODUCT`, `I_PRD_AGMT_ID` = 선택 약정 `PRD_AGMT_ID`(무약정 NULL), `I_CTZ_CORP_SER_NUM` = 서비스관리번호로 조회한 주민법인일련번호 — 맞는지 | 확인 필요 |
| Q7 | 쿠폰 `I_AMT_PRICE` = 선택 약정 옵션 가격(부가세 포함) 인지 | 확인 필요 |
| Q8 | 약정 옵션 변경 시 쿠폰 재조회 여부 / 적용 중인 쿠폰 처리, 결과 `PRD_AGMT_ID` 와 선택 약정이 다른 쿠폰 처리 | 확인 필요 |
| Q9 | 쿠폰명 `NM_COUPON` / `NM_COUPON2` 중 표시 필드, `NO_COUPON` → `couponNo`, 유효기간 `DD_APPLY_END` 표시 (제가 정한 부분) | 확인 필요 |
| Q10 | `AMT_DISCOUNT` 부가세 포함 기준 여부, 할인 금액 > 상품 금액 처리 | 확인 필요 |
| Q11 | 쿠폰 조회 실패 시 표시 (쿠폰 행 비활성만 / 오류 메시지 등) | 확인 필요 |
| Q12 | 쿠폰 선택 팝업 구성 · 해제 방식 · `자동 적용` 말풍선 미표시 (제가 정한 부분) | 확인 필요 |
| Q13 | 쿠폰 조회 IF-EPS-005(할인금액조회) | 사용 안 함 — Procedure `AMT_DISCOUNT` 사용 |
