/* STB ID 조회 — IF-EPS-001 요청 직전 실행
 * 원본: vibeContext/spec/020_singlePurchase/design/query_stbId.sql
 * 바인드 변수: :svcMgmtNo — 설정 › 서비스관리번호
 */
SELECT  STB_ID
FROM    STB
WHERE   USER_SERVICE_NUM = :svcMgmtNo
