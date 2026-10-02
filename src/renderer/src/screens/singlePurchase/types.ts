// singlePurchase IPC 요청 · 응답 형식 (main `main/singlePurchase/types.ts` 와 같은 형식 — 각자 보유)

export type PrdTypCd = '10' | '20' | '41' | '42'

export const PAGE_SIZE = 10

export interface CheckSettingsResult {
  ok: boolean
  missing: string[]
}

export interface SearchRequest {
  /** null = 전체 */
  prdTypCd: PrdTypCd | null
  /** null = 전체 */
  prdNm: string | null
  page: number
}

export interface ProductRow {
  prdPrcId: string
  prdNm: string
  /** 판매가 (부가세 미포함 공급가) */
  salePrc: number
  prdTypCd: string
  resolution: string
  viewPeriod: string
}

export type SearchResult =
  { ok: true; rows: ProductRow[]; total: number } | { ok: false; message: string }

export interface PurchaseRequest {
  prdPrcId: string
  useBcash: boolean
  /** 적용 쿠폰번호 (`NO_COUPON`) — null = 쿠폰 미적용 */
  couponNo: string | null
}

/** `singlePurchase:couponList` 요청 */
export interface CouponListRequest {
  prdPrcId: string
  /** 판매가 (공급가) */
  salePrc: number
}

export interface CouponRow {
  /** NO_COUPON */
  couponNo: string
  /** NM_COUPON */
  name: string
  /** AMT_DISCOUNT (공급가 기준) */
  discount: number
  /** DD_APPLY_END */
  applyEnd: string
}

export type CouponListResult = { ok: true; rows: CouponRow[] } | { ok: false; message: string }

export interface PurchaseResult {
  ok: boolean
  message: string
}
