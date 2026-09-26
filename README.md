# B tv 구매 테스트 앱

구매 테스트 시 **구매가능 상품 조회 → 결제시스템에 Postman으로 값 수기 입력 후 발송** 하던 과정을 화면 클릭만으로 수행하는 Electron 데스크톱 앱.

- 대상: 사내 테스트 인원 누구나 (설치 후 바로 사용)
- 환경: B tv STG
- 상태: 메인 화면 구현 완료 (Mock 데이터), 기능 상세 설계 진행 중

## 폴더 구조

```
mvpStbBrowser/
├─ CLAUDE.md                     # 개발 지침 (steering) — 범위, 규칙, Spec 구조, 디자인 톤
├─ README.md
├─ vibeContext/                  # 개발 분석/설계 산출물
│  ├─ Reference/                 # 참고 자료 — 로컬 전용 (git 제외)
│  └─ spec/
│     └─ 010_main/               # 화면별 폴더: NNN_<screen>
│        ├─ design/              # 분석/설계 — <screen>_spec.md(진입점), 시안, Query, 연동정의서
│        └─ history/             # 작업이력 — YYYYMMDD_dev-complete.md / YYYYMMDD_modification.md
└─ src/
   ├─ main/                      # Electron main (Node.js) — Oracle 접속, 사내 API 호출, 설정 저장
   ├─ preload/                   # main ↔ renderer IPC 브릿지
   └─ renderer/                  # 화면 (screens/<screen> — spec 화면 key와 일치)
```

> 구현 전 반드시 해당 화면의 `vibeContext/spec/NNN_<screen>/design/<screen>_spec.md` 와 `history/` 를 확인한다. 상세 규칙은 [CLAUDE.md](CLAUDE.md) 참고.

## 기술 스택

Electron · electron-vite · React · TypeScript · Oracle(`oracledb` Thin) · electron-store · electron-builder

## 요구 환경

- 개발: Node.js 22 LTS, npm 10+ (공인망에서 설치·빌드)
- 사용: Windows 10/11 x64 — 설치 파일만 실행 (npm, Oracle Client 불필요)

## 실행 방법 (개발)

```bash
npm install        # 의존성 설치
npm run dev        # 개발 모드 실행 (hot reload)
```

| 명령 | 설명 |
|---|---|
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier 포맷 적용 |
| `npm test` | Vitest 단위 테스트 |

## 배포 방법

electron-builder로 Windows x64 NSIS 설치 파일을 생성한다. (코드 서명 적용)

```bash
npm run build      # 소스 빌드
npm run dist       # 설치 파일 생성 → release/ 폴더
```

1. `release/` 에 생성된 `*-setup-<version>.exe` 를 배포
2. 사용자는 설치 파일 실행 → 설치 완료 후 바탕화면/시작 메뉴에서 실행
3. 최초 실행 시 **설정**에서 Oracle 접속 정보·아이디·비밀번호 입력
4. 설정 정보는 사용자 PC의 `%APPDATA%\<앱이름>\` 에 저장 (비밀번호 암호화, 재설치 시 유지)

### 업데이트

- `package.json` 버전 올림 → `npm run dist` → `release/` 의 설치 파일과 `latest.yml` 을 **GitHub Release** 에 게시
- 공인망 PC: 앱 실행 시 자동으로 새 버전 확인·다운로드 → 재시작 시 적용
- 사내망 PC: 자동 업데이트 불가 → 새 설치 파일로 재설치

## 개발 진행 방식

화면 단위로 **spec 작성 → 검토 → 구현(orca) → history 작성** 순으로 진행한다.
