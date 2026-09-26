/* [A] 가입가능 월정액 상품 조회 — 상품유형 VAS (VAS (부가서비스, CD_PROD_TYPE 60))
 * 파일: query_productList_vas.sql  / 상품유형 선택값 → 파일 매핑은 monthlyPurchase_spec.md R1.2 참고
 * 원본: Monthly_Select_Query.txt (vibeContext/Reference/030_monthlyPurchase/Query/, 로컬 전용·추후 삭제)
 * 원본 대비 변경점: 원본 UNION 블록 중 GUBUN = 'VAS' 블록만 사용
 *   - 서비스관리번호 하드코딩 → :svcMgmtNo / 주민법인일련번호 '802059' → (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo)
 *   - 상품명 조건 (:prdNm NULL/빈 값 = 전체), 정렬 NM_PRODUCT → ID_PRODUCT, 페이지 OFFSET/FETCH (Oracle 19c)
 * 바인드 변수: :svcMgmtNo, :prdNm, :offset ((페이지-1)*10), :pageSize (10)
 * 결과 컬럼: GUBUN, ID_PRODUCT, NM_PRODUCT, ID_PACKAGE, ID_PRODUCT_PAR, TP_PPM, AMT_PRICE(부가세 포함), PPM_FREE_JOIN_PERD_CD, AGMT_MNDT_YN
 */

/* ===== 목록 ===== */
SELECT * FROM (
	
			    SELECT 'VAS' GUBUN   	  	
			        , TO_CHAR(ID_PRODUCT) ID_PRODUCT  	  	
			        , TO_CHAR(NM_PRODUCT) NM_PRODUCT  	  	
			        , TO_CHAR(ID_PACKAGE) ID_PACKAGE  	  	
			        , TO_CHAR(ID_PRODUCT_PAR) ID_PRODUCT_PAR  	  	
			        , TO_CHAR(TP_PPM) TP_PPM  	  	
			        , TO_CHAR(TRUNC(AMT_PRICE*1.1)) AMT_PRICE  	  	
			        , NULL PPM_FREE_JOIN_PERD_CD                         
        			, 'N' AGMT_MNDT_YN         	
			    FROM (  	  	
			        SELECT  	  	
			            ID_PRODUCT, NM_PRODUCT, ID_PACKAGE, ID_PRODUCT_PAR, TP_PPM, AMT_PRICE  	  	
			            FROM IESV_PROD_INFO A              	  	
			        WHERE 1 = 1 	  	
			            AND CD_PROD_TYPE = '60'  	  	
			            AND NVL(YN_USE,'Y') = 'Y'   	  	
			            AND YN_SUPL_MST ='N'     	  	
			            AND TO_CHAR(DT_PRODUCT_END,'YYYYMMDD') >= TO_CHAR(SYSDATE,'YYYYMMDD')     	  	
			            AND TO_CHAR(DT_PRODUCT_START,'YYYYMMDD') <= TO_CHAR(SYSDATE,'YYYYMMDD')     	  	
			            AND (DT_PRODUCT_SALE_END IS NULL OR DT_PRODUCT_SALE_END > SYSDATE) 	      	  	
			            AND ID_PRODUCT NOT IN (SELECT CD_PROG FROM IEMA_PROG WHERE CD_PROG_GRP = '000016')    	  	  	
			            AND ID_PRODUCT NOT IN ('2835324', '2835742', '2837470', '2837474', '2837171', '2837157', '2837472')	   	  	
			            AND ID_PRODUCT NOT IN (SELECT CD_PROG FROM IEMA_PROG WHERE CD_PROG_GRP = '000002')	  	  	
       			)      	
    		WHERE ID_PRODUCT IN ( SELECT CD_PROG_DTL1	
             FROM IEMA_PROG 	
             WHERE 1 = 1 	
              AND CD_PROG_GRP = '000014'	
           AND CD_PROG  = 	
            DECODE( :svcMgmtNo ,NULL,CD_PROG, ( SELECT TECH_MTHD_CD FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo ) ) 	
             GROUP BY CD_PROG_DTL1 	
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
	
			    SELECT 'VAS' GUBUN   	  	
			        , TO_CHAR(ID_PRODUCT) ID_PRODUCT  	  	
			        , TO_CHAR(NM_PRODUCT) NM_PRODUCT  	  	
			        , TO_CHAR(ID_PACKAGE) ID_PACKAGE  	  	
			        , TO_CHAR(ID_PRODUCT_PAR) ID_PRODUCT_PAR  	  	
			        , TO_CHAR(TP_PPM) TP_PPM  	  	
			        , TO_CHAR(TRUNC(AMT_PRICE*1.1)) AMT_PRICE  	  	
			        , NULL PPM_FREE_JOIN_PERD_CD                         
        			, 'N' AGMT_MNDT_YN         	
			    FROM (  	  	
			        SELECT  	  	
			            ID_PRODUCT, NM_PRODUCT, ID_PACKAGE, ID_PRODUCT_PAR, TP_PPM, AMT_PRICE  	  	
			            FROM IESV_PROD_INFO A              	  	
			        WHERE 1 = 1 	  	
			            AND CD_PROD_TYPE = '60'  	  	
			            AND NVL(YN_USE,'Y') = 'Y'   	  	
			            AND YN_SUPL_MST ='N'     	  	
			            AND TO_CHAR(DT_PRODUCT_END,'YYYYMMDD') >= TO_CHAR(SYSDATE,'YYYYMMDD')     	  	
			            AND TO_CHAR(DT_PRODUCT_START,'YYYYMMDD') <= TO_CHAR(SYSDATE,'YYYYMMDD')     	  	
			            AND (DT_PRODUCT_SALE_END IS NULL OR DT_PRODUCT_SALE_END > SYSDATE) 	      	  	
			            AND ID_PRODUCT NOT IN (SELECT CD_PROG FROM IEMA_PROG WHERE CD_PROG_GRP = '000016')    	  	  	
			            AND ID_PRODUCT NOT IN ('2835324', '2835742', '2837470', '2837474', '2837171', '2837157', '2837472')	   	  	
			            AND ID_PRODUCT NOT IN (SELECT CD_PROG FROM IEMA_PROG WHERE CD_PROG_GRP = '000002')	  	  	
       			)      	
    		WHERE ID_PRODUCT IN ( SELECT CD_PROG_DTL1	
             FROM IEMA_PROG 	
             WHERE 1 = 1 	
              AND CD_PROG_GRP = '000014'	
           AND CD_PROG  = 	
            DECODE( :svcMgmtNo ,NULL,CD_PROG, ( SELECT TECH_MTHD_CD FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo ) ) 	
             GROUP BY CD_PROG_DTL1 	
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
