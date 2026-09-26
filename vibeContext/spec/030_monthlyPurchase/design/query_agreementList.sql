/* [C] 약정 선택 목록 — 선택한 월정액 상품의 약정기간 옵션
 * 원본: agreement_select_query.txt (vibeContext/Reference/030_monthlyPurchase/Query/, 로컬 전용·추후 삭제)
 * 원본 대비 변경점: 하드코딩된 상품ID → 바인드 변수 :prdPrcId (2곳), 그 외 원본 그대로
 * 바인드 변수: :prdPrcId — [A] 목록에서 선택한 행의 ID_PRODUCT (상품가격ID 또는 채널팩상품ID)
 * 결과: 약정기간 > 0 개월 옵션만 (무약정 제외), 개월 수 오름차순
 *   CNTR_NAME     표시용 문구 (예: 8,910원 [12개월 약정- 990원(10%)할인])
 *   PRD_AGMT_ID   약정ID → IF-EPS-001 prdAgmtId
 *   PER_MM_CNTR   약정기간 개월 수
 *   AMT_SALE      약정 판매가 (부가세 포함)
 *   AMT_DSC       무약정 대비 할인액 (부가세 포함)
 *   RT_DSC        약정 할인율 (%)
 *   STR_AMT_SALE  약정 판매가 문자열 (천 단위 콤마)
 */
		SELECT									
		    TRIM(TO_CHAR(TRUNC(SALE_PRC * 1.1),'999,999,999'))  || '원 [' || 									
		    (SELECT NVL(CD_NM, PRD_AGMT_PERD_CD || '개월') FROM AD_COMM_CD WHERE COMM_GRP_CD = 'PRD_AGMT_PERD_CD' AND COMM_CD = PRD_AGMT_PERD_CD || '')									
		    || ' 약정- '||     									
		    TRIM(TO_CHAR(TRUNC((BASE_PRC -  SALE_PRC) * 1.1) , '999,999,999'))  									
		    || '원(' || DSC_RT || '%)할인] ' AS CNTR_NAME,									
		    PRD_AGMT_ID,									
		    PRD_AGMT_PERD_CD PER_MM_CNTR,									
		    TRUNC(SALE_PRC * 1.1) AMT_SALE,									
		    TRUNC((BASE_PRC -  SALE_PRC) * 1.1) AMT_DSC,									
		    DSC_RT RT_DSC,									
		    TRIM(TO_CHAR(TRUNC((SALE_PRC) * 1.1) , '999,999,999'))  STR_AMT_SALE 									
		FROM     (									
		    SELECT 									
		          PRD_AGMT_ID				-- 약정ID									
		        , PRD_ID					-- 상품마스터ID									
		        , PRD_PRC_ID				-- 상품가격ID									
		        , (SELECT SALE_PRC FROM PD_PRD_AGMT_DTS O 									
		            WHERE PRD_AGMT_PERD_CD = '0' 									
		              AND TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') BETWEEN PRD_AGMT_FR_DT AND PRD_AGMT_TO_DT									
		              AND O.PRD_PRC_ID = S.PRD_PRC_ID									
		              AND ROWNUM = 1) BASE_PRC		-- 무약정판매금액									
		        , SALE_PRC					-- 약정판매금액									
		        , PRD_AGMT_PERD_CD			-- 약정기간코드									
		        , DSC_RT					-- 약정할인율									
		     FROM 									
		            PD_PRD_AGMT_DTS S									
		     WHERE TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') BETWEEN PRD_AGMT_FR_DT AND PRD_AGMT_TO_DT  									
			       AND PRD_PRC_ID = :prdPrcId	/* 상품가격ID */							
		       AND TO_NUMBER(PRD_AGMT_PERD_CD) > TO_NUMBER(NVL('', '0'))									
		UNION ALL									
		    SELECT									
		          CHNL_PRD_AGMT_ID PRD_AGMT_ID									
		        , CHNL_PRD_ID PRD_ID									
		        , CHNL_PRD_ID PRD_PRC_ID									
		        , (SELECT SALE_PRC FROM PD_CHNL_PRD_AGMT_DTS O 									
		            WHERE PRD_AGMT_PERD_CD = '0' 									
		              AND TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') BETWEEN PRD_AGMT_FR_DT AND PRD_AGMT_TO_DT									
		              AND O.CHNL_PRD_ID = S.CHNL_PRD_ID									
		              AND ROWNUM = 1) BASE_PRC									
		        , SALE_PRC									
		        , PRD_AGMT_PERD_CD									
		        , DSC_RT									
		    FROM 									
		        PD_CHNL_PRD_AGMT_DTS S									
		    WHERE TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') BETWEEN PRD_AGMT_FR_DT AND PRD_AGMT_TO_DT									
		      AND CHNL_PRD_ID = :prdPrcId         /* 채널팩상품ID */									
		      AND TO_NUMBER(PRD_AGMT_PERD_CD) > TO_NUMBER(NVL('', '0'))									
) ORDER BY TO_NUMBER(PER_MM_CNTR) ASC;
