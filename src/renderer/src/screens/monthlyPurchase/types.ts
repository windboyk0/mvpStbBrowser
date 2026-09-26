// IPC 계약 형식 — main `src/main/monthlyPurchase/ipc.ts` 와 같은 형식 (코드 공유 없이 형식만 맞춘다)

/** 상품유형 선택값 (R1.2) — 'ALL' = 전체 */
export type ProductType = 'ALL' | 'VOD' | 'CMP' | 'YTP' | 'DNP' | 'VAS' | 'IPTV'

export const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'VOD', label: 'VOD' },
  { value: 'CMP', label: 'CMP' },
  { value: 'YTP', label: 'YTP' },
  { value: 'DNP', label: 'DNP' },
  { value: 'VAS', label: 'VAS' },
  { value: 'IPTV', label: 'IPTV' }
]

export interface Product {
  gubun: string
  idProduct: string
  nmProduct: string
  idPackage: string
  idProductPar: string
  tpPpm: string
  amtPrice: string
  ppmFreeJoinPerdCd: string
  agmtMndtYn: string
}

export type PrdAgmtId = string | number | null

export interface Agreement {
  prdAgmtId: PrdAgmtId
  months: number
  amtSale: number
}

export type SearchResult =
  { ok: true; rows: Product[]; total: number } | { ok: false; error: string }

export type AgreementsResult = { ok: true; rows: Agreement[] } | { ok: false; error: string }

export type PurchaseResult =
  { kind: 'response'; result: string; reason: string } | { kind: 'error'; message: string }

/** 조회조건 · 페이지 (2. 공통 동작 — 복귀 시 유지) */
export interface SearchQuery {
  type: ProductType
  prdNm: string
  page: number
}

export const PAGE_SIZE = 10
