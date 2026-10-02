// 금액 계산 — spec 4. 설계 › 금액 계산
// 상품 금액 = 판매가(부가세 미포함 공급가), 부가세 = 상품 금액의 10%
// 1차: 할인 없음 / B캐시 전액 두 경우만 (부분 · 복수 할인은 추후)
// 2차: 쿠폰 할인 (4. 설계 › 금액 계산 › 쿠폰 적용 시, 1.3 쿠폰 잠정값 Q23)

export interface Amount {
  /** 상품 금액 */
  base: number
  /** 할인 금액 (공급가 기준, 양수) */
  discount: number
  /** 부가세 */
  vat: number
  /** 구매 금액 */
  total: number
  /** B캐시 차감 포인트 (부가세 포함) */
  bcashPoint: number
}

export function vatOf(price: number): number {
  return Math.round(price * 0.1)
}

/** 부가세 포함 금액 (Step 1 표시 가격) */
export function withVat(price: number): number {
  return price + vatOf(price)
}

export function calcAmount(salePrice: number, useBcash: boolean): Amount {
  const base = salePrice
  if (useBcash) {
    return { base, discount: base, vat: 0, total: 0, bcashPoint: withVat(base) }
  }
  const vat = vatOf(base)
  return { base, discount: 0, vat, total: base + vat, bcashPoint: 0 }
}

/** 쿠폰 적용 할인 금액 — AMT_DISCOUNT(공급가 기준), 상품 금액을 넘으면 상품 금액까지만 */
export function couponDiscountOf(salePrice: number, amtDiscount: number): number {
  return Math.min(Math.max(Math.round(amtDiscount), 0), salePrice)
}

/** 쿠폰 적용 — 부가세 = (상품 금액 − 할인 금액) × 10%, 구매 금액 = 상품 금액 − 할인 금액 + 부가세 */
export function calcCouponAmount(salePrice: number, amtDiscount: number): Amount {
  const base = salePrice
  const discount = couponDiscountOf(base, amtDiscount)
  const vat = vatOf(base - discount)
  return { base, discount, vat, total: base - discount + vat, bcashPoint: 0 }
}
