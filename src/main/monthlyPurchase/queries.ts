// Query 원문은 spec 폴더의 query_*.sql 을 그대로 번들한다 (spec 4. 설계 › 소스 위치 — `?raw` import)
import productListAll from '../../../vibeContext/spec/030_monthlyPurchase/design/query_productList_all.sql?raw'
import productListVod from '../../../vibeContext/spec/030_monthlyPurchase/design/query_productList_vod.sql?raw'
import productListCmp from '../../../vibeContext/spec/030_monthlyPurchase/design/query_productList_cmp.sql?raw'
import productListYtp from '../../../vibeContext/spec/030_monthlyPurchase/design/query_productList_ytp.sql?raw'
import productListDnp from '../../../vibeContext/spec/030_monthlyPurchase/design/query_productList_dnp.sql?raw'
import productListVas from '../../../vibeContext/spec/030_monthlyPurchase/design/query_productList_vas.sql?raw'
import productListIptv from '../../../vibeContext/spec/030_monthlyPurchase/design/query_productList_iptv.sql?raw'
import agreementList from '../../../vibeContext/spec/030_monthlyPurchase/design/query_agreementList.sql?raw'
import stbId from '../../../vibeContext/spec/030_monthlyPurchase/design/query_stbId.sql?raw'
import couponList from '../../../vibeContext/spec/030_monthlyPurchase/design/query_couponList.sql?raw'
import { splitStatements, plsqlBlock } from './sql'

/** 상품유형 선택값 (R1.2) — 'ALL' = 전체 */
export const PRODUCT_TYPES = ['ALL', 'VOD', 'CMP', 'YTP', 'DNP', 'VAS', 'IPTV'] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

const PRODUCT_LIST_FILES: Record<ProductType, string> = {
  ALL: productListAll,
  VOD: productListVod,
  CMP: productListCmp,
  YTP: productListYtp,
  DNP: productListDnp,
  VAS: productListVas,
  IPTV: productListIptv
}

export interface ProductListSql {
  list: string
  count: string
}

/** R1.2 상품유형 → 실행할 Query 파일 (목록 + 전체 건수 2개 문) */
export function productListSql(type: ProductType): ProductListSql {
  const [list, count] = splitStatements(PRODUCT_LIST_FILES[type])
  if (!list || !count) throw new Error(`Query 파일 형식 오류: productList_${type}`)
  return { list, count }
}

export function agreementListSql(): string {
  return splitStatements(agreementList)[0]
}

export function stbIdSql(): string {
  return splitStatements(stbId)[0]
}

/** R5.2 사용가능 쿠폰 조회 — PL/SQL 블록 그대로 (목록/건수 분리 없음, 끝 `;` 유지) */
export function couponListSql(): string {
  return plsqlBlock(couponList)
}
