# 030_monthlyPurchase — 개발완료 (2026-09-26)

## 17:26 월정액구매 1차 확정 범위 구현 (T1 ~ T9)
- 작업: T1, T2, T3, T4, T5, T6, T7, T8, T9
- 변경 파일:
  - main: `src/main/monthlyPurchase/ipc.ts`, `settings.ts`, `db.ts`, `sql.ts`, `queries.ts`, `eps.ts`, `monthlyPurchase.test.ts`
  - renderer: `src/renderer/src/screens/monthlyPurchase/index.tsx`, `SearchView.tsx`, `PurchaseView.tsx`, `CompleteView.tsx`, `Modal.tsx`, `agreementOptions.ts`, `agreementOptions.test.ts`, `types.ts`, `MonthlyPurchase.module.css`
  - spec: `design/monthlyPurchase_spec.md` (작업 목록 체크)
- 내용:
  - 진입점: renderer `index.tsx` default export (App 자동 탐색), main `ipc.ts` `register(ipcMain)` (main 자동 탐색). 공통 파일 · 다른 화면 폴더 수정 없음
  - IPC 4개: `monthlyPurchase:checkSettings` → `{ ok }`, `monthlyPurchase:search` (`{ type, prdNm, page }` → `{ ok, rows, total }` / `{ ok:false, error }`), `monthlyPurchase:agreements` (`{ prdPrcId }` → `{ ok, rows:[{ prdAgmtId, months, amtSale }] }`), `monthlyPurchase:purchase` (`{ prdPrcId, prdAgmtId }` → `{ kind:'response', result, reason }` / `{ kind:'error', message }`). 오류도 reject 하지 않고 결과 객체로 반환 (Electron 오류 문구 래핑 방지)
  - 설정값: 이 모듈 안에서 electron-store(`name: 'settings'`) 직접 읽기, `dbPasswordEnc` 는 `safeStorage.decryptString(Buffer.from(값,'base64'))` 로 복호화 (R0 · 설정값 계약)
  - Oracle: `oracledb` Thin, 요청마다 접속 → 실행(outFormat OBJECT) → 해제. `oracledb` 타입 패키지가 없어 `createRequire` + 이 모듈 내 최소 인터페이스로 사용 (전역 타입 선언 추가 없음)
  - Query: spec `design/query_*.sql` 을 `?raw` import 로 번들 (spec 과 코드가 같은 원본 사용). `sql.ts` 가 헤더 주석 제거 · `/* ===== … ===== */` 기준 목록/건수 분리 · 끝 `;` 제거. 바인드: `svcMgmtNo`, `prdNm`(빈 값 → null), `offset`, `pageSize`(10), `prdPrcId` — 문자열 결합 없음 (R1.3)
  - [A]: 진입 시 자동 조회(전체/빈 상품명), 상품유형 → Query 파일 선택, Enter/[검색] → 1페이지, 9컬럼, 결과 없음 · 실패(`danger`, 건수·페이지 숨김) 표시, 행 클릭 → 확인 팝업(Esc · 배경 클릭 닫기)
  - [C]: 약정 옵션 = 무약정(약정필수 N, 조회 없음, 목록 가격, prdAgmtId null) + 약정 Query(개월 수 오름차순), 기본 첫 옵션, 0건/실패 시 메시지 + 결제 버튼 비활성. 결제 수단 청구서만 활성, 할인 수단 2개 비활성(✕, 0원), 금액 패널, 하단 고정 액션바
  - 구매: STB ID 조회(0건 → `서비스관리번호에 해당하는 STB가 없습니다.`, 실패 → `조회에 실패했습니다. (…)`) → IF-EPS-001 `POST {serverUrl}/eps/v5/payment/product/{ID_PRODUCT}?method=POST`, Header/Body 는 spec 4. 설계 매핑 그대로. `result === "0000"` 성공
  - [D]: ✔/✖ + 메시지(`\n` 문자열 줄바꿈), [홈으로] → `app:navigate main`, [구매 계속하기] · [구매취소] → [A] 복귀 (직전 조건 · 페이지 유지 + 자동 재조회, 화면 내부 상태)
  - 단위 테스트: 약정 선택 규칙 · 금액 표시 · 페이지 번호, Query 파일 분리/바인드, IF-EPS-001 요청 매핑 · 응답 파싱
- 관련 spec: R0 ~ R4, 4. 설계, 모듈 경계
- 검증: `npm run typecheck` 통과, `npm run build` 통과, `npx vitest run` 28 passed, eslint · prettier (이 모듈 파일) 통과
- 비고 (제가 정한 부분 — 확인 필요):
  - 페이지 번호는 현재 페이지 중심 **최대 5개** 표시 (spec 레이아웃 예시 `‹ 1 2 3 4 5 ›` 기준)
  - IF-EPS-001 호출 타임아웃 30초 → 초과 시 `구매 요청에 실패했습니다.` 처리. 응답이 JSON 이 아니거나 `result` 없음도 통신 오류와 동일 처리
  - 에러 응답인데 `reason` 이 빈 값이면 `구매 요청에 실패했습니다.` 표시
  - 조회 · 약정 조회 중에는 별도 로딩 문구 없이 빈 영역 (근거 없는 문구 추가하지 않음), 구매 요청 중에는 버튼 비활성
  - `PRD_AGMT_ID` 는 DB 반환 타입 그대로 `prdAgmtId` 로 전송
  - 실제 DB · STG 서버 연동 테스트는 미수행 (접속 정보 없음). Oracle 바인드명 `:offset` 은 spec Query 그대로 사용 — 실DB 에서 ORA-01745 발생 시 바인드명 변경 필요
