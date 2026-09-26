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
}

export interface PurchaseResult {
  ok: boolean
  message: string
}
