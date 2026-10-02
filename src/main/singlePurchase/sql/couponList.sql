/* [C] Step 2 사용가능 쿠폰 조회 — Step 2 진입 시 실행 (PL/SQL 익명 블록)
 * 원본: vibeContext/spec/020_singlePurchase/design/query_couponList.sql (Package 정의 주석은 원본 참고)
 * 호출: Procedure BTVSMS.UI5_ITP_PKG_COUPON_APPLY_LIST.P_COPN_APLYPSBL_LIST — 결과는 OUT REF CURSOR
 * 바인드 변수 (값 출처는 spec 1.3 쿠폰 잠정값)
 *   :svcMgmtNo     I_ID_CUST_SVC       설정 › 서비스관리번호 (I_CTZ_CORP_SER_NUM 조회에도 사용)
 *   :idProduct     I_ID_PRODUCT        선택 상품 PRD_PRC_ID
 *   :prdAgmtId     I_PRD_AGMT_ID       단건구매 = NULL
 *   :idContents    I_ID_CONTENTS       NULL — PPV 콘텐츠 ID 는 추후
 *   :amtPrice      I_AMT_PRICE         판매가 SALE_PRC (공급가)
 *   :couponCursor  O_COUPON_APLYPSBL_LIST  OUT REF CURSOR (oracledb.CURSOR)
 * 주의: PL/SQL 블록이므로 끝의 `END;` 세미콜론을 제거하지 않는다 (제거 시 PLS-00103)
 *       서비스관리번호가 IESM_CUST_SVC 에 없으면 NO_DATA_FOUND (ORA-01403) → 조회 실패로 처리
 */
DECLARE
    V_CTZ_CORP_SER_NUM  IESM_CUST_SVC.CTZ_CORP_SER_NUM%TYPE;
BEGIN
    SELECT CTZ_CORP_SER_NUM
    INTO   V_CTZ_CORP_SER_NUM
    FROM   IESM_CUST_SVC
    WHERE  ID_CUST_SVC = :svcMgmtNo;

    BTVSMS.UI5_ITP_PKG_COUPON_APPLY_LIST.P_COPN_APLYPSBL_LIST(
         :svcMgmtNo
        ,:idProduct
        ,:prdAgmtId
        ,:idContents
        ,:amtPrice
        ,V_CTZ_CORP_SER_NUM
        ,:couponCursor
    );
END;
