/* [A] 가입가능 월정액 상품 조회 — 상품유형 VOD (VOD 월정액 (PRD_TYP_CD 30 VOD PPM / 34 복합 VOD PPM))
 * 파일: query_productList_vod.sql  / 상품유형 선택값 → 파일 매핑은 monthlyPurchase_spec.md R1.2 참고
 * 원본: Monthly_Select_Query.txt (vibeContext/Reference/030_monthlyPurchase/Query/, 로컬 전용·추후 삭제)
 * 원본 대비 변경점: 원본 UNION 블록 중 GUBUN = 'VOD' 블록만 사용
 *   - 서비스관리번호 하드코딩 → :svcMgmtNo / 주민법인일련번호 '802059' → (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo)
 *   - 상품명 조건 (:prdNm NULL/빈 값 = 전체), 정렬 NM_PRODUCT → ID_PRODUCT, 페이지 OFFSET/FETCH (Oracle 19c)
 * 바인드 변수: :svcMgmtNo, :prdNm, :offset ((페이지-1)*10), :pageSize (10)
 * 결과 컬럼: GUBUN, ID_PRODUCT, NM_PRODUCT, ID_PACKAGE, ID_PRODUCT_PAR, TP_PPM, AMT_PRICE(부가세 포함), PPM_FREE_JOIN_PERD_CD, AGMT_MNDT_YN
 */

/* ===== 목록 ===== */
SELECT * FROM (
      	
       SELECT 'VOD' GUBUN      	
           , TO_CHAR(ID_PRODUCT) ID_PRODUCT 	
           , TO_CHAR(NM_PRODUCT) NM_PRODUCT 	
           , TO_CHAR(ID_PACKAGE) ID_PACKAGE 	
           , TO_CHAR(ID_PRODUCT_PAR) ID_PRODUCT_PAR 	
           , TO_CHAR(TP_PPM) TP_PPM 	
           , TO_CHAR(TRUNC(AMT_PRICE*1.1)) AMT_PRICE       	
           , TO_CHAR(PPM_FREE_JOIN_PERD_CD) PPM_FREE_JOIN_PERD_CD       	
           , CASE WHEN (SELECT    COUNT(*) 	
                                   FROM      IEMA_PROG	
                                   WHERE     CD_PROG_GRP = '000049'	
                                   AND       ID_PROJECT = 'CINE'	
                                   AND       CD_PROG = ID_PRODUCT) > 0   THEN 'Y'	
                             ELSE 'N'	
                        END AS AGMT_MNDT_YN	
       FROM (      	
           SELECT DTS.PRD_PRC_ID ID_PRODUCT, PRD_NM NM_PRODUCT, NULL ID_PACKAGE, NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PPM_FREE_JOIN_PERD_CD	
               FROM PD_PRD_PRC_DTS DTS	
               INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
               INNER JOIN PD_PRD_AGMT_DTS C ON DTS.PRD_PRC_ID = C.PRD_PRC_ID	
           WHERE  MST.ASIS_PRD_TYP_CD = '30'	
           AND    MST.PRD_TYP_CD IN('30', '34')         /* 30: VOD PPM  34: 복합 VOD PPM */ 	
           AND    MST.USE_YN = 'Y'	
           AND    TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN DTS.PRD_PRC_FR_DT AND DTS.PRD_PRC_TO_DT 	
           AND C.PRD_AGMT_PERD_CD = '0'	
           AND    NVL(MST.PRD_COMPO_CD,'10') <> '20'	
           AND    MST.PRD_ID IN (SELECT DTS.PRD_ID	
                        FROM PD_PRD_CUG_DTS DTS, PD_PRD_MST MST  	
                        WHERE DTS.PRD_ID = MST.PRD_ID AND DTS.PRD_GRP_ID = MST.PRD_GRP_ID 	
                        AND   CUG_ID = NVL((SELECT SERVICE_CODE FROM STB WHERE USER_SERVICE_NUM = :svcMgmtNo ),'0')    	
                        )	
           AND    DTS.PRD_PRC_ID NOT IN ('219609','760016')   	
      UNION 	
           SELECT DTS.PRD_PRC_ID ID_PRODUCT, MST.PRD_NM NM_PRODUCT,NULL ID_PACKAGE , NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PPM_FREE_JOIN_PERD_CD 	
           FROM PD_PRD_PRC_DTS DTS 	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
           INNER JOIN PD_PRD_AGMT_DTS C ON DTS.PRD_PRC_ID = C.PRD_PRC_ID	
           WHERE DTS.PRD_PRC_ID IN ('2194407','2194408')  	
           AND C.PRD_AGMT_PERD_CD = '0'	
       MINUS       	
           SELECT DTS.PRD_PRC_ID ID_PRODUCT, MST.PRD_NM NM_PRODUCT,NULL ID_PACKAGE , NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PPM_FREE_JOIN_PERD_CD 	
           FROM PD_PRD_PRC_DTS DTS 	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID   	
           WHERE DTS.PRD_PRC_ID IN ( SELECT CD_PROG_DTL1 FROM IEMA_PROG WHERE CD_PROG_GRP = '000003')                      	
       )
			) T1
WHERE 1=1
    AND (:prdNm IS NULL OR UPPER(NM_PRODUCT) LIKE '%' || UPPER(:prdNm) || '%')
    AND NOT EXISTS (
                     SELECT 1 FROM IEMA_PROG T2
                     WHERE CD_PROG_GRP = '000036'
                       AND CD_PROG = 'T0004'
                       AND T1.ID_PRODUCT = T2.CD_PROG_DTL1)
ORDER BY NM_PRODUCT ASC, ID_PRODUCT ASC
OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY;

/* ===== 전체 건수 (목록과 같은 조건) ===== */
SELECT COUNT(*) AS TOTAL_CNT FROM (
SELECT * FROM (
      	
       SELECT 'VOD' GUBUN      	
           , TO_CHAR(ID_PRODUCT) ID_PRODUCT 	
           , TO_CHAR(NM_PRODUCT) NM_PRODUCT 	
           , TO_CHAR(ID_PACKAGE) ID_PACKAGE 	
           , TO_CHAR(ID_PRODUCT_PAR) ID_PRODUCT_PAR 	
           , TO_CHAR(TP_PPM) TP_PPM 	
           , TO_CHAR(TRUNC(AMT_PRICE*1.1)) AMT_PRICE       	
           , TO_CHAR(PPM_FREE_JOIN_PERD_CD) PPM_FREE_JOIN_PERD_CD       	
           , CASE WHEN (SELECT    COUNT(*) 	
                                   FROM      IEMA_PROG	
                                   WHERE     CD_PROG_GRP = '000049'	
                                   AND       ID_PROJECT = 'CINE'	
                                   AND       CD_PROG = ID_PRODUCT) > 0   THEN 'Y'	
                             ELSE 'N'	
                        END AS AGMT_MNDT_YN	
       FROM (      	
           SELECT DTS.PRD_PRC_ID ID_PRODUCT, PRD_NM NM_PRODUCT, NULL ID_PACKAGE, NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PPM_FREE_JOIN_PERD_CD	
               FROM PD_PRD_PRC_DTS DTS	
               INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
               INNER JOIN PD_PRD_AGMT_DTS C ON DTS.PRD_PRC_ID = C.PRD_PRC_ID	
           WHERE  MST.ASIS_PRD_TYP_CD = '30'	
           AND    MST.PRD_TYP_CD IN('30', '34')         /* 30: VOD PPM  34: 복합 VOD PPM */ 	
           AND    MST.USE_YN = 'Y'	
           AND    TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN DTS.PRD_PRC_FR_DT AND DTS.PRD_PRC_TO_DT 	
           AND C.PRD_AGMT_PERD_CD = '0'	
           AND    NVL(MST.PRD_COMPO_CD,'10') <> '20'	
           AND    MST.PRD_ID IN (SELECT DTS.PRD_ID	
                        FROM PD_PRD_CUG_DTS DTS, PD_PRD_MST MST  	
                        WHERE DTS.PRD_ID = MST.PRD_ID AND DTS.PRD_GRP_ID = MST.PRD_GRP_ID 	
                        AND   CUG_ID = NVL((SELECT SERVICE_CODE FROM STB WHERE USER_SERVICE_NUM = :svcMgmtNo ),'0')    	
                        )	
           AND    DTS.PRD_PRC_ID NOT IN ('219609','760016')   	
      UNION 	
           SELECT DTS.PRD_PRC_ID ID_PRODUCT, MST.PRD_NM NM_PRODUCT,NULL ID_PACKAGE , NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PPM_FREE_JOIN_PERD_CD 	
           FROM PD_PRD_PRC_DTS DTS 	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
           INNER JOIN PD_PRD_AGMT_DTS C ON DTS.PRD_PRC_ID = C.PRD_PRC_ID	
           WHERE DTS.PRD_PRC_ID IN ('2194407','2194408')  	
           AND C.PRD_AGMT_PERD_CD = '0'	
       MINUS       	
           SELECT DTS.PRD_PRC_ID ID_PRODUCT, MST.PRD_NM NM_PRODUCT,NULL ID_PACKAGE , NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PPM_FREE_JOIN_PERD_CD 	
           FROM PD_PRD_PRC_DTS DTS 	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID   	
           WHERE DTS.PRD_PRC_ID IN ( SELECT CD_PROG_DTL1 FROM IEMA_PROG WHERE CD_PROG_GRP = '000003')                      	
       )
			) T1
WHERE 1=1
    AND (:prdNm IS NULL OR UPPER(NM_PRODUCT) LIKE '%' || UPPER(:prdNm) || '%')
    AND NOT EXISTS (
                     SELECT 1 FROM IEMA_PROG T2
                     WHERE CD_PROG_GRP = '000036'
                       AND CD_PROG = 'T0004'
                       AND T1.ID_PRODUCT = T2.CD_PROG_DTL1)
);
