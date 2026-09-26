import { describe, expect, it } from 'vitest'
import { MENUS } from './menus'

describe('MENUS', () => {
  it('R1.3 메뉴 11개를 정해진 순서로 가진다', () => {
    expect(MENUS.map((m) => m.label)).toEqual([
      '단건구매',
      '월정액구매',
      '쿠폰함',
      'B 캐시',
      '나의 이용권',
      '구매내역',
      '나의 요금상품',
      'TV 포인트',
      'T 멤버십',
      'OK캐쉬백',
      '설정'
    ])
  })

  it('R1.4 공지/이용안내 메뉴는 없다', () => {
    expect(MENUS.some((m) => m.label.includes('공지'))).toBe(false)
  })

  it('R2.2 신규 배지는 단건구매·월정액구매에만 있다', () => {
    expect(MENUS.filter((m) => m.isNew).map((m) => m.key)).toEqual([
      'singlePurchase',
      'monthlyPurchase'
    ])
  })

  it('key는 중복되지 않는다', () => {
    expect(new Set(MENUS.map((m) => m.key)).size).toBe(MENUS.length)
  })
})
