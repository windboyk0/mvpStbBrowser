import type { PrdTypCd } from './types'

// 상품유형 코드 ↔ 표시명 — R1.3
export const PRD_TYP_LABELS: Record<PrdTypCd, string> = {
  '10': 'VOD PPV',
  '20': 'VOD PPS',
  '41': 'VOD PPP',
  '42': 'VOD Commerce'
}

export function prdTypLabel(code: string): string {
  return PRD_TYP_LABELS[code as PrdTypCd] ?? code
}

export function won(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

export function cx(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
