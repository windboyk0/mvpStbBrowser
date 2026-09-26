/* [A] 가입가능 월정액 상품 조회 — 상품유형 YTP (YTP)
 * 파일: query_productList_ytp.sql  / 상품유형 선택값 → 파일 매핑은 monthlyPurchase_spec.md R1.2 참고
 * 원본: Monthly_Select_Query.txt (vibeContext/Reference/030_monthlyPurchase/Query/, 로컬 전용·추후 삭제)
 * 원본 대비 변경점: 원본 UNION 블록 중 GUBUN = 'YTP' 블록만 사용
 *   - 서비스관리번호 하드코딩 → :svcMgmtNo / 주민법인일련번호 '802059' → (SELECT CTZ_CORP_SER_NUM FROM IESM_CUST_SVC WHERE ID_CUST_SVC = :svcMgmtNo)
 *   - 상품명 조건 (:prdNm NULL/빈 값 = 전체), 정렬 NM_PRODUCT → ID_PRODUCT, 페이지 OFFSET/FETCH (Oracle 19c)
 * 바인드 변수: :svcMgmtNo, :prdNm, :offset ((페이지-1)*10), :pageSize (10)
 * 결과 컬럼: GUBUN, ID_PRODUCT, NM_PRODUCT, ID_PACKAGE, ID_PRODUCT_PAR, TP_PPM, AMT_PRICE(부가세 포함), PPM_FREE_JOIN_PERD_CD, AGMT_MNDT_YN
 */

/* ===== 목록 ===== */
SELECT * FROM (
	
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
			) T1
WHERE 1=1
    AND (:prdNm IS NULL OR UPPER(NM_PRODUCT) LIKE '%' || UPPER(:prdNm) || '%')
    AND NOT EXISTS (
                     SELECT 1 FROM IEMA_PROG T2
                     WHERE CD_PROG_GRP = '000036'
                       AND CD_PROG = 'T0004'
                       AND T1.ID_PRODUCT = T2.CD_PROG_DTL1)
);
