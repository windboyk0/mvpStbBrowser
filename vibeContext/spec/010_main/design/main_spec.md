# 010_main — 메인 (MY B tv) Spec

## 0. 구현 전 필독

1. **`../history/` 폴더의 모든 파일을 날짜순으로 먼저 확인한다.** (개발완료 / 수정이력 — 이미 구현·변경된 내용과 사유)
2. 아래 **참고 파일** 목록의 파일을 확인한다.
3. 구현 완료 또는 수정 후에는 `../history/`에 이력을 작성한다. (규칙: 루트 `CLAUDE.md` › Spec 구조)
4. **모듈 원칙:** 이 화면은 루트 `CLAUDE.md` › 모듈 설계 원칙 · 화면 모듈 계약을 따른다. 메인은 **공통 파일(`App.tsx`, `menus.ts`, `preload/index.ts`, `main/index.ts`, `package.json`)의 소유자**이며, 다른 화면이 공통 파일을 수정하지 않도록 **자동 연결 구조(3. 설계 › 화면 모듈 연결)** 를 제공한다
5. **T10 ~ T13 은 다른 화면 구현보다 먼저 완료한다** (짧은 선행 작업 — 완료 후 다른 화면은 모두 병렬 구현 가능)

## 참고 파일

| 구분 | 파일 | 용도 |
|---|---|---|
| 디자인 시안 | `prototype_main.html` | 메인 화면 시안 (카드 클릭 시 placeholder 화면) |
| 참고 화면 | `vibeContext/Reference/010_main/UI/main1.png` ~ `main3.png` | STB 메인 디자인 톤 (MY B tv 영역) |
| 디자인 토큰 | 루트 `CLAUDE.md` › Design Tone | 색상 / 폰트 / 모서리 / hover 규칙 |
| Query | 없음 | 메인 화면은 조회 데이터 없음 |
| 연동정의서 | 없음 | 메인 화면은 연동 없음 |

---

## 1. 개요
앱 실행 시 첫 화면. MY B tv 메뉴 카드 11개를 보여주고, 각 카드에서 해당 기능 화면으로 진입한다.

## 2. 요구사항

### R1. 화면 구성
- R1.1 상단바: 앱 제목 `MY B tv 구매 테스트` 표시
- R1.2 섹션 제목 `MY B tv` 표시
- R1.3 메뉴 카드 11개를 아래 순서로 표시한다

| No | 메뉴 | 신규 배지 |
|---|---|---|
| 1 | 단건구매 | O |
| 2 | 월정액구매 | O |
| 3 | 쿠폰함 | — |
| 4 | B 캐시 | — |
| 5 | 나의 이용권 | — |
| 6 | 구매내역 | — |
| 7 | 나의 요금상품 | — |
| 8 | TV 포인트 | — |
| 9 | T 멤버십 | — |
| 10 | OK캐쉬백 | — |
| 11 | 설정 | — |

- R1.4 `공지/이용안내`, `B 포인트` 메뉴는 표시하지 않는다
- R1.5 카드에 잔액·보유 수 등 부가정보와 알림점을 표시하지 않는다 (쿠폰함, B 캐시, T 멤버십, OK캐쉬백 등의 값은 각 메뉴 화면 진입 후 표시)

### R2. 카드 표현
- R2.1 카드 = 아이콘 + 메뉴명 / 하단 우측 `>` 화살표
- R2.2 단건구매·월정액구매 카드는 보라 계열 테두리 + `신규` 배지로 구분
- R2.3 마우스 hover 시 테두리 `focus` 색, 배경 `surface-2`

### R3. 레이아웃
- R3.1 6열 그리드 (11개 → 1행 6개, 2행 5개)
- R3.2 최소 창 폭 1280px

### R4. 동작
- R4.1 카드 클릭 시 해당 메뉴 화면으로 이동 (이동 대상 화면은 각 화면 spec에서 정의)
- R4.2 하위 화면에서 상단 `←` 로 메인 복귀

### 범위 외
- 각 메뉴 하위 화면

---

## 3. 설계

### 레이아웃

```
┌────────────────────────────────────────────────────────────────────────┐
│ MY B tv 구매 테스트                                                     │ 상단바 56px
├────────────────────────────────────────────────────────────────────────┤
│  MY B tv                                                               │ 섹션 제목
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐          │
│  │단건구매 ││월정액  ││쿠폰함   ││B 캐시   ││나의    ││구매내역 │          │
│  │[신규] >││구매[신규]>│       > ││       > ││이용권 >││       > │          │
│  └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘          │
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐          │
│  │나의    ││TV 포인트││T 멤버십 ││OK캐쉬백 ││설정    │                    │
│  │요금상품>││       > ││       > ││       > ││       > │                    │
│  └────────┘└────────┘└────────┘└────────┘└────────┘                    │
└────────────────────────────────────────────────────────────────────────┘
```

| 요소 | 값 |
|---|---|
| 상단바 | 높이 56px, 좌우 패딩 28px, 하단 1px 라인 `#1F1C36`, 제목 18px/600 |
| 본문 | 패딩 28px 40px, 최대 폭 1600px 가운데 정렬 |
| 섹션 제목 | 26px/600, 하단 여백 18px |
| 그리드 | `repeat(6, 1fr)`, gap 16px |

### 메뉴 카드

```
┌──────────────────────────┐
│ [icon] 메뉴명      [신규] │  ← 제목 행 (신규배지는 단건구매·월정액구매만)
│                          │
│                        >  │  ← 하단 행
└──────────────────────────┘
```

| 속성 | 기본 | hover | 구매 카드(1,2) |
|---|---|---|---|
| 배경 | `surface` | `surface-2` | `surface` |
| 테두리 | 2px `border` | 2px `focus` | 2px `#4A3FB5` |
| 모서리 | 10px | | |
| 패딩 | 18px 18px 16px | | |
| 최소 높이 | 118px | | |

- 제목 행: 아이콘 26px(`text-2`) + 메뉴명 19px/600, 간격 10px
- 신규 배지: 우상단 (10px, 12px), 11px, `primary` 배경, pill
- 하단 행: `chevron-right` 우측 정렬, `text-2`
- 전환: 0.12s

### 아이콘 (Tabler Icons outline)

| 메뉴 | 아이콘 |
|---|---|
| 단건구매 | `shopping-cart` |
| 월정액구매 | `calendar-repeat` |
| 쿠폰함 | `ticket` |
| B 캐시 | `coin` |
| 나의 이용권 | `id-badge-2` |
| 구매내역 | `receipt` |
| 나의 요금상품 | `barcode` |
| TV 포인트 | `device-tv` |
| T 멤버십 | `letter-t` |
| OK캐쉬백 | `cash` |
| 설정 | `settings` |

### 컴포넌트

| 컴포넌트 | Props |
|---|---|
| `TopBar` | `title`, `showBack` (메인은 false), `onBack?` |
| `MenuCard` | `item: MenuItem` (`key`, `label`, `icon`, `isNew?`), `onClick` |
| `MenuGrid` | `items: MenuItem[]`, `onSelect(key)` |

소스 위치: `src/renderer/src/components/` (TopBar, MenuCard, MenuGrid), `src/renderer/src/screens/main/` (MainScreen, `menus.ts`), `src/renderer/src/screens/placeholder/`

### 메뉴 정의 데이터

메뉴 목록은 코드 내 상수 배열 1개로 관리 (순서 = 배열 순서).

```ts
{ key: 'singlePurchase',      label: '단건구매',      icon: 'shopping-cart',   isNew: true }
{ key: 'monthlyPurchase',     label: '월정액구매',    icon: 'calendar-repeat', isNew: true }
{ key: 'coupon',              label: '쿠폰함',        icon: 'ticket' }
{ key: 'bCash',               label: 'B 캐시',        icon: 'coin' }
{ key: 'monthlyPurchaseInfo', label: '나의 이용권',   icon: 'id-badge-2' }
{ key: 'singlePurchaseInfo',  label: '구매내역',      icon: 'receipt' }
{ key: 'plan',                label: '나의 요금상품', icon: 'barcode' }
{ key: 'tvPoint',             label: 'TV 포인트',     icon: 'device-tv' }
{ key: 'tMembership',         label: 'T 멤버십',      icon: 'letter-t' }
{ key: 'okCashbag',           label: 'OK캐쉬백',      icon: 'cash' }
{ key: 'settings',            label: '설정',          icon: 'settings' }
```
- `key` = 화면 폴더명 (`vibeContext/Reference/NNN_<key>/`, `vibeContext/spec/NNN_<key>/`)

### 라우팅
- 카드 클릭 → `key` 기준 화면 이동. 대상 화면 미구현 시 빈 placeholder 화면(제목 + `←`)으로 이동

### 화면 모듈 연결 (공통 파일 수정 없이 화면 추가)

CLAUDE.md › 화면 모듈 계약 의 구현. 각 화면은 자기 폴더에 파일만 추가하면 자동 연결된다.

| 구분 | 방식 | 규칙 |
|---|---|---|
| renderer 화면 | `App.tsx` 에서 `import.meta.glob('./screens/*/index.tsx')` 로 탐색 | 폴더명이 `MENUS` 의 key 와 같을 때만 연결. 없으면 placeholder. `React.lazy` 로 로드 |
| main IPC | `main/index.ts` 에서 `import.meta.glob('./*/ipc.ts', { eager: true })` 로 탐색 | 각 모듈의 `register(ipcMain)` 호출 (앱 시작 시 1회) |
| preload | `window.api.invoke(channel, payload)` 1개만 노출 (`ipcRenderer.invoke`) | `channel` 은 `<key>:<action>` 형식, 접두어가 `MENUS` key 가 아니면 거부 |
| 화면 이동 | `window.dispatchEvent(new CustomEvent('app:navigate', { detail: { key } }))` | `key` = 메뉴 key 또는 `'main'`. `App.tsx` 가 수신해 route 변경 |
| 공통 의존성 | `package.json` 에 `oracledb`, `electron-store` 미리 추가 | 다른 화면이 `package.json` 을 수정하지 않도록 |

- 화면 컴포넌트는 **본문만** 렌더링 (상단 `TopBar` 는 App 이 계속 렌더링). 화면 제목 = 메뉴 label
- 기존 `screens/main/`, `screens/placeholder/` 는 메인 소유 (메뉴 key 가 아니므로 자동 탐색 대상 아님)
- `preload/index.d.ts` 의 `window.api` 타입: `invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>`

---

## 4. 작업 목록

- [x] T1. 디자인 토큰 적용 (`CLAUDE.md` Design Tone 색상/폰트/모서리) — R2, R3
- [x] T2. Pretendard 폰트, Tabler Icons 적용 — 3. 설계 › 아이콘
- [x] T3. `TopBar` 컴포넌트 (제목, `showBack`) — R1.1, R4.2
- [x] T4. `MenuCard` 컴포넌트 (아이콘/메뉴명/신규배지/화살표, hover) — R2
- [x] T5. 메뉴 정의 상수 배열 11개 (공지/이용안내, B 포인트 제외) — R1.3, R1.4
- [x] T6. `MenuGrid` 6열 그리드 + 메인 화면 조립 — R1.2, R3
- [x] T7. 카드 클릭 라우팅 + 미구현 화면 placeholder(제목 + `←` 복귀) — R4
- [x] T8. 확인: 최소 창 폭 1280px에서 `prototype_main.html` 과 동일하게 표시
- [x] T9. 카드 부가정보·알림점 제거 (`>` 만 표시) — R1.5, R2.1

### 선행 작업 — 화면 모듈 연결 (다른 화면보다 먼저)
- [ ] T10. renderer 자동 연결: `App.tsx` glob 탐색 + `React.lazy`, 없으면 placeholder, `app:navigate` 이벤트 수신 — 3. 설계 › 화면 모듈 연결
- [ ] T11. main 자동 연결: `main/index.ts` 에서 `./*/ipc.ts` glob → `register(ipcMain)`
- [ ] T12. preload `window.api.invoke(channel, payload)` + 채널 접두어(메뉴 key) 검사, `index.d.ts` 타입
- [ ] T13. `package.json` 에 `oracledb`, `electron-store` 추가 (`npm install`), 빌드 · 타입검사 통과 확인
