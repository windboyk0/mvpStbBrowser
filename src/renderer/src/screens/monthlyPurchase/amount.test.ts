import { describe, expect, it } from 'vitest'
import { paymentAmount } from './amount'
import type { Coupon } from './types'

const coupon = (amtDiscount: number): Coupon => ({
  noCoupon: 'C001',
  nmCoupon: '테스트 쿠폰',
  ddApplyEnd: '20261231',
  amtDiscount
})

describe('paymentAmount (R5.7)', () => {
  it('쿠폰 미적용: 할인 0원, 구매 금액 = 상품 금액', () => {
    expect(paymentAmount(9900, null)).toEqual({ price: 9900, discount: 0, total: 9900 })
  })

  it('쿠폰 적용: 구매 금액 = 상품 금액 − AMT_DISCOUNT', () => {
    expect(paymentAmount(9900, coupon(3000))).toEqual({ price: 9900, discount: 3000, total: 6900 })
  })

  it('할인 금액이 상품 금액보다 크면 상품 금액까지만 (Q10)', () => {
    expect(paymentAmount(9900, coupon(15000))).toEqual({ price: 9900, discount: 9900, total: 0 })
  })

  it('음수 할인은 0원', () => {
    expect(paymentAmount(9900, coupon(-100))).toEqual({ price: 9900, discount: 0, total: 9900 })
  })
})
