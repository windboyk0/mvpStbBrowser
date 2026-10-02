import type { Row } from './db'

// R5.3 사용가능 쿠폰 결과 필드 → IPC 형식 (1.3 쿠폰 잠정값 Q9 · Q10)
export interface Coupon {
  /** NO_COUPON → IF-EPS-001 couponNo */
  noCoupon: string
  /** NM_COUPON — 화면 쿠폰명 */
  nmCoupon: string
  /** DD_APPLY_END — 유효기간 */
  ddApplyEnd: string
  /** AMT_DISCOUNT — 부가세 포함 할인액 */
  amtDiscount: number
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** DATE 로 오면 YYYYMMDD (로컬), 문자열은 그대로 */
function dateText(v: unknown): string {
  if (v instanceof Date) return `${v.getFullYear()}${pad(v.getMonth() + 1)}${pad(v.getDate())}`
  return v === null || v === undefined ? '' : String(v)
}

export function toCoupon(row: Row): Coupon {
  const amt = Number(row.AMT_DISCOUNT)
  return {
    noCoupon: row.NO_COUPON == null ? '' : String(row.NO_COUPON),
    nmCoupon: row.NM_COUPON == null ? '' : String(row.NM_COUPON),
    ddApplyEnd: dateText(row.DD_APPLY_END),
    amtDiscount: Number.isFinite(amt) ? amt : 0
  }
}
