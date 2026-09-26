/* STB ID 조회 — 설정 화면 연결 테스트용 (설정 모듈 소유 사본)
 * 바인드 변수: :svcMgmtNo — 설정 › 서비스관리번호
 * 결과: STB_ID → 연결 테스트 결과 표시
 * 결과 0건이면 "서비스관리번호에 해당하는 STB가 없습니다." 표시
 */
SELECT  STB_ID
FROM    STB
WHERE   USER_SERVICE_NUM = :svcMgmtNo;
