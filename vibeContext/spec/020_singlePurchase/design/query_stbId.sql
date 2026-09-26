/* STB ID 조회 — IF-EPS-001 요청 직전 실행 (단건구매 · 월정액구매 공통)
 * 바인드 변수: :svcMgmtNo — 설정 › 서비스관리번호
 * 결과: STB_ID → IF-EPS-001 Body `stb_id`, Header `Client_ID`
 * 결과 0건이면 구매 요청하지 않고 [D] 구매완료에 에러 메시지 표시
 */
SELECT  STB_ID
FROM    STB
WHERE   USER_SERVICE_NUM = :svcMgmtNo;
