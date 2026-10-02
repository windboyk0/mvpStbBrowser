import couponListSql from './sql/couponList.sql?raw'
import { errorMessage, withConnection } from './db'
import { readSettings } from './settings'
import type { CouponListRequest, CouponListResult, CouponRow } from './types'

// [C] Step 2 사용가능 쿠폰 조회 — R6.1 ~ R6.3, R6.6 (query_couponList.sql, PL/SQL 블록 + OUT REF CURSOR)
// 파라미터 값은 spec 1.3 쿠폰 잠정값 (Q18 ~ Q22)

interface CouponDbRow {
  NO_COUPON: string | number | null
  NM_COUPON: string | null
  AMT_DISCOUNT: number | string | null
  DD_APPLY_END: string | Date | null
}

const pad = (n: number): string => String(n).padStart(2, '0')

function toText(value: unknown): string {
  if (value instanceof Date) {
    // DATE 컬럼으로 오는 경우 YYYYMMDD (로컬 날짜)
    return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}`
  }
  return value === null || value === undefined ? '' : String(value)
}

export function toCouponRow(r: CouponDbRow): CouponRow {
  const discount = Number(r.AMT_DISCOUNT ?? 0)
  return {
    couponNo: toText(r.NO_COUPON),
    name: toText(r.NM_COUPON),
    discount: Number.isFinite(discount) ? discount : 0,
    applyEnd: toText(r.DD_APPLY_END)
  }
}

export async function couponList(payload: unknown): Promise<CouponListResult> {
  try {
    const req = payload as Partial<CouponListRequest> | undefined
    const prdPrcId = typeof req?.prdPrcId === 'string' ? req.prdPrcId.trim() : ''
    const salePrc = Number(req?.salePrc)
    if (!prdPrcId || !Number.isFinite(salePrc)) throw new Error('선택 상품 정보가 없습니다.')
    const settings = readSettings()

    const rows = await withConnection(settings, (_query, db) =>
      db.queryCursor<CouponDbRow>(
        couponListSql,
        {
          svcMgmtNo: settings.svcMgmtNo,
          idProduct: prdPrcId,
          prdAgmtId: null,
          idContents: null,
          amtPrice: salePrc
        },
        'couponCursor'
      )
    )
    // 쿠폰번호 없는 행은 IF-EPS-001 couponNo 로 쓸 수 없으므로 제외
    return { ok: true, rows: rows.map(toCouponRow).filter((c) => c.couponNo !== '') }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}
