/* [A] 구매가능 단건 상품 조회 — 목록 (페이지당 10건)
 * 원본: vibeContext/spec/020_singlePurchase/design/query_productList.sql (목록)
 * 바인드 변수: :prdTypCd (NULL 이면 전체), :prdNm (NULL 이면 전체), :offset, :pageSize
 * RESOLUTION, VIEW_PERIOD 는 해당 필드가 포함된 Query 수신 전까지 빈 값 (NULL)
 */
SELECT   A.PRD_PRC_ID
        ,B.PRD_NM
        ,A.SALE_PRC
        ,B.PRD_TYP_CD
        ,NULL AS RESOLUTION     /* 해상도 — Query 수신 후 교체 */
        ,NULL AS VIEW_PERIOD    /* 시청가능기간 — Query 수신 후 교체 */
FROM    BTVCMS.PD_PRD_PRC_DTS A
        INNER JOIN
        BTVCMS.PD_PRD_MST B
        ON (B.PRD_ID = A.PRD_ID)
WHERE  TO_CHAR(SYSDATE, 'YYYYMMDD') BETWEEN A.PRD_PRC_FR_DT AND A.PRD_PRC_TO_DT
AND     A.SALE_PRC > 0
AND     TO_CHAR(SYSDATE, 'YYYYMMDD') BETWEEN B.SVC_FR_DT AND B.SVC_TO_DT
AND     B.USE_YN = 'Y'
AND     B.DEL_YN = 'N'
AND     B.PRD_PKG_TYP_CD = '99'
AND     B.PRD_TYP_CD IN ('10', '20', '41', '42')    /* 10:VOD PPV, 20:VOD PPS, 41:VOD PPP, 42:VOD Commerce */
AND     (:prdTypCd IS NULL OR B.PRD_TYP_CD = :prdTypCd)
AND     (:prdNm IS NULL OR B.PRD_NM LIKE '%' || :prdNm || '%')
ORDER BY B.PRD_TYP_CD, A.PRD_PRC_ID
OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
