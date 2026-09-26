// singlePurchase IPC 요청 · 응답 형식 (renderer `screens/singlePurchase/types.ts` 와 같은 형식 — 모듈 안에서 각자 보유)

/** 상품유형 코드 — 10 VOD PPV, 20 VOD PPS, 41 VOD PPP, 42 VOD Commerce */
export type PrdTypCd = '10' | '20' | '41' | '42'

export const PRD_TYP_CODES: readonly PrdTypCd[] = ['10', '20', '41', '42']

export const PAGE_SIZE = 10

/** `singlePurchase:checkSettings` 응답 */
export interface CheckSettingsResult {
  ok: boolean
  /** 비어 있는 필수 설정 키 */
  missing: string[]
}

/** `singlePurchase:search` 요청 */
export interface SearchRequest {
  /** null = 전체 */
  prdTypCd: PrdTypCd | null
  /** null 또는 빈 문자열 = 전체 */
  prdNm: string | null
  /** 1부터 */
  page: number
}

export interface ProductRow {
  prdPrcId: string
  prdNm: string
  /** 판매가 (부가세 미포함 공급가) */
  salePrc: number
  prdTypCd: string
  /** 해상도 — Query 수신 전까지 빈 값 */
  resolution: string
  /** 시청가능기간 — Query 수신 전까지 빈 값 */
  viewPeriod: string
}

/** `singlePurchase:search` 응답 */
export type SearchResult =
  { ok: true; rows: ProductRow[]; total: number } | { ok: false; message: string }

/** `singlePurchase:purchase` 요청 — 1차: 결제 수단 청구서(paymentType null) 고정 */
export interface PurchaseRequest {
  prdPrcId: string
  useBcash: boolean
}

/** `singlePurchase:purchase` 응답 — [D] 구매완료 표시용 */
export interface PurchaseResult {
  ok: boolean
  message: string
}
