# 20261002 수정이력 — 020_singlePurchase

## 16:15 2차 쿠폰 — 조회 · 선택 · 금액 반영 · IF-EPS-001 매핑 (잠정값 구현)
- 작업: T11, T12, T13, T14 (사용자 구현 지시 2026-10-02 — 확인 필요 항목 Q18 ~ Q25 는 spec `1.3 쿠폰 잠정값` 으로 구현)
- 변경 파일:
  - main (`src/main/singlePurchase/`)
    - `sql/couponList.sql` — spec `query_couponList.sql` 사본 (PL/SQL 익명 블록, 헤더 주석 유지 · Package 정의 주석은 원본 참조로 대체), `?raw` import 로 번들
    - `db.ts` — `withConnection` 콜백에 두 번째 인자 `db` 추가 (`query` / `queryCursor`). `queryCursor` 는 PL/SQL 블록을 **끝 `;` 제거 없이** 실행하고 OUT 바인드(`oracledb.CURSOR`, `BIND_OUT`) ResultSet 을 100건씩 끝까지 읽은 뒤 닫는다 (outFormat OBJECT). 기존 `query` 동작(끝 `;` 제거)은 그대로
    - `coupon.ts` — 신규. `singlePurchase:couponList` 처리: 바인드 `svcMgmtNo`(설정 서비스관리번호) · `idProduct`(`PRD_PRC_ID`) · `prdAgmtId`/`idContents`(NULL) · `amtPrice`(`SALE_PRC`). 결과 `NO_COUPON` / `NM_COUPON` / `AMT_DISCOUNT` / `DD_APPLY_END` → `CouponRow`. 실패 시 예외 대신 `{ ok: false, message }`
    - `ipc.ts` — `singlePurchase:couponList` 등록
    - `eps.ts` — 입력 `couponNo` 추가 → Body `useCoupon: true` + `couponNo` / 미적용(null · 생략 · 빈 값) 시 `false` / null
    - `purchase.ts` — 요청의 `couponNo` 를 정리해 IF-EPS-001 로 전달
    - `types.ts` — `PurchaseRequest.couponNo`, `CouponListRequest`, `CouponRow`, `CouponListResult`
    - `eps.test.ts` — 쿠폰 매핑 테스트 3건 추가
  - renderer (`src/renderer/src/screens/singlePurchase/`)
    - `index.tsx` — `[다음]`(Step 1 → Step 2) 시 쿠폰 조회, 조회 상태 · 적용 쿠폰 보관, 구매 요청에 `couponNo` 전달. [A] 에서 상품 새로 선택 시 적용 쿠폰 초기화
    - `Step2View.tsx` — 쿠폰 행: 조회 중 / 실패 / 0건 비활성(☒), 1건 이상 활성 → 클릭 시 쿠폰 선택 팝업, 적용 중 클릭 = 해제. 설명 영역 쿠폰명(`focus`), 금액 영역 할인 금액
    - `components.tsx` — `CouponModal` (쿠폰명 · `~유효기간` · `-할인금액`, 행 클릭 = 선택 · 닫힘, Esc / 배경 / `[취소]` = 닫기, 적용 중 쿠폰 텍스트 `focus`)
    - `amount.ts` — `couponDiscountOf`, `calcCouponAmount` 추가 (기존 `calcAmount` 변경 없음)
    - `amount.test.ts` — 쿠폰 테스트 3건 추가 (전액 / 부분 / 할인 금액 초과 cap)
    - `types.ts`, `singlePurchase.module.css` (`descError`, 쿠폰 팝업 스타일)
  - `design/singlePurchase_spec.md` — 작업 목록 T11 ~ T14 체크
- 내용:
  - 쿠폰 행 `자동 적용` 말풍선 표시하지 않음 (4. 설계 › 쿠폰 선택 팝업)
  - 조회 실패: 쿠폰 행 비활성(☒) + 설명 영역 `조회에 실패했습니다. ({오류 메시지})` (`danger`) — Q24 잠정값
  - 금액: 할인 금액 = `AMT_DISCOUNT` (상품 금액 초과 시 상품 금액까지), 부가세 = (상품 금액 − 할인 금액) × 10%, 구매 금액 = 상품 금액 − 할인 금액 + 부가세 — Q23 잠정값
  - 1차 B캐시 계산 · 동작 · 테스트 결과 변경 없음. 쿠폰 + B캐시 동시 적용 규칙은 추가하지 않음
- 관련 spec: 1.2, 1.3, R6.1 ~ R6.7, 4. 설계 › 쿠폰 선택 팝업 / 금액 계산 › 쿠폰 적용 시 / IF-EPS-001 요청 매핑
- 검증:
  - `npm run build` (typecheck + electron-vite build) 통과, `npx eslint .` 통과, `npm test` 47건 통과 (이 화면 14건: 금액 6, IF-EPS-001 8 — 신규 6건)
  - 빌드 산출물에 쿠폰 PL/SQL 블록이 `END;` 포함 상태로 번들됨 확인
  - **실 DB(Procedure) · STG 서버 연동은 미검증** (접속 정보 없음). 파라미터 값은 전부 **잠정값** (Q18 ~ Q23)
- 제가 정한 부분 (확인 필요):
  - 쿠폰 조회 시점: Step 1 `[다음]` 으로 Step 2 에 들어올 때마다 재조회. 이미 적용한 쿠폰은 새 결과에 같은 쿠폰번호가 있으면 유지, 없으면 해제
  - 조회 중 쿠폰 행은 비활성(☒) + 설명 `조회 중…` (기존 [A] 목록의 `조회 중…` 표현과 동일)
  - B캐시와 쿠폰을 둘 다 체크한 경우: 결제 금액 패널은 1차 B캐시 계산 그대로(B캐시 우선), 쿠폰 행 금액은 쿠폰 할인액 표시, IF-EPS-001 은 `useBcash` · `useCoupon` 둘 다 체크 상태대로 전송 (조합 규칙 확정 전 임시)
  - 쿠폰 선택 팝업의 `-N원` 은 `AMT_DISCOUNT` 원값 표시 (cap 은 Step 2 쿠폰 행 · 결제 금액에만 적용)
  - `DD_APPLY_END` 는 문자열이면 그대로, DATE 로 오면 `YYYYMMDD` 로 표시
  - 쿠폰번호(`NO_COUPON`) 가 빈 행은 `couponNo` 로 보낼 수 없어 목록에서 제외
- 비고:
  - 결과 컬럼 형식(`DD_APPLY_END` 형식, `AMT_DISCOUNT` 기준) 은 실 DB 확인 후 조정 필요
  - Q18 ~ Q25 확인 결과가 잠정값과 다르면 `coupon.ts` 바인드 · `amount.ts` 계산 · spec 1.3 을 함께 수정

## 16:40 상품 조회 DB 링크 `@REPORT` 제거
- 작업: 수정 사유 — 실 DB 상품 조회 시 `ORA-02019: connection description for remote database not found` (접속 DB 에 DB 링크 `REPORT` 없음)
- 변경 파일: `vibeContext/spec/020_singlePurchase/design/query_productList.sql`, `src/main/singlePurchase/sql/productList.sql`, `src/main/singlePurchase/sql/productCount.sql`, `design/singlePurchase_spec.md` (4. 설계 › 조회 Query)
- 내용: 원본 `PPU_Select_Query.txt` 를 옮길 때 남아 있던 `BTVCMS.PD_PRD_PRC_DTS@REPORT`, `BTVCMS.PD_PRD_MST@REPORT` 의 `@REPORT` 제거 → 접속 DB 에서 `BTVCMS` 테이블 직접 조회 (사용자 지시)
- 관련 spec: R1.1, 4. 설계 › 조회 Query
- 비고: 실 DB 재조회 확인 필요 (`BTVCMS` 스키마 조회 권한)

## 17:00 Step 1 `언어` 컬럼 → `시청가능기간` 으로 대체
- 작업: 수정 사유 — 사용자 지시 (참고 화면의 언어 대신 시청가능기간 표시)
- 변경 파일: `src/renderer/src/screens/singlePurchase/Step1View.tsx`, `Step2View.tsx`, `design/singlePurchase_spec.md` (1.1, R2.2, R2.4, R2.6, 레이아웃 — Step 1, Step 1 1차 데이터), `design/prototype_singlePurchase.html`
- 내용:
  - Step 1 컬럼: `상품 유형 | 언어 | 화질` → `상품 유형 | 시청가능기간 | 화질`. 시청가능기간 = `VIEW_PERIOD`, 빈 값이면 `(시청가능기간 빈 값)`
  - 상품 선택 내역 (Step 1 · Step 2 액션바): `{유형} | {시청가능기간} | {해상도}` (빈 값 생략). 부가문구(`note`) 자리 미사용 — 참고 화면 부가문구 `mobile B tv에서 시청 가능` 미표시
  - 시안: 언어 컬럼 → 시청가능기간, Mock 부가문구 제거 (시청가능기간 Mock 값은 근거 없어 빈 값)
- 관련 spec: R2.2, R2.4, R2.6, 4. 설계 › Step 1 1차 데이터
- 비고: `VIEW_PERIOD` · `RESOLUTION` 은 아직 Query 에서 `NULL AS ...` — 실데이터 Query 수신 후 교체 필요
