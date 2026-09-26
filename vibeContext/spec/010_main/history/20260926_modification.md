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
