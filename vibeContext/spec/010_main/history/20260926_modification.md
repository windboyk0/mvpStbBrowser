# 20260926 수정이력 — 010_main

## 12:11 단건구매 메뉴 key 변경 (`ppv` → `singlePurchase`)
- 작업: 사용자 요청 — spec 폴더를 Reference 폴더명(`020_singlePurchase`)과 동일하게 맞춤. 규칙상 화면 폴더명 = 메뉴 key 이므로 key 변경
- 변경 파일:
  - `src/renderer/src/screens/main/menus.ts` — `MenuKey`, 메뉴 정의의 `ppv` → `singlePurchase`
  - `src/renderer/src/screens/main/menus.test.ts` — 신규 배지 대상 key 기대값 변경
  - `vibeContext/spec/010_main/design/main_spec.md` — 메뉴 정의 데이터, 참고 화면 경로(`Reference/010_main/UI/`) 갱신
  - `vibeContext/spec/010_main/design/prototype_main.html` — key 변경
  - `CLAUDE.md` — 화면 폴더 명명 규칙: camelCase key, Reference 메뉴 폴더명과 동일 / References 경로 갱신
  - `vibeContext/spec/020_singlePurchase/design`, `history` 폴더 생성 (spec 미작성)
- 내용: 화면 동작 변화 없음 (key만 변경)
- 관련 spec: 3. 설계 › 메뉴 정의 데이터
- 검증: typecheck / lint / test(4건) 통과, Prettier로 `src` 포맷 정리
- 비고: `Reference/020_singlePurchase/Query/` 는 Query 수신 전

## 12:30 B 포인트 메뉴 제거
- 작업: 사용자 요청 — 11번 B 포인트 메뉴 제거
- 변경 파일:
  - `src/renderer/src/screens/main/menus.ts` — `bpoint` key, `parking-circle` 아이콘 타입, 메뉴 항목 삭제
  - `src/renderer/src/components/MenuCard.tsx` — `IconParkingCircle` 매핑 삭제
  - `src/renderer/src/screens/main/menus.test.ts` — 메뉴 11개 기대값으로 변경
  - `vibeContext/spec/010_main/design/main_spec.md` — 카드 11개, R1.4 제외 항목 추가, R3.1 그리드 배치, 도식·아이콘 표·메뉴 데이터·T5 갱신
  - `vibeContext/spec/010_main/design/prototype_main.html` — B 포인트 삭제
  - `CLAUDE.md` — Scope 메뉴 순서 / 제외 항목 갱신
- 내용: 메뉴 11개 (1행 6개, 2행 5개)
- 관련 spec: R1.3, R1.4, R3.1
- 검증: typecheck / lint / test(4건) / prettier 통과, 빌드 후 실제 앱 캡처로 11개 카드 확인

## 12:32 메뉴 key 정리 (camelCase 통일)
- 작업: 사용자 확정 — 메뉴 key를 camelCase로 통일하고 줄임말 없이 명명
- 변경 key: `monthly` → `monthlyPurchase`, `pass` → `monthlyPurchaseInfo`, `history` → `singlePurchaseInfo`, `bcash` → `bCash`, `tvpoint` → `tvPoint`, `tmember` → `tMembership`, `ocb` → `okCashbag` (`singlePurchase`, `coupon`, `plan`, `settings` 유지)
- 변경 파일:
  - `src/renderer/src/screens/main/menus.ts`, `menus.test.ts`
  - `vibeContext/spec/010_main/design/main_spec.md` — 메뉴 정의 데이터 (key = 화면 폴더명 명시)
  - `vibeContext/spec/010_main/design/prototype_main.html`
  - `CLAUDE.md` — Scope에 메뉴별 key 표 추가
- 내용: 화면 동작 변화 없음 (key만 변경). 구매내역의 기존 key `history` 는 spec `history/` 폴더와 이름이 겹쳐 혼동 소지가 있어 해소됨
- 관련 spec: 3. 설계 › 메뉴 정의 데이터
- 검증: typecheck / lint / test(4건) / prettier 통과
- 비고: 이후 `Reference/`, `spec/` 화면 폴더는 이 key로 생성 (예: `030_monthlyPurchase`)

## 17:10 화면 모듈 연결 선행 작업 구현
- 작업: T10, T11, T12, T13 (2026-09-26 spec 모듈화 — 다른 화면 병렬 구현 전 선행)
- 변경 파일:
  - `src/renderer/src/App.tsx` — `import.meta.glob('./screens/*/index.tsx')` 탐색, 폴더명이 `MENUS` key 일 때만 `React.lazy` 로 연결(없으면 placeholder), `Suspense`, `app:navigate` 이벤트 수신(`main` / 메뉴 key, 그 외 무시)
  - `src/main/index.ts` — `import.meta.glob('./*/ipc.ts', { eager: true })` → 앱 시작 시 `register(ipcMain)` 1회 호출 (register 없음/예외는 콘솔 로그 후 다음 모듈 진행)
  - `src/main/env.d.ts` (신규) — main 에서 `import.meta.glob` 타입 사용을 위한 `vite/client` 참조
  - `src/preload/index.ts`, `src/preload/index.d.ts` — `window.api.invoke<T>(channel, payload?)` 1개 노출. 채널이 `<key>:<action>` 형식이고 key 가 `MENUS` 에 있을 때만 `ipcRenderer.invoke`, 아니면 reject
  - `tsconfig.node.json` — preload 가 `screens/main/menus.ts` 를 import 하므로 include 에 추가 (메뉴 key 단일 원본 유지)
  - `package.json`, `package-lock.json` — dependencies 에 `oracledb` ^7.0.1, `electron-store` ^11.0.2 추가
  - `electron.vite.config.ts` — `electron-store` 는 ESM 전용이라 main 번들에 포함 (`externalizeDepsPlugin({ exclude: ['electron-store'] })`), `oracledb` 는 external
- 내용: 화면 모듈은 `screens/<key>/index.tsx`, `main/<key>/ipc.ts` 만 추가하면 공통 파일 수정 없이 연결됨. 메인 화면 동작 변화 없음
- 관련 spec: 3. 설계 › 화면 모듈 연결, CLAUDE.md › 화면 모듈 계약
- 검증:
  - `npm run build` (typecheck + electron-vite build), `npm run lint`, `npm test`(4건) 통과, `npm audit` 0건
  - 임시 모듈(`main/coupon/ipc.ts` — electron-store·oracledb import, `screens/coupon`, `screens/zzz`)로 빌드·실행 확인: main 에서 register 호출 및 oracledb Thin 로드 확인, `coupon` 화면 번들 포함. 확인 후 임시 모듈 삭제
- 비고:
  - 메뉴 key 가 아닌 `screens/*/index.tsx` 폴더도 glob 특성상 별도 chunk 로 빌드되지만 연결되지 않음
  - main 쪽은 채널 접두어를 검사하지 않음 (계약상 각 화면이 `<key>:` 채널만 등록 — preload 에서 차단)
