# 120_settings — 설정 Spec (v1.0 확정)

## 0. 구현 전 필독

1. **`../history/` 폴더의 모든 파일을 날짜순으로 먼저 확인한다.** (개발완료 / 수정이력)
2. 아래 **참고 파일** 목록의 파일을 확인한다.
3. 구현 완료 또는 수정 후에는 `../history/`에 이력을 작성한다. (규칙: 루트 `CLAUDE.md` › Spec 구조)
4. **실제 서버 주소 · 계정 · 비밀번호를 코드 · 문서 · 테스트에 기재하지 않는다.** (CLAUDE.md › Architecture)

## 참고 파일

| 구분 | 파일 | 용도 |
|---|---|---|
| 디자인 시안 | `prototype_settings.html` | 설정 화면 시안 |
| Query | `vibeContext/spec/020_singlePurchase/design/query_stbId.sql` | 연결 테스트 시 서비스관리번호 → STB ID 조회 |
| 기술 기준 | 루트 `CLAUDE.md` › Tech (electron-store, safeStorage, oracledb Thin) | 저장 · 암호화 · DB 접속 |
| 디자인 토큰 | 루트 `CLAUDE.md` › Design Tone | |

---

## 1. 개요

메인 › 설정. 구매 요청과 상품 조회에 필요한 **접속 · 식별 정보 4가지**를 입력 · 저장한다.
STB ID, 주민법인일련번호는 입력받지 않고 서비스관리번호로 조회한다.

## 2. 요구사항

### R1. 입력 항목

| 항목 | 필드 key | 입력 | 필수 | 검증 | 사용처 |
|---|---|---|---|---|---|
| STG 서버 주소 | `serverUrl` | 텍스트 | Y | `http://` 또는 `https://` 로 시작 | IF-EPS-001 호출 주소 앞부분 |
| 서비스관리번호 | `svcMgmtNo` | 텍스트 | Y | 숫자만 | 월정액 조회, STB ID 조회 |
| DB 접속 정보 | `dbConnectString` | 텍스트 | Y | 빈 값 불가 | Oracle 접속 (`host:port/serviceName`) |
| DB 아이디 | `dbUser` | 텍스트 | Y | 빈 값 불가 | Oracle 접속 |
| DB 비밀번호 | `dbPassword` | 비밀번호 (마스킹, 보기 토글) | Y | 빈 값 불가 | Oracle 접속 |

- R1.1 입력값 앞뒤 공백은 저장 시 제거
- R1.2 검증 실패 시 해당 입력칸 아래에 오류 문구 표시 (`danger`), 저장하지 않음
  - 빈 값: `{항목명}를 입력해 주세요.` (예: `DB 아이디를 입력해 주세요.` — 항목명이 모두 모음으로 끝나 `를` 고정)
  - 서버 주소 형식: `http:// 또는 https:// 로 시작해야 합니다.`
  - 서비스관리번호 형식: `숫자만 입력해 주세요.`
- R1.3 입력칸 placeholder 는 형식 예시만 사용 (예: `https://`, `host:port/serviceName`) — 실제 값 금지

### R2. 저장
- R2.1 `[저장]` → 검증 통과 시 로컬 저장 후 토스트 `저장되었습니다.`
- R2.2 저장 위치: electron-store (`%APPDATA%\<앱이름>\`), **비밀번호는 `safeStorage` 로 암호화하여 저장**
- R2.3 화면 진입 시 저장된 값을 채워서 표시. 비밀번호는 저장되어 있으면 `••••••••` 로 표시하고, 수정하지 않으면 기존 값 유지
- R2.4 저장된 값이 없으면 빈 입력칸

### R3. 연결 테스트
- R3.1 `[연결 테스트]` → 현재 입력값(저장 전 값 포함)으로 Oracle 접속 후 `query_stbId.sql` 실행
- R3.2 결과 표시 (버튼 옆 영역)

| 결과 | 표시 |
|---|---|
| 성공 + STB ID 조회됨 | `연결 성공 · STB ID: {STB_ID}` (성공 색) |
| 성공 + 0건 | `연결 성공 · 서비스관리번호에 해당하는 STB가 없습니다.` (`danger`) |
| 접속 실패 | `연결 실패 · {오류 메시지}` (`danger`) |

- R3.3 테스트 중에는 버튼 비활성 + `연결 확인 중…`
- R3.4 연결 테스트는 저장하지 않는다

### R4. 설정 미입력 시 다른 화면 동작
- R4.1 메인 › 단건구매 / 월정액구매 진입 시 필수 설정이 하나라도 없으면 팝업 `설정을 먼저 입력해 주세요.` — `[취소]` (메인 유지) / `[설정으로]` (설정 화면 이동)
- R4.2 조회 · 구매 중 DB 접속 오류는 각 화면에서 에러 메시지로 표시 (각 화면 spec)

---

## 3. 설계

### 레이아웃

```
 ← 설정
 ┌──────────────────────────────────────────────────────────┐
 │ STG 서버 주소                                             │
 │ [ https://                                            ]  │
 │ 서비스관리번호                                            │
 │ [                                                     ]  │
 │ ──────────────────────────────────────────────────────── │
 │ DB 접속 정보                                              │
 │ [ host:port/serviceName                               ]  │
 │ DB 아이디                        DB 비밀번호               │
 │ [                           ]    [ ••••••••        👁 ]  │
 │ ──────────────────────────────────────────────────────── │
 │ [연결 테스트]  연결 성공 · STB ID: {…}          [저장]    │
 └──────────────────────────────────────────────────────────┘
```

| 요소 | 값 |
|---|---|
| 카드 | `surface`, 최대 폭 720px, 가운데 정렬, 모서리 12px |
| 라벨 | 14px `text-2` |
| 입력칸 | `surface-2` 배경, 테두리 `border`, focus 시 `focus` |
| 구분선 | 서버 정보 / DB 정보 / 버튼 영역 |
| 버튼 | `[연결 테스트]` 보조 버튼, `[저장]` `primary` |
| 토스트 | 화면 하단 가운데, 2초 후 사라짐 |

### IPC (main)

| 채널 | 요청 | 응답 |
|---|---|---|
| `settings:get` | — | `{ serverUrl, svcMgmtNo, dbConnectString, dbUser, hasPassword }` (비밀번호 원문은 renderer 로 보내지 않음) |
| `settings:save` | `{ serverUrl, svcMgmtNo, dbConnectString, dbUser, dbPassword? }` | `{ ok }` — `dbPassword` 미전달 시 기존 값 유지 |
| `settings:testConnection` | 저장과 같은 형태 (비밀번호 미전달 시 저장된 값 사용) | `{ ok, stbId?, message? }` |

- main 공통 모듈 `getSettings()` 로 다른 화면(조회 · 구매)이 설정값 사용
- DB 접속 풀은 설정 저장 시 재생성

### 소스 위치(예정)
- renderer: `src/renderer/src/screens/settings/`
- main: `src/main/settings/` (store · 암호화 · IPC), `src/main/db/` (oracledb 접속 · 쿼리 실행)

---

## 4. 작업 목록

- [ ] T1. 의존성 추가: `electron-store`, `oracledb` (Thin 모드)
- [ ] T2. main 설정 저장소 (electron-store + safeStorage 비밀번호 암호화, `getSettings()`) — R2
- [ ] T3. main DB 모듈 (oracledb Thin 접속, 바인드 쿼리 실행 공통 함수) — R3
- [ ] T4. IPC `settings:get` / `settings:save` / `settings:testConnection` + preload 노출 — 3. 설계 › IPC
- [ ] T5. 설정 화면 (입력 5칸, 검증, 비밀번호 마스킹 · 보기 토글, 저장 토스트) — R1, R2
- [ ] T6. 연결 테스트 (STB ID 조회 결과 표시) — R3
- [ ] T7. 메인 › 설정 진입 연결 (placeholder 대체)
- [ ] T8. 단건 · 월정액 진입 시 설정 미입력 팝업 — R4.1
- [ ] T9. 단위 테스트: 입력 검증 규칙 — R1.2
