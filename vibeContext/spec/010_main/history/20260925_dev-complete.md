# 20260925 개발완료 — 010_main

## 13:11 프로젝트 초기 구성 + 메인 화면 구현
- 작업: T1 ~ T8
- 변경 파일:
  - 프로젝트 설정: `package.json`, `electron.vite.config.ts`, `electron-builder.yml`, `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`, `vitest.config.ts`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`
  - main/preload: `src/main/index.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`
  - renderer: `src/renderer/index.html`, `src/renderer/src/main.tsx`, `App.tsx`, `App.module.css`, `env.d.ts`
  - 스타일: `src/renderer/src/styles/tokens.css`, `fonts.css`, `global.css`
  - 컴포넌트: `src/renderer/src/components/TopBar`, `MenuCard`, `MenuGrid` (+ `.module.css`)
  - 화면: `src/renderer/src/screens/main/MainScreen.tsx`, `menus.ts`, `menus.test.ts`, `src/renderer/src/screens/placeholder/PlaceholderScreen.tsx`
- 내용:
  - Electron 44 + electron-vite 5 (Vite 7) + React 19 + TypeScript 5.9 구성. 창 기본 1440×900, 최소 1280×800, 메뉴바 숨김
  - 보안: `contextIsolation: true`, `nodeIntegration: false`, CSP로 외부 리소스 차단. preload의 `api` 는 빈 객체 (기능 spec 확정 후 추가)
  - Design Tone 토큰을 CSS 변수로 적용 (`tokens.css`), 컴포넌트는 CSS Modules
  - Pretendard는 사용하는 400/600 woff2만 번들 (전체 번들 시 약 18MB → 1.5MB), 아이콘은 `@tabler/icons-react` (사용 아이콘만 포함)
  - 메뉴 12개는 `menus.ts` 상수 배열 1개로 관리, 아이콘은 문자열 키 → 컴포넌트 매핑 (`MenuCard.tsx`)
  - 라우팅은 `App.tsx` 의 state 1개 (`null` = 메인). 카드 클릭 시 placeholder 화면, `←` 로 복귀
  - renderer 빌드 minify 활성화 (JS 653kB → 230kB)
- 관련 spec: R1 ~ R5.2
- 검증:
  - `npm run typecheck`, `npm run lint`, `npm test` (menus 4건) 통과, `npm audit` 0건
  - 빌드 후 실제 Electron 창 캡처로 시안과 비교 — 12개 카드·순서·신규배지·알림점·Mock 값 일치, 폰트 400/600 로드 확인
  - 카드 클릭 → placeholder(제목 + `←`) → 메인 복귀 동작 확인
  - `npm run dev` 기동 확인
- 비고:
  - TypeScript 7은 typescript-eslint 미지원으로 5.9 사용
  - `npm run dist` (설치 파일 생성)는 미실행 — 코드 서명 인증서 및 자동 업데이트(`publish: github`) 설정은 확정 후 `electron-builder.yml` 에 추가
  - 부가정보/알림점 실데이터 연동은 보류 (R5.1)
