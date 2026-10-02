/* [C] Step 2 사용가능 쿠폰 조회 — Step 2 진입 시 실행 (단건구매 모듈 소유 사본)
 * 원본: vibeContext/Reference/020_singlePurchase/Query/사용가능쿠폰조회.txt
 * 호출: Procedure BTVSMS.UI5_ITP_PKG_COUPON_APPLY_LIST.P_COPN_APLYPSBL_LIST — 결과는 OUT REF CURSOR
 * 원본 대비 변경점
 *   - 원본 실행 PL/SQL 의 하드코딩 파라미터 → 바인드 변수 (원본의 실제 값은 옮기지 않음)
 *   - I_CTZ_CORP_SER_NUM(주민법인일련번호) → 서비스관리번호로 IESM_CUST_SVC 에서 조회해 전달
 *   - 원본의 LOOP/FETCH + DBMS_OUTPUT 출력 → 제거 (앱에서 OUT 커서를 직접 읽는다)
 * 바인드 변수 (값 출처는 spec R6.2 — 확인 필요 항목 포함)
 *   :svcMgmtNo     I_ID_CUST_SVC       설정 › 서비스관리번호 (I_CTZ_CORP_SER_NUM 조회에도 사용)
 *   :idProduct     I_ID_PRODUCT        선택 상품 ID — PRD_PRC_ID / PRD_ID 중 확인 필요
 *   :prdAgmtId     I_PRD_AGMT_ID       단건구매 = NULL
 *   :idContents    I_ID_CONTENTS       NULL — PPV 콘텐츠 ID 는 상품 조회 보완 후 추후
 *   :amtPrice      I_AMT_PRICE         상품 금액 — 판매가(공급가) / 부가세 포함 중 확인 필요
 *   :couponCursor  O_COUPON_APLYPSBL_LIST  OUT REF CURSOR (oracledb.CURSOR)
 * 주의: PL/SQL 블록이므로 끝의 `END;` 세미콜론을 제거하지 않는다 (제거 시 PLS-00103)
 *       서비스관리번호가 IESM_CUST_SVC 에 없으면 NO_DATA_FOUND (ORA-01403) → 조회 실패로 처리
 *
 * 참고 — Package 정의 (원본 전체 복사)
 *  TYPE HAVE_APLYPSBL_LIST_REC IS RECORD (
 *       NO_COUPON          IESV_CUST_COUPON_N.NO_COUPON%TYPE
 *      ,NM_COUPON2         IESV_COUPON_N.NM_COUPON%TYPE
 *      ,FG_DISC            IESV_CUST_COUPON_N.FG_DISC%TYPE
 *      ,VAL_DISC           IESV_CUST_COUPON_N.VAL_DISC%TYPE
 *      ,AMT_DISCOUNT       NUMBER
 *      ,YN_DUP_APPLY       CHAR(1)
 *      ,NM_COUPON          IESV_COUPON_N.NM_COUPON%TYPE
 *      ,PRD_AGMT_ID        IESV_COUPON_TGT_DTL.PRD_AGMT_ID%TYPE
 *      ,PRD_AGMT_PERD_CD   IESV_COUPON_TGT_DTL.PRD_AGMT_PERD_CD%TYPE
 *      ,NO_COUPON_MST      IESV_CUST_COUPON_N.NO_COUPON_MST%TYPE
 *      ,DD_CONFIRM         IESV_CUST_COUPON_N.DD_CONFIRM%TYPE
 *      ,DD_APPLY_STR       IESV_CUST_COUPON_N.DD_APPLY_STR%TYPE
 *      ,DD_APPLY_END       IESV_CUST_COUPON_N.DD_APPLY_END%TYPE
 *      ,LANDING_KND_CD     IESV_COPN_LANDING_INFO.LANDING_KND_CD%TYPE
 *      ,LANDING_ID         IESV_COPN_LANDING_INFO.LANDING_ID%TYPE
 *      ,LANDING_NM         IESV_COPN_LANDING_INFO.LANDING_NM%TYPE
 *      ,DTL_DESC           IESV_COPN_LANDING_INFO.DTL_DESC%TYPE
 *      ,PPM_DC_MON         IESV_COUPON_N.PPM_DC_MON%TYPE
 *      ,CD_STATUS          IESV_CUST_COUPON_N.CD_STATUS%TYPE
 *      ,EXPIRE_DAY         VARCHAR(20)
 *      ,DPRD_CD            IESV_COUPON_N.DPRD_CD%TYPE
 *      ,DPRD               IESV_COUPON_N.DPRD%TYPE
 *  );
 *
 *  TYPE HAVE_APLYPSBL_LIST_CUR IS REF CURSOR RETURN HAVE_APLYPSBL_LIST_REC;
 *
 *  PROCEDURE P_COPN_APLYPSBL_LIST (
 *      I_ID_CUST_SVC       IN  VARCHAR2
 *     ,I_ID_PRODUCT        IN  VARCHAR2
 *     ,I_PRD_AGMT_ID       IN  VARCHAR2
 *     ,I_ID_CONTENTS       IN  VARCHAR2
 *     ,I_AMT_PRICE         IN  NUMBER
 *     ,I_CTZ_CORP_SER_NUM  IN  VARCHAR2
 *     ,O_COUPON_APLYPSBL_LIST OUT HAVE_APLYPSBL_LIST_CUR
 *  );
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
