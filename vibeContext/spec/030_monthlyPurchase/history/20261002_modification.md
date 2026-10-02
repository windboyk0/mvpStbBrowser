# 030_monthlyPurchase — 수정이력 (2026-10-02)

## 16:20 2차 쿠폰 조회 · 선택 · 금액 반영 · IF-EPS-001 매핑 (T10 ~ T13, 잠정값)
- 작업: T10, T11, T12, T13 (사용자 구현 지시 — `1.3 쿠폰 잠정값` 으로 구현)
- 변경 파일:
  - main: `src/main/monthlyPurchase/ipc.ts`, `db.ts`, `sql.ts`, `queries.ts`, `eps.ts`, `coupon.ts`(신규), `monthlyPurchase.test.ts`
  - renderer: `src/renderer/src/screens/monthlyPurchase/PurchaseView.tsx`, `CouponModal.tsx`(신규), `amount.ts`(신규), `amount.test.ts`(신규), `types.ts`, `MonthlyPurchase.module.css`
  - spec: `design/monthlyPurchase_spec.md` (T10 ~ T13 체크)
- 내용:
  - T10 `monthlyPurchase:couponList` (`{ idProduct, prdAgmtId, amtPrice }` → `{ ok, rows:[{ noCoupon, nmCoupon, ddApplyEnd, amtDiscount }] }` / `{ ok:false, error }`, reject 없이 결과 객체)
    - `query_couponList.sql` 을 `?raw` 번들, `sql.ts` 에 `plsqlBlock` 추가 — 헤더 주석만 제거하고 **끝 `END;` 의 `;` 유지**, 목록/건수 분리 없음 (기존 `splitStatements` 는 변경 없이 공용 `stripHeader` 사용)
    - 바인드: `svcMgmtNo`(설정값), `idProduct`(선택 행 `ID_PRODUCT`), `prdAgmtId`(선택 약정, 무약정 null), `idContents` null, `amtPrice`(선택 약정 옵션 가격, 부가세 포함), `couponCursor` = OUT `oracledb.CURSOR` (`BIND_OUT`)
    - `db.ts` 최소 인터페이스에 `CURSOR` · `BIND_OUT` · `outBinds` · ResultSet(`getRows` / `close`) 추가, `queryCursor` 로 100행씩 끝까지 읽고 닫음 (outFormat OBJECT)
    - 결과 매핑 `coupon.ts`: `NO_COUPON` / `NM_COUPON` / `DD_APPLY_END` / `AMT_DISCOUNT` (Q9 · Q10)
  - T11 [C] 할인 수단 쿠폰 행: 약정 옵션이 정해지면(진입 시 첫 옵션) 조회, **약정 변경 시 적용 쿠폰 해제 + 재조회** (Q8). 조회 중 · 0건 → 비활성(✕, 0원), 실패 → 비활성 + 행에 `조회에 실패했습니다. ({오류 메시지})` (`danger`, Q11), 1건 이상 → 활성. 미적용 클릭 → 쿠폰 선택 팝업(`CouponModal.tsx` — 쿠폰명 · ~유효기간 · -할인금액, 행 클릭 = 선택 · 닫힘, Esc · 배경 · [취소] 닫기), 적용 상태 클릭 → 해제. 적용 시 ✓ + 쿠폰명 + `-N원`. `자동 적용` 말풍선 없음, T멤버십 계속 비활성
  - T12 `amount.ts` `paymentAmount`: 할인 금액 = `AMT_DISCOUNT`(부가세 포함) 를 0 ~ 상품 금액 범위로 제한, 구매 금액 = 상품 금액 − 할인 금액, 부가세 `포함` 유지. 금액 패널 할인 금액 `-N원` 표시, `[N원 결제]` 반영. 단위 테스트(미적용 / 적용 / 초과 cap / 음수)
  - T13 `monthlyPurchase:purchase` payload 에 `couponNo` 추가 → IF-EPS-001 Body `useCoupon: true` + `couponNo: NO_COUPON` (적용) / `false` + null (미적용 · 빈 값). 단위 테스트 추가
- 관련 spec: 1.3 쿠폰 잠정값(Q6 ~ Q12), R2.4, R5, 4. 설계 › 쿠폰 선택 팝업 / IF-EPS-001 요청 매핑
- 검증: `npm run typecheck` 통과, `npm run build` 통과, `npx vitest run` 50 passed (7 files), eslint (이 모듈) 통과, prettier (변경 파일) 통과
  - 워크트리의 `node_modules` 연결 대상(메인 체크아웃 `node_modules`)이 없어, 같은 `package-lock.json` 으로 별도 임시 폴더에 설치한 뒤 소스 사본으로 검증함
- 비고 (제가 정한 부분 — 확인 필요):
  - **잠정값(1.3) 기준 구현 — Q6 ~ Q12 확인 결과가 바뀌면 수정이력으로 반영**
  - **실제 DB 미검증** (접속 정보 없음) — Procedure 호출 · REF CURSOR 읽기 · 결과 컬럼 타입은 실DB 에서 확인 필요
  - `DD_APPLY_END` 가 DATE 로 오면 `YYYYMMDD`(로컬) 로, 문자열이면 그대로 표시
  - 쿠폰 선택 팝업 폭 560px, 목록 최대 높이 360px (세로 스크롤)
  - 쿠폰 조회 중에는 별도 로딩 문구 없이 비활성(✕, 0원) — 1차 조회 중 표시 원칙과 동일
  - 쿠폰 조회 중에도 `[N원 결제]` 는 활성 (쿠폰 미적용으로 결제)
  - 결과 `PRD_AGMT_ID` 는 필터하지 않음 (Q8, Procedure 결과 그대로)
