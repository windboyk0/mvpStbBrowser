/* [A] 구매가능 단건 상품 조회 — 목록 (페이지당 10건)
 * 원본: vibeContext/Reference/020_singlePurchase/Query/PPU_Select_Query.txt
 * 원본 대비 변경: DB 링크 `@REPORT` 제거 — 접속 DB 에서 BTVCMS 테이블을 직접 조회 (링크 없음 ORA-02019, 2026-10-02)
 * 바인드 변수
 *   :prdTypCd  상품유형 코드 ('10','20','41','42') — NULL 이면 전체
 *   :prdNm     상품명 검색어 — NULL 또는 빈 문자열이면 전체
 *   :offset    (페이지 - 1) * 10
 *   :pageSize  10
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
OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY;

/* [A] 전체 건수 (페이지 번호 계산용) — 목록과 같은 조건 */
SELECT  COUNT(*) AS TOTAL_CNT
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
AND     B.PRD_TYP_CD IN ('10', '20', '41', '42')
AND     (:prdTypCd IS NULL OR B.PRD_TYP_CD = :prdTypCd)
AND     (:prdNm IS NULL OR B.PRD_NM LIKE '%' || :prdNm || '%');
