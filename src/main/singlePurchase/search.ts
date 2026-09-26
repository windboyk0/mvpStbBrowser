import productListSql from './sql/productList.sql?raw'
import productCountSql from './sql/productCount.sql?raw'
import { errorMessage, withConnection } from './db'
import { readSettings } from './settings'
import {
  PAGE_SIZE,
  PRD_TYP_CODES,
  type PrdTypCd,
  type ProductRow,
  type SearchRequest,
  type SearchResult
} from './types'

// [A] 상품 조회 — R1.2 ~ R1.6, R1.9 (query_productList.sql, 바인드 변수)

interface ProductDbRow {
  PRD_PRC_ID: string | number
  PRD_NM: string | null
  SALE_PRC: number | string | null
  PRD_TYP_CD: string | null
  RESOLUTION: string | null
  VIEW_PERIOD: string | null
}

interface CountDbRow {
  TOTAL_CNT: number | string
}

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

/** renderer 입력값 정리 — 유형 코드 검증, 빈 상품명 → null, 페이지 1 이상 정수 */
export function normalizeSearch(req: Partial<SearchRequest> | undefined): SearchRequest {
  const prdTypCd = PRD_TYP_CODES.includes(req?.prdTypCd as PrdTypCd)
    ? (req?.prdTypCd as PrdTypCd)
    : null
  const prdNm = typeof req?.prdNm === 'string' && req.prdNm.trim() !== '' ? req.prdNm.trim() : null
  const page = Number.isInteger(req?.page) && (req?.page as number) > 0 ? (req?.page as number) : 1
  return { prdTypCd, prdNm, page }
}

export async function search(payload: unknown): Promise<SearchResult> {
  try {
    const { prdTypCd, prdNm, page } = normalizeSearch(payload as Partial<SearchRequest>)
    const settings = readSettings()
    const filter = { prdTypCd, prdNm }

    return await withConnection(settings, async (query) => {
      const countRows = await query<CountDbRow>(productCountSql, filter)
      const rows = await query<ProductDbRow>(productListSql, {
        ...filter,
        offset: (page - 1) * PAGE_SIZE,
        pageSize: PAGE_SIZE
      })
      return {
        ok: true as const,
        total: Number(countRows[0]?.TOTAL_CNT ?? 0),
        rows: rows.map((r): ProductRow => ({
          prdPrcId: toText(r.PRD_PRC_ID),
          prdNm: toText(r.PRD_NM),
          salePrc: Number(r.SALE_PRC ?? 0),
          prdTypCd: toText(r.PRD_TYP_CD),
          resolution: toText(r.RESOLUTION),
          viewPeriod: toText(r.VIEW_PERIOD)
        }))
      }
    })
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}
