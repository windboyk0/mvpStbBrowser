import type { Coupon } from './types'

export interface PaymentAmount {
  /** 상품 금액 — 선택 약정 옵션 가격 (부가세 포함) */
  price: number
  /** 할인 금액 — 쿠폰 AMT_DISCOUNT, 상품 금액까지만 */
  discount: number
  /** 구매 금액 = 상품 금액 − 할인 금액 */
  total: number
}

/** R2.5 · R5.7 결제 금액 (1.3 쿠폰 잠정값 Q10) */
export function paymentAmount(price: number, coupon: Coupon | null): PaymentAmount {
  const amt = coupon ? coupon.amtDiscount : 0
  const discount = Math.min(Math.max(Number.isFinite(amt) ? amt : 0, 0), Math.max(price, 0))
  return { price, discount, total: price - discount }
}
