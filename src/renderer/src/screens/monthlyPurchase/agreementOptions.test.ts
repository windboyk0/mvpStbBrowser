import { describe, expect, it } from 'vitest'
import { buildAgreementOptions, pageWindow, won } from './agreementOptions'

describe('buildAgreementOptions (R2.2)', () => {
  const agreements = [
    { prdAgmtId: 'A24', months: 24, amtSale: 7900 },
    { prdAgmtId: 'A12', months: 12, amtSale: 8900 }
  ]

  it('약정필수 N: 무약정(목록 가격, prdAgmtId null) → 개월 수 오름차순', () => {
    expect(buildAgreementOptions('9900', 'N', agreements)).toEqual([
      { label: '무약정', price: 9900, prdAgmtId: null },
      { label: '12개월', price: 8900, prdAgmtId: 'A12' },
      { label: '24개월', price: 7900, prdAgmtId: 'A24' }
    ])
  })

  it('약정필수 Y: 무약정 없음', () => {
    const options = buildAgreementOptions('9900', 'Y', agreements)
    expect(options.map((o) => o.label)).toEqual(['12개월', '24개월'])
  })

  it('약정필수 Y + 약정 0건: 옵션 없음', () => {
    expect(buildAgreementOptions('9900', 'Y', [])).toEqual([])
  })

  it('약정필수 N + 약정 0건: 무약정만', () => {
    expect(buildAgreementOptions('5500', 'N', [])).toEqual([
      { label: '무약정', price: 5500, prdAgmtId: null }
    ])
  })

  it('원본 배열을 변경하지 않는다', () => {
    const copy = [...agreements]
    buildAgreementOptions('9900', 'N', agreements)
    expect(agreements).toEqual(copy)
  })
})

describe('won', () => {
  it('천 단위 콤마 + 원', () => {
    expect(won(9900)).toBe('9,900원')
    expect(won(0)).toBe('0원')
  })
})

describe('pageWindow', () => {
  it('페이지 수가 적으면 전부', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
  })
  it('현재 페이지 중심 5개', () => {
    expect(pageWindow(6, 20)).toEqual([4, 5, 6, 7, 8])
  })
  it('끝에서는 마지막 5개', () => {
    expect(pageWindow(20, 20)).toEqual([16, 17, 18, 19, 20])
  })
  it('0페이지면 빈 배열', () => {
    expect(pageWindow(1, 0)).toEqual([])
  })
})
