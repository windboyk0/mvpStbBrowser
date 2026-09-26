import type { Agreement, PrdAgmtId } from './types'

export interface AgreementOption {
  label: string
  price: number
  prdAgmtId: PrdAgmtId
}

/**
 * R2.2 약정 선택 옵션
 * - 약정필수 N: 무약정(조회 없이 생성, 가격 = 목록 AMT_PRICE, prdAgmtId null) 을 맨 앞에
 * - 약정기간: 개월 수 오름차순, `{N}개월`, 가격 AMT_SALE
 */
export function buildAgreementOptions(
  amtPrice: string | number,
  agmtMndtYn: string,
  agreements: Agreement[]
): AgreementOption[] {
  const options: AgreementOption[] = []
  if (agmtMndtYn !== 'Y') {
    options.push({ label: '무약정', price: toNumber(amtPrice), prdAgmtId: null })
  }
  const sorted = [...agreements].sort((a, b) => a.months - b.months)
  for (const a of sorted) {
    options.push({ label: `${a.months}개월`, price: toNumber(a.amtSale), prdAgmtId: a.prdAgmtId })
  }
  return options
}

function toNumber(v: string | number): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** 금액 표시 — 천 단위 콤마 + 원 */
export function won(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

/** 페이지 번호 목록 — 현재 페이지 중심 최대 `size` 개 */
export function pageWindow(page: number, totalPages: number, size = 5): number[] {
  if (totalPages <= 0) return []
  const half = Math.floor(size / 2)
  let start = Math.max(1, page - half)
  const end = Math.min(totalPages, start + size - 1)
  start = Math.max(1, end - size + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
