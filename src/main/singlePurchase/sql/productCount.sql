/* [A] 전체 건수 (페이지 번호 계산용) — 목록과 같은 조건
 * 원본: vibeContext/spec/020_singlePurchase/design/query_productList.sql (건수)
 * 바인드 변수: :prdTypCd (NULL 이면 전체), :prdNm (NULL 이면 전체)
 */
SELECT  COUNT(*) AS TOTAL_CNT
FROM    BTVCMS.PD_PRD_PRC_DTS@REPORT A
        INNER JOIN
        BTVCMS.PD_PRD_MST@REPORT B
        ON (B.PRD_ID = A.PRD_ID)
WHERE  TO_CHAR(SYSDATE, 'YYYYMMDD') BETWEEN A.PRD_PRC_FR_DT AND A.PRD_PRC_TO_DT
AND     A.SALE_PRC > 0
AND     TO_CHAR(SYSDATE, 'YYYYMMDD') BETWEEN B.SVC_FR_DT AND B.SVC_TO_DT
AND     B.USE_YN = 'Y'
AND     B.DEL_YN = 'N'
AND     B.PRD_PKG_TYP_CD = '99'
AND     B.PRD_TYP_CD IN ('10', '20', '41', '42')
AND     (:prdTypCd IS NULL OR B.PRD_TYP_CD = :prdTypCd)
AND     (:prdNm IS NULL OR B.PRD_NM LIKE '%' || :prdNm || '%')
