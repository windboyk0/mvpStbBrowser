/* [A] 가입가능 월정액 상품 조회 — 상품유형 전체 (CUG 제외 전 유형)
 * 파일: query_productList_all.sql  / 상품유형 선택값 → 파일 매핑은 monthlyPurchase_spec.md R1.2 참고
 * 원본: Monthly_Select_Query.txt (vibeContext/Reference/030_monthlyPurchase/Query/, 로컬 전용·추후 삭제)
 * 원본 대비 변경점: GUBUN = CUG 블록 제외, CMP/OMNI 공용 블록의 PRD_TYP_CD IN ('36','38') → = '36' (OMNI 제외), 그 외 원본 그대로
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
   UNION       	
    SELECT DECODE(PRD_TYP_CD, '32','PERD', '38','OMNI','CMP') GUBUN      	
        , TO_CHAR(ID_PRODUCT) ID_PRODUCT 			
        , TO_CHAR(NM_PRODUCT) NM_PRODUCT 			
        , TO_CHAR(ID_PACKAGE) ID_PACKAGE 			
        , TO_CHAR(ID_PRODUCT_PAR) ID_PRODUCT_PAR 		
        , TO_CHAR(TP_PPM) TP_PPM 				
        , TO_CHAR(TRUNC(AMT_PRICE*1.1)) AMT_PRICE       		
        , TO_CHAR(PPM_FREE_JOIN_PERD_CD) PPM_FREE_JOIN_PERD_CD       		
        ,'N' AGMT_MNDT_YN         	
    FROM (      					
        SELECT DTS.PRD_PRC_ID ID_PRODUCT, PRD_NM NM_PRODUCT, NULL ID_PACKAGE, NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PRD_TYP_CD, MST.PPM_FREE_JOIN_PERD_CD 	
        FROM PD_PRD_PRC_DTS DTS	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
        WHERE  MST.PRD_TYP_CD = '36' -- 32: 기간권  36: PPM커머스  38: OMNIPACK 	
            AND MST.USE_YN = 'Y'		
            AND TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN DTS.PRD_PRC_FR_DT AND DTS.PRD_PRC_TO_DT 	
            AND NVL(MST.PRD_COMPO_CD,'10') <> '20'	
            AND MST.PRD_ID IN (SELECT DTS.PRD_ID	
                                FROM PD_PRD_CUG_DTS DTS, PD_PRD_MST MST  
                                WHERE DTS.PRD_ID = MST.PRD_ID AND DTS.PRD_GRP_ID = MST.PRD_GRP_ID 	
                                    AND CUG_ID = NVL((SELECT SERVICE_CODE FROM STB WHERE USER_SERVICE_NUM = :svcMgmtNo ),'0')    
                              )	
            AND DTS.PRD_PRC_ID NOT IN ('219609','760016')   	
    )    
   UNION ALL	
   SELECT  /* CBS$$CBS-WAS$$YTP가입가능상품조회$$유라클 */                                              
           'YTP' GUBUN                                                                           
           ,TO_CHAR(DTS.PRD_PRC_ID) AS ID_PRODUCT                                                
           ,TO_CHAR(MST.PRD_NM)  AS NM_PRODUCT                                                   
           ,NULL AS ID_PACKAGE                                                                   
           ,NULL AS ID_PRODUCT_PAR                                                               
           ,NULL AS TP_PPM                                                                       
           ,TO_CHAR(TRUNC((NVL( DTS.SALE_PRC, 0) - NVL(PRC.DSC_PRC, 0)) * 1.1)) AS AMT_PRICE     
           ,MST.PPM_FREE_JOIN_PERD_CD                                                            
        	  ,'N' AGMT_MNDT_YN         	
   FROM    IESM_CUST_SVC SVC                                                                     
           INNER JOIN                                                                            
           IEMA_PROG PRG                                                                         
           ON (PRG.CD_PROG_GRP = '000052'                                                        
               AND PRG.CD_PROG = SVC.TECH_MTHD_CD)                                               
           INNER JOIN                                                                            
           PD_PRD_PRC_DTS DTS                                                                    
           ON (DTS.PRD_PRC_ID = PRG.CD_PROG_DTL1)                                                
           INNER JOIN                                                                            
           PD_PRD_MST MST                                                                        
           ON (MST.PRD_ID = DTS.PRD_ID)                                                          
           LEFT JOIN                                                                             
           (   /* Tier 에 따른 YTP 할인금액 */                                                       
           SELECT  DM.DSC_SVC_CD, UP.UKEY_PRD_ID, MAX(DM.DSC_PRC) AS DSC_PRC                     
           FROM    PD_DSC_TGT_MST DM                                                             
                   INNER JOIN PD_UKEY_PRD_PPM_REL UP ON (DM.PRD_ID = UP.PRD_ID)                  
           WHERE   TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') BETWEEN DM.DSC_FR_DT AND DM.DSC_TO_DT	
           AND     DM.USE_YN = 'Y'                                                               
           AND     DSC_FG_CD = '02'                                                              
           GROUP BY DM.DSC_SVC_CD, UP.UKEY_PRD_ID                                                
           ) PRC                                                                                 
           ON (PRC.DSC_SVC_CD = MST.PRD_ID                                                       
               AND PRC.UKEY_PRD_ID = SVC.ID_PROD)                                                
   WHERE   SVC.ID_CUST_SVC = :svcMgmtNo                                                                   
    UNION	
   SELECT  'DNP'           AS GUBUN                                                              
           ,DTS.PRD_PRC_ID AS ID_PRODUCT                                                         
           ,MST.PRD_NM     AS NM_PRODUCT                                                         
           ,NULL           AS ID_PAKAGE                                                          
           ,NULL           AS ID_PRODUCT_PAR                                                     
           ,NULL           AS TP_PPM                                                             
           ,TO_CHAR(TRUNC(NVL( DTS.SALE_PRC, 0)*1.1)) AMT_PRICE                                  
           ,MST.PPM_FREE_JOIN_PERD_CD                                                            
           ,'N' AGMT_MNDT_YN                                                                     
   FROM    IEMA_PROG CD                                                                          
           INNER JOIN PD_PRD_PRC_DTS DTS                                                         
           ON (DTS.PRD_PRC_ID = CD.CD_PROG)                                                      
           INNER JOIN PD_PRD_MST MST                                                             
           ON (DTS.PRD_ID = MST.PRD_ID)                                                          
   WHERE   CD_PROG_GRP = '000054'  --DISNEY                                                      
   AND     MST.USE_YN = 'Y'                                                                      
   AND     TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN DTS.PRD_PRC_FR_DT AND DTS.PRD_PRC_TO_DT	
   AND     :svcMgmtNo IS NOT NULL																			
    UNION	
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
    UNION      	
       SELECT 'IPTV' GUBUN      	
           , TO_CHAR(ID_PROD) ID_PRODUCT      	
           , TO_CHAR(NM_PROD) NM_PRODUCT      	
           , '' ID_PACKAGE      	
           , '' ID_PRODUCT_PAR      	
           , '' TP_PPM      	
           , TO_CHAR(TRUNC(AMT_SALE*1.1)) AMT_PRICE      	
           , TO_CHAR(PPM_FREE_JOIN_PERD_CD) PPM_FREE_JOIN_PERD_CD    	
           , 'N' AGMT_MNDT_YN         	
       FROM ( 	
           SELECT PROD.CHNL_PRD_ID ID_PROD, CHNL_PRD_NM NM_PROD, OLDPRD_PKG_CD AS CD_PACKAGE, '10' AS CD_TYPE,  NVL( PROD.SALE_PRC, 0)  AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD 	
           FROM   PD_CHNL_PRD_MST PROD 	
           INNER JOIN PD_CHNL_PRD_AGMT_DTS C ON PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
           WHERE    PROD.ADDN_PRD_YN = 'Y'	
           AND    PROD.ASIS_PRD_TYP_CD = '30'	
           AND    NVL(PROD.PRD_COMPO_CD,'10') <> '20'	
           AND    NVL( PROD.SALE_PRC, 0) > 0 	
           AND    TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN PROD.SVC_FR_DT AND PROD.SVC_TO_DT 	
           AND    TO_NUMBER(PROD.OLDPRD_PKG_CD) > DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL)))	
           AND    NOT ( PROD.CHNL_PRD_ID IN ('PP21000042') AND DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL))) BETWEEN 35 AND 36 )	
           AND C.PRD_AGMT_PERD_CD = '0'	
        UNION      	
           SELECT PROD.CHNL_PRD_ID ID_PROD, CHNL_PRD_NM NM_PROD, NULL CD_PACKAGE, NULL CD_TYPE, NVL( PROD.SALE_PRC, 0) AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD 	
           FROM   PD_CHNL_PRD_MST PROD 	
           INNER JOIN PD_CHNL_PRD_AGMT_DTS C ON PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
           WHERE  PROD.CHNL_PRD_ID IN ('PP21000059')	
           AND    TO_NUMBER(PROD.OLDPRD_PKG_CD) > DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL)))	
           AND C.PRD_AGMT_PERD_CD = '0'	
           	
			UNION  	  	
			  SELECT PROD.CHNL_PRD_ID ID_PROD, PROD.CHNL_PRD_NM NM_PROD, OLDPRD_PKG_CD AS CD_PACKAGE, '10' AS CD_TYPE, NVL( PROD.SALE_PRC, 0) AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD     	  	
			  FROM   PD_CHNL_PRD_MST PROD	  	  	
           INNER JOIN PD_CHNL_PRD_AGMT_DTS C ON PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
			  WHERE  PROD.CHNL_PRD_ID IN ('PP21000038')   	  	
			  AND    1 = decode('2','2','1','3','1',NULL)   	  	
           AND    TO_NUMBER(PROD.OLDPRD_PKG_CD) > DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL)))	
           AND C.PRD_AGMT_PERD_CD = '0'	
        UNION 	
           SELECT DTS.PRD_PRC_ID ID_PROD, MST.PRD_NM NM_PROD, NULL CD_PACKAGE , NULL CD_TYPE, NVL( DTS.SALE_PRC, 0) AMT_SALE, MST.PPM_FREE_JOIN_PERD_CD  		
           FROM PD_PRD_PRC_DTS DTS 	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
           INNER JOIN PD_PRD_AGMT_DTS C ON DTS.PRD_PRC_ID = C.PRD_PRC_ID	
           WHERE MST.PRD_TYP_CD = '35'	
           AND MST.ASIS_PRD_TYP_CD = '30'	
           AND TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN MST.SVC_FR_DT AND MST.SVC_TO_DT 	
           AND    DTS.SALE_PRC > 0	
           AND    NOT ( DTS.PRD_PRC_ID IN ('2100000001') AND DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL))) BETWEEN 35 AND 36 )	
           AND C.PRD_AGMT_PERD_CD = '0'	
       UNION 	
           SELECT PROD.CHNL_PRD_ID ID_PROD, CHNL_PRD_NM ||'(UHD채널팩)' , NULL CD_PACKAGE, NULL CD_TYPE,  NVL( PROD.SALE_PRC, 0) AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD 		
           FROM   PD_CHNL_PRD_MST PROD, (SELECT * FROM IEMA_PROG WHERE CD_PROG_GRP = '000012' AND CD_PROG = '2') PROG 	
           , PD_CHNL_PRD_AGMT_DTS C	
           WHERE PROG.CD_PROG_DTL1 = PROD.CHNL_PRD_ID	
           AND  PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
           AND C.PRD_AGMT_PERD_CD = '0'	
           AND EXISTS (	
               SELECT 'A' FROM IESM_CUST_SVC 	
               WHERE TECH_MTHD_CD||ID_PROD = PROG.CD_PROG_DTL2	
               AND ID_CUST_SVC = :svcMgmtNo AND CTZ_CORP_SER_NUM = (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo)	
           )	
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
   UNION       	
    SELECT DECODE(PRD_TYP_CD, '32','PERD', '38','OMNI','CMP') GUBUN      	
        , TO_CHAR(ID_PRODUCT) ID_PRODUCT 			
        , TO_CHAR(NM_PRODUCT) NM_PRODUCT 			
        , TO_CHAR(ID_PACKAGE) ID_PACKAGE 			
        , TO_CHAR(ID_PRODUCT_PAR) ID_PRODUCT_PAR 		
        , TO_CHAR(TP_PPM) TP_PPM 				
        , TO_CHAR(TRUNC(AMT_PRICE*1.1)) AMT_PRICE       		
        , TO_CHAR(PPM_FREE_JOIN_PERD_CD) PPM_FREE_JOIN_PERD_CD       		
        ,'N' AGMT_MNDT_YN         	
    FROM (      					
        SELECT DTS.PRD_PRC_ID ID_PRODUCT, PRD_NM NM_PRODUCT, NULL ID_PACKAGE, NULL ID_PRODUCT_PAR, NULL TP_PPM, NVL( DTS.SALE_PRC, 0) AMT_PRICE, MST.PRD_TYP_CD, MST.PPM_FREE_JOIN_PERD_CD 	
        FROM PD_PRD_PRC_DTS DTS	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
        WHERE  MST.PRD_TYP_CD = '36' -- 32: 기간권  36: PPM커머스  38: OMNIPACK 	
            AND MST.USE_YN = 'Y'		
            AND TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN DTS.PRD_PRC_FR_DT AND DTS.PRD_PRC_TO_DT 	
            AND NVL(MST.PRD_COMPO_CD,'10') <> '20'	
            AND MST.PRD_ID IN (SELECT DTS.PRD_ID	
                                FROM PD_PRD_CUG_DTS DTS, PD_PRD_MST MST  
                                WHERE DTS.PRD_ID = MST.PRD_ID AND DTS.PRD_GRP_ID = MST.PRD_GRP_ID 	
                                    AND CUG_ID = NVL((SELECT SERVICE_CODE FROM STB WHERE USER_SERVICE_NUM = :svcMgmtNo ),'0')    
                              )	
            AND DTS.PRD_PRC_ID NOT IN ('219609','760016')   	
    )    
   UNION ALL	
   SELECT  /* CBS$$CBS-WAS$$YTP가입가능상품조회$$유라클 */                                              
           'YTP' GUBUN                                                                           
           ,TO_CHAR(DTS.PRD_PRC_ID) AS ID_PRODUCT                                                
           ,TO_CHAR(MST.PRD_NM)  AS NM_PRODUCT                                                   
           ,NULL AS ID_PACKAGE                                                                   
           ,NULL AS ID_PRODUCT_PAR                                                               
           ,NULL AS TP_PPM                                                                       
           ,TO_CHAR(TRUNC((NVL( DTS.SALE_PRC, 0) - NVL(PRC.DSC_PRC, 0)) * 1.1)) AS AMT_PRICE     
           ,MST.PPM_FREE_JOIN_PERD_CD                                                            
        	  ,'N' AGMT_MNDT_YN         	
   FROM    IESM_CUST_SVC SVC                                                                     
           INNER JOIN                                                                            
           IEMA_PROG PRG                                                                         
           ON (PRG.CD_PROG_GRP = '000052'                                                        
               AND PRG.CD_PROG = SVC.TECH_MTHD_CD)                                               
           INNER JOIN                                                                            
           PD_PRD_PRC_DTS DTS                                                                    
           ON (DTS.PRD_PRC_ID = PRG.CD_PROG_DTL1)                                                
           INNER JOIN                                                                            
           PD_PRD_MST MST                                                                        
           ON (MST.PRD_ID = DTS.PRD_ID)                                                          
           LEFT JOIN                                                                             
           (   /* Tier 에 따른 YTP 할인금액 */                                                       
           SELECT  DM.DSC_SVC_CD, UP.UKEY_PRD_ID, MAX(DM.DSC_PRC) AS DSC_PRC                     
           FROM    PD_DSC_TGT_MST DM                                                             
                   INNER JOIN PD_UKEY_PRD_PPM_REL UP ON (DM.PRD_ID = UP.PRD_ID)                  
           WHERE   TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') BETWEEN DM.DSC_FR_DT AND DM.DSC_TO_DT	
           AND     DM.USE_YN = 'Y'                                                               
           AND     DSC_FG_CD = '02'                                                              
           GROUP BY DM.DSC_SVC_CD, UP.UKEY_PRD_ID                                                
           ) PRC                                                                                 
           ON (PRC.DSC_SVC_CD = MST.PRD_ID                                                       
               AND PRC.UKEY_PRD_ID = SVC.ID_PROD)                                                
   WHERE   SVC.ID_CUST_SVC = :svcMgmtNo                                                                   
    UNION	
   SELECT  'DNP'           AS GUBUN                                                              
           ,DTS.PRD_PRC_ID AS ID_PRODUCT                                                         
           ,MST.PRD_NM     AS NM_PRODUCT                                                         
           ,NULL           AS ID_PAKAGE                                                          
           ,NULL           AS ID_PRODUCT_PAR                                                     
           ,NULL           AS TP_PPM                                                             
           ,TO_CHAR(TRUNC(NVL( DTS.SALE_PRC, 0)*1.1)) AMT_PRICE                                  
           ,MST.PPM_FREE_JOIN_PERD_CD                                                            
           ,'N' AGMT_MNDT_YN                                                                     
   FROM    IEMA_PROG CD                                                                          
           INNER JOIN PD_PRD_PRC_DTS DTS                                                         
           ON (DTS.PRD_PRC_ID = CD.CD_PROG)                                                      
           INNER JOIN PD_PRD_MST MST                                                             
           ON (DTS.PRD_ID = MST.PRD_ID)                                                          
   WHERE   CD_PROG_GRP = '000054'  --DISNEY                                                      
   AND     MST.USE_YN = 'Y'                                                                      
   AND     TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN DTS.PRD_PRC_FR_DT AND DTS.PRD_PRC_TO_DT	
   AND     :svcMgmtNo IS NOT NULL																			
    UNION	
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
    UNION      	
       SELECT 'IPTV' GUBUN      	
           , TO_CHAR(ID_PROD) ID_PRODUCT      	
           , TO_CHAR(NM_PROD) NM_PRODUCT      	
           , '' ID_PACKAGE      	
           , '' ID_PRODUCT_PAR      	
           , '' TP_PPM      	
           , TO_CHAR(TRUNC(AMT_SALE*1.1)) AMT_PRICE      	
           , TO_CHAR(PPM_FREE_JOIN_PERD_CD) PPM_FREE_JOIN_PERD_CD    	
           , 'N' AGMT_MNDT_YN         	
       FROM ( 	
           SELECT PROD.CHNL_PRD_ID ID_PROD, CHNL_PRD_NM NM_PROD, OLDPRD_PKG_CD AS CD_PACKAGE, '10' AS CD_TYPE,  NVL( PROD.SALE_PRC, 0)  AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD 	
           FROM   PD_CHNL_PRD_MST PROD 	
           INNER JOIN PD_CHNL_PRD_AGMT_DTS C ON PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
           WHERE    PROD.ADDN_PRD_YN = 'Y'	
           AND    PROD.ASIS_PRD_TYP_CD = '30'	
           AND    NVL(PROD.PRD_COMPO_CD,'10') <> '20'	
           AND    NVL( PROD.SALE_PRC, 0) > 0 	
           AND    TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN PROD.SVC_FR_DT AND PROD.SVC_TO_DT 	
           AND    TO_NUMBER(PROD.OLDPRD_PKG_CD) > DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL)))	
           AND    NOT ( PROD.CHNL_PRD_ID IN ('PP21000042') AND DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL))) BETWEEN 35 AND 36 )	
           AND C.PRD_AGMT_PERD_CD = '0'	
        UNION      	
           SELECT PROD.CHNL_PRD_ID ID_PROD, CHNL_PRD_NM NM_PROD, NULL CD_PACKAGE, NULL CD_TYPE, NVL( PROD.SALE_PRC, 0) AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD 	
           FROM   PD_CHNL_PRD_MST PROD 	
           INNER JOIN PD_CHNL_PRD_AGMT_DTS C ON PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
           WHERE  PROD.CHNL_PRD_ID IN ('PP21000059')	
           AND    TO_NUMBER(PROD.OLDPRD_PKG_CD) > DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL)))	
           AND C.PRD_AGMT_PERD_CD = '0'	
           	
			UNION  	  	
			  SELECT PROD.CHNL_PRD_ID ID_PROD, PROD.CHNL_PRD_NM NM_PROD, OLDPRD_PKG_CD AS CD_PACKAGE, '10' AS CD_TYPE, NVL( PROD.SALE_PRC, 0) AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD     	  	
			  FROM   PD_CHNL_PRD_MST PROD	  	  	
           INNER JOIN PD_CHNL_PRD_AGMT_DTS C ON PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
			  WHERE  PROD.CHNL_PRD_ID IN ('PP21000038')   	  	
			  AND    1 = decode('2','2','1','3','1',NULL)   	  	
           AND    TO_NUMBER(PROD.OLDPRD_PKG_CD) > DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL)))	
           AND C.PRD_AGMT_PERD_CD = '0'	
        UNION 	
           SELECT DTS.PRD_PRC_ID ID_PROD, MST.PRD_NM NM_PROD, NULL CD_PACKAGE , NULL CD_TYPE, NVL( DTS.SALE_PRC, 0) AMT_SALE, MST.PPM_FREE_JOIN_PERD_CD  		
           FROM PD_PRD_PRC_DTS DTS 	
           INNER JOIN PD_PRD_MST MST ON DTS.PRD_GRP_ID = MST.PRD_GRP_ID AND DTS.PRD_ID = MST.PRD_ID 	
           INNER JOIN PD_PRD_AGMT_DTS C ON DTS.PRD_PRC_ID = C.PRD_PRC_ID	
           WHERE MST.PRD_TYP_CD = '35'	
           AND MST.ASIS_PRD_TYP_CD = '30'	
           AND TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') BETWEEN MST.SVC_FR_DT AND MST.SVC_TO_DT 	
           AND    DTS.SALE_PRC > 0	
           AND    NOT ( DTS.PRD_PRC_ID IN ('2100000001') AND DECODE(:svcMgmtNo,NULL,-1,TO_NUMBER((SELECT FN_CD_SPEED_IPTV( :svcMgmtNo , (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo) ) FROM DUAL))) BETWEEN 35 AND 36 )	
           AND C.PRD_AGMT_PERD_CD = '0'	
       UNION 	
           SELECT PROD.CHNL_PRD_ID ID_PROD, CHNL_PRD_NM ||'(UHD채널팩)' , NULL CD_PACKAGE, NULL CD_TYPE,  NVL( PROD.SALE_PRC, 0) AMT_SALE, PROD.PPM_FREE_JOIN_PERD_CD 		
           FROM   PD_CHNL_PRD_MST PROD, (SELECT * FROM IEMA_PROG WHERE CD_PROG_GRP = '000012' AND CD_PROG = '2') PROG 	
           , PD_CHNL_PRD_AGMT_DTS C	
           WHERE PROG.CD_PROG_DTL1 = PROD.CHNL_PRD_ID	
           AND  PROD.CHNL_PRD_ID = C.CHNL_PRD_ID	
           AND C.PRD_AGMT_PERD_CD = '0'	
           AND EXISTS (	
               SELECT 'A' FROM IESM_CUST_SVC 	
               WHERE TECH_MTHD_CD||ID_PROD = PROG.CD_PROG_DTL2	
               AND ID_CUST_SVC = :svcMgmtNo AND CTZ_CORP_SER_NUM = (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo)	
           )	
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
