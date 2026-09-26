# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**B tv 구매 테스트 앱** — Electron 설치형 데스크톱 앱.
구매 테스트 시 "구매가능 상품 조회 → 결제시스템에 Postman으로 값 수기 기재 후 발송" 하던 과정을 앱 화면에서 수행한다.
사용자: 사내 테스트 인원 누구나 (설치 후 바로 사용).

## Scope

- 메인 화면 = **MY B tv 메뉴**만 구현 (STB 메인의 배너/포스터/프로필 영역 제외, 디자인 톤만 차용)
- 제외: 공지/이용안내, B 포인트
- 메뉴 순서 및 key (key = `Reference/` · `spec/` 화면 폴더명):

| 메뉴 | key |
|---|---|
| 단건구매 | `singlePurchase` |
| 월정액구매 | `monthlyPurchase` |
| 쿠폰함 | `coupon` |
| B 캐시 | `bCash` |
| 나의 이용권 | `monthlyPurchaseInfo` |
| 구매내역 | `singlePurchaseInfo` |
| 나의 요금상품 | `plan` |
| TV 포인트 | `tvPoint` |
| T 멤버십 | `tMembership` |
| OK캐쉬백 | `okCashbag` |
| 설정 | `settings` |

## Workflow

- 화면 단위로 하나씩 spec 작성 → 검토 → 구현 (진행하면서 확정)
- 개발 분석/설계 산출물은 모두 `vibeContext/` 안에 둔다
- 기능(데이터 연동)은 사용자가 제공하는 **Query** 및 **연동정의서** 기준으로 추후 확정. 확정 전에는 Mock 값 사용
- 구현은 orca(ADE)가 **Claude CLI 에이전트**를 오케스트레이션하여 수행. 설계는 별도 Claude 세션에서 사용자와 함께 진행
- **근거(참고 화면 또는 사용자 지시)가 없는 화면 항목은 임의로 정의하지 않는다** — 없으면 질문하거나 빈 placeholder로 둔다

## 협업 규칙 (Claude 작업 방식)

사용자와 함께 설계·구현할 때 항상 지킨다.

- **앞서가지 않는다.** 사용자가 말한 범위만 진행한다. "~해보자"는 시작 신호이므로 파일부터 열지 말고 먼저 짧게 답한 뒤 지시를 기다린다
- **의견을 묻는 질문에는 답만 한다.** ("~하면 편하지 않을까?", "왜 그렇게 했어?") 명시적 지시("진행해", "반영해") 전에는 파일·구조·이름을 바꾸지 않는다
- **근거 없는 항목을 만들지 않는다.** 참고 화면·사용자 지시·Query·연동정의서에 없는 화면 항목, 문구, 설정 항목은 먼저 질문한다. 불가피하게 정한 부분은 "제가 정한 부분"으로 명시해 확인받는다
- **나중에 올 필드도 지금 넣는다.** 사용자가 필요하다고 한 필드의 데이터가 아직 없으면(예: "쿼리는 나중에 줄게") 화면에는 빈 컬럼, Query 에는 `NULL AS <별칭>` + 교체 주석으로 먼저 추가한다
- **steering = 이 CLAUDE.md.** 별도 steering 폴더를 만들지 않는다. 분석/설계 산출물은 전부 `vibeContext/` 안에만 둔다 (`docs/` 등 다른 폴더 금지)
- **spec 은 자체 완결.** `vibeContext/Reference/` 는 초기 개발용 임시 자료(추후 삭제)이므로, 구현에 필요한 Query · 규칙 · 값은 spec 폴더에 옮겨 둔다 (원본 Query 는 바인드 변수 등을 반영해 `query_*.sql` 로 전체 복사)
- **실제 값 금지.** 서버 주소 · IP · Api_Key · Auth_Val · stbId · 서비스관리번호 · 계정 등 실제 값은 spec · 코드 · 시안 어디에도 적지 않는다
- **spec 버전:** 확인 필요 항목이 모두 해소되면 제목을 `v1.0 확정` 으로 갱신한다 ("추후" 로 미룬 항목은 확정을 막지 않음)

## 모듈 설계 원칙 — 낮은 결합도 · 높은 응집도 (필수)

화면(메뉴 key) 하나 = 독립 모듈. **화면별 spec · 구현은 서로 의존하지 않고 병렬로 동시에 진행할 수 있어야 한다.**

- **높은 응집도:** 한 화면에 필요한 요구사항 · 설계 · Query · 컴포넌트 · main 로직 · IPC 는 **그 화면의 spec 폴더와 소스 폴더 안에 모두** 둔다. spec 은 다른 화면 spec 을 읽지 않아도 구현 가능해야 한다
- **낮은 결합도:** 화면끼리 서로의 spec · 소스 · Query 를 **참조 · import 하지 않는다.** 같은 내용이 필요하면 **복사해서 각자 가진다** (중복 허용 — 독립성이 우선)
- 화면 간 공유는 아래 **화면 모듈 계약** 으로만 한다 (계약 = 데이터 형식 · 이름 규칙. 코드 공유 아님)
- 새 화면 spec 을 설계할 때도, 기존 spec 을 수정할 때도 이 원칙을 지킨다

### 화면 모듈 계약

**1) 폴더 소유권** — 화면 key `<key>` 의 구현 에이전트는 아래 폴더만 생성 · 수정한다

| 소유 | 경로 |
|---|---|
| renderer 화면 | `src/renderer/src/screens/<key>/**` (진입 컴포넌트 `index.tsx` default export) |
| main 로직 · IPC | `src/main/<key>/**` (진입 `ipc.ts` 에서 `register(ipcMain)` export) |
| spec · history | `vibeContext/spec/NNN_<key>/**` |

- 다른 화면 폴더 · 공통 파일(`App.tsx`, `menus.ts`, `preload/index.ts`, `main/index.ts`, `package.json`)은 **수정 금지**
- 읽기 전용으로 사용 가능한 공통: `src/renderer/src/styles/*` (디자인 토큰), 전역 `TopBar`(App 이 렌더링 — 화면은 본문만 렌더링)

**2) 연결 방식 (공통 파일 수정 없이 자동 연결 — `010_main` 에서 제공)**
- renderer: `App.tsx` 가 `screens/<key>/index.tsx` 를 자동 탐색해 메뉴 key 로 연결. 폴더가 없으면 placeholder 화면
- main: `main/index.ts` 가 `main/<key>/ipc.ts` 를 자동 탐색해 `register(ipcMain)` 호출
- preload: `window.api.invoke(channel, payload)` 1개만 노출. **IPC 채널명은 `<key>:<action>`** (예: `singlePurchase:search`) — 채널 접두어는 메뉴 key 만 허용
- renderer 화면 간 이동: `window` 이벤트 `app:navigate` (`detail: { key: '<menu key>' | 'main' }`) 로만 요청

**3) 설정값 계약 (쓰기: `settings` 화면만 / 읽기: 필요한 화면이 각자)**
- electron-store 파일명 `settings`, 키: `serverUrl`, `svcMgmtNo`, `dbConnectString`, `dbUser`, `dbPasswordEnc`
- `dbPasswordEnc` = Electron `safeStorage.encryptString(비밀번호)` 결과의 base64 → 읽는 쪽은 `safeStorage.decryptString(Buffer.from(값,'base64'))`
- 읽는 화면은 자기 `src/main/<key>/` 안에서 직접 읽고, Oracle 접속(oracledb Thin)도 자기 모듈에서 직접 한다
- 필수 값이 하나라도 없으면 해당 화면이 팝업 `설정을 먼저 입력해 주세요.` (`[취소]` 메인 유지 / `[설정으로]` → `app:navigate` `settings`)

## Spec 구조 (항상 유지·최신화)

화면 기준으로 폴더를 만든다. **이 구조와 규칙은 항상 유지하고, 구현·수정 시마다 spec과 history를 최신화한다.**

```
vibeContext/spec/
└─ 010_main/                          ← NNN_<screen> : 3자리 번호(10 단위) + 화면 key (camelCase)
   ├─ design/                         ← 분석/설계
   │  ├─ main_spec.md                 ← 메인 설계 spec (진입점, 화면당 1개)
   │  ├─ prototype_main.html          ← 디자인 시안
   │  ├─ query_<purpose>.sql          ← Query
   │  └─ interface_<purpose>.<ext>    ← 연동정의서
   └─ history/                        ← 작업이력
      ├─ YYYYMMDD_dev-complete.md     ← 개발완료
      └─ YYYYMMDD_modification.md     ← 수정이력
```

### 폴더/파일 명명
- 화면 폴더: `NNN_<screen>` — 3자리 번호를 10 단위로 부여 (`010_`, `020_` …), 중간 삽입 시 사이 번호 사용 (`015_`)
- 폴더·파일명은 **영문**, 내용은 한글. 화면 key는 camelCase (예: `singlePurchase`)
- 화면 폴더명은 `vibeContext/Reference/` 의 메뉴 폴더명과 **동일**하게 하고, `<screen>` 은 메인 spec 메뉴 정의의 `key` 와 일치시킨다 (예: `020_singlePurchase` ↔ key `singlePurchase`)
- 파일명은 용도가 드러나도록 명확하게: `<종류>_<purpose>.<ext>` (예: `query_coupon-count.sql`, `interface_payment-request.xlsx`)

### 메인 설계 spec (`design/<screen>_spec.md`)
- 화면당 1개. 요구사항 · 설계 · 작업 목록을 한 파일에 작성
- 맨 위에 **구현 전 필독** (history 확인 지침) 과 **참고 파일** 표 (같은 폴더의 query / 정의서 / 디자인 파일 및 `vibeContext/Reference/` 경로를 파일명으로 지칭)
- 여러 화면 공용 자료(`vibeContext/Reference/`)는 이동하지 않고 경로로 지칭
- **필수 섹션 `모듈 경계`**: 소유 폴더 · 진입점 · IPC 채널 · 사용 계약 · 수정 금지 · 컴포넌트 위치 (CLAUDE.md › 모듈 설계 원칙)
- 다른 화면 spec 을 "동일" · "참고" 로 참조하지 않는다 — 필요한 내용은 이 spec 에 직접 적는다

### 작업이력 (`history/`)
- **구현 전 반드시 해당 화면의 `history/` 전체를 날짜순으로 확인한다**
- `YYYYMMDD_dev-complete.md` — spec 작업(T#)을 최초 구현 완료한 기록
- `YYYYMMDD_modification.md` — 구현 완료 이후의 수정 (버그 수정, spec 변경 반영 등)
- 같은 날 추가 작업은 **같은 파일에 이어쓰기** (항목 단위로 추가)
- 구현 완료 시 spec의 작업 목록 체크박스(`- [x]`)도 함께 갱신

항목 양식:
```md
## HH:MM <제목>
- 작업: T1, T3 (또는 수정 사유)
- 변경 파일: src/...
- 내용: 무엇을 어떻게 했는지
- 관련 spec: R2.1, R4
- 비고: 남은 이슈 / 확인 필요 사항
```

## Tech

### Stack

| 항목 | 사용 |
|---|---|
| 런타임 | Node.js 22 LTS, npm |
| 플랫폼 | Electron (버전 고정) — Windows 10/11 x64 |
| 빌드 | electron-vite |
| 화면 | React + TypeScript |
| 스타일 | CSS 변수(Design Tone 토큰) + CSS Modules |
| 폰트/아이콘 | Pretendard, Tabler Icons — **앱에 번들 (CDN 사용 금지)** |
| DB | Oracle **19c** — `oracledb` (node-oracledb) **Thin 모드** (Oracle Instant Client 설치 불필요) |
| 외부 API | Node.js 내장 `fetch` (main 프로세스) |
| 설정 저장 | electron-store (`%APPDATA%\<앱이름>\`) — 비밀번호는 Electron `safeStorage` 로 암호화 저장 |
| 패키징 | electron-builder — Windows x64 NSIS 설치 파일, **코드 서명 적용** |
| 코드 품질 | ESLint + Prettier |
| 테스트 | Vitest — 금액 계산 등 로직 단위 |

### Architecture

```
[renderer] React 화면 ──IPC(preload contextBridge)──▶ [main] Node.js
                                                      ├─ Oracle 직접 접속 (oracledb)
                                                      ├─ 사내 API 호출 (fetch)
                                                      └─ 설정 저장 (electron-store)
```

- 별도 백엔드 서버 없음 — **main 프로세스가 백엔드 역할**
- DB 접속·API 호출·설정 저장은 **main에서만** 수행. renderer는 IPC로 요청만 한다
- 보안: `contextIsolation: true`, `nodeIntegration: false`, preload에서 필요한 API만 노출
- 접속·식별 정보는 **설정 화면에서 사용자가 입력** — 코드/문서/저장소에 실제 값 기재 금지
  - STG 서버 주소, 서비스관리번호 (stbId 는 서비스관리번호로 조회: `SELECT STB_ID FROM STB WHERE USER_SERVICE_NUM = :svcMgmtNo`)
  - Oracle 접속 정보, 아이디, 비밀번호

### Network
- 공인망 / 사내망 두 환경에서 사용
- npm 설치·빌드는 개발자가 공인망에서 수행. 사용자는 설치 파일만 실행 (npm 불필요)
- 런타임에 외부 CDN 등 인터넷 리소스에 의존하지 않는다

### Auto Update
- `electron-updater` + **GitHub Releases (공개 저장소)**
- 앱 실행 시 새 버전 확인 → 백그라운드 다운로드 → 재시작 안내 후 적용
- 사내망 등 GitHub 접속 불가 시 **업데이트 확인 실패는 조용히 무시** (오류 팝업 없이 앱 정상 사용). 해당 PC는 새 설치 파일로 재설치
- 배포: 버전 올린 후 `npm run dist` 결과물(설치 파일 + `latest.yml`)을 GitHub Release에 게시

### 미정
- 코드 서명 인증서 (발급 주체, 서명 방식)

## Design Tone

참고: `vibeContext/Reference/010_main/UI/main1~3.png` — **톤만 차용**

| 토큰 | 값 | 용도 |
|---|---|---|
| `bg` | `#0E0B20` | 앱 배경 |
| `surface` | `#1B1830` | 카드, 패널 |
| `surface-2` | `#25223D` | 호버/선택 배경, 입력창 |
| `border` | `#3A3754` | 카드/버튼 기본 테두리 |
| `primary` | `#3D2BD9` | 주요 버튼, 선택 탭, 배지 |
| `focus` | `#6E74FF` | 호버/선택 테두리, 선택 텍스트 |
| `text-1` | `#FFFFFF` | 본문/제목 |
| `text-2` | `#B5B3C9` | 보조 텍스트, 아이콘 |
| `text-3` | `#77758C` | 비활성, 안내문 |
| `danger` | `#FF4D5E` | 알림 점, 오류 |

- 폰트: Pretendard (대체: Malgun Gothic)
- 카드·버튼 모서리 10px, 칩/배지 999px, 카드 테두리 2px
- STB의 "포커스" 표현을 PC의 **hover** 로 대응: 테두리 `focus` + 배경 `surface-2`
- 한 화면에 `primary` 채움 버튼은 1개

## References

> `vibeContext/Reference/` 는 **로컬 전용 참고 자료 — git에 올리지 않는다** (`.gitignore` 제외). 구현에 필요한 내용은 각 화면 spec / 시안에 반영한다.

구조: `vibeContext/Reference/NNN_<메뉴>/` 안에 `UI/`(참고 화면) · `Query/`(참고 Query) · `Api/`(연동정의서)

- `vibeContext/Reference/010_main/UI/` — 메인 디자인 톤
- `vibeContext/Reference/020_singlePurchase/` — 단건구매 (UI: Step1/Step2, Api: 연동정의서)
- `vibeContext/spec/NNN_<screen>/design/` — 화면별 spec · 시안 · Query · 정의서
