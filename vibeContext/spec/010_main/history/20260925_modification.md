# 20260925 수정이력 — 010_main

## 13:38 카드 부가정보·알림점 제거
- 작업: T9 (사용자 요청 — 쿠폰함 / B 캐시 / T 멤버십 / OK캐쉬백 / B 포인트 값은 메인에서 볼 필요 없음, 메뉴 진입 후 표시. 카드는 `>` 만)
- 변경 파일:
  - `src/renderer/src/screens/main/menus.ts` — `MenuItem` 에서 `subText`, `hasDot` 제거, Mock 값 삭제
  - `src/renderer/src/components/MenuCard.tsx`, `MenuCard.module.css` — 부가정보·알림점 렌더링 및 `.dot` 스타일 제거, 하단 행 `>` 우측 정렬
  - `vibeContext/spec/010_main/design/main_spec.md` — R1.3 표 정리, R1.5 추가, R2.1 수정, R5(데이터 TBD) 삭제, 설계 도식·메뉴 데이터·Props 정리, T9 추가
  - `vibeContext/spec/010_main/design/prototype_main.html` — 부가정보·알림점 제거
- 내용: 모든 카드를 아이콘 + 메뉴명 + `>` 로 통일 (단건구매·월정액구매의 신규 배지는 유지)
- 관련 spec: R1.3, R1.5, R2.1
- 검증: typecheck / lint / test(4건) 통과, 빌드 후 실제 앱 캡처로 확인
- 비고: 알림점도 "밖에서 보이는 정보"로 보고 함께 제거함. 메인에 더 이상 조회 데이터가 없어 Query·연동정의서 불필요
