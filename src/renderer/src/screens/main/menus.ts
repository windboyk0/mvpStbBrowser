// 메인 메뉴 정의 — vibeContext/spec/010_main/design/main_spec.md › 메뉴 정의 데이터
// 순서 = 배열 순서

export type MenuKey =
  | 'singlePurchase'
  | 'monthlyPurchase'
  | 'coupon'
  | 'bCash'
  | 'monthlyPurchaseInfo'
  | 'singlePurchaseInfo'
  | 'plan'
  | 'tvPoint'
  | 'tMembership'
  | 'okCashbag'
  | 'settings'

export type MenuIcon =
  | 'shopping-cart'
  | 'calendar-repeat'
  | 'ticket'
  | 'coin'
  | 'id-badge-2'
  | 'receipt'
  | 'barcode'
  | 'device-tv'
  | 'letter-t'
  | 'cash'
  | 'settings'

export interface MenuItem {
  key: MenuKey
  label: string
  icon: MenuIcon
  isNew?: boolean
}

export const MENUS: readonly MenuItem[] = [
  { key: 'singlePurchase', label: '단건구매', icon: 'shopping-cart', isNew: true },
  { key: 'monthlyPurchase', label: '월정액구매', icon: 'calendar-repeat', isNew: true },
  { key: 'coupon', label: '쿠폰함', icon: 'ticket' },
  { key: 'bCash', label: 'B 캐시', icon: 'coin' },
  { key: 'monthlyPurchaseInfo', label: '나의 이용권', icon: 'id-badge-2' },
  { key: 'singlePurchaseInfo', label: '구매내역', icon: 'receipt' },
  { key: 'plan', label: '나의 요금상품', icon: 'barcode' },
  { key: 'tvPoint', label: 'TV 포인트', icon: 'device-tv' },
  { key: 'tMembership', label: 'T 멤버십', icon: 'letter-t' },
  { key: 'okCashbag', label: 'OK캐쉬백', icon: 'cash' },
  { key: 'settings', label: '설정', icon: 'settings' }
]

export function findMenu(key: MenuKey): MenuItem | undefined {
  return MENUS.find((m) => m.key === key)
}
