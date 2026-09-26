import { describe, expect, it } from 'vitest'
import { calcAmount, withVat } from './amount'

// 참고 화면 케이스 — spec 4. 설계 › 금액 계산
describe('단건구매 금액 계산', () => {
  it('할인 없음 (Step2.png)', () => {
    expect(calcAmount(6500, false)).toEqual({
      base: 6500,
      discount: 0,
      vat: 650,
      total: 7150,
      bcashPoint: 0
    })
  })

  it('B캐시 전액 (Step2_B캐시상계.png)', () => {
    expect(calcAmount(6500, true)).toEqual({
      base: 6500,
      discount: 6500,
      vat: 0,
      total: 0,
      bcashPoint: 7150
    })
  })

  it('Step 1 표시 가격 = 판매가 + 부가세', () => {
    expect(withVat(6500)).toBe(7150)
    expect(withVat(10000)).toBe(11000)
  })
})
