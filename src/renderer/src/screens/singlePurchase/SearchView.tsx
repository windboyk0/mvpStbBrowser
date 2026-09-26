import { useState } from 'react'
import { cx, PRD_TYP_LABELS, prdTypLabel, won } from './format'
import { PAGE_SIZE, type PrdTypCd, type ProductRow, type SearchResult } from './types'
import styles from './singlePurchase.module.css'

// [A] 상품 조회 — R1

export interface SearchFilter {
  /** '' = 전체 */
  prdTypCd: PrdTypCd | ''
  prdNm: string
}

/** 조회 상태 — idle: 최초 미조회 (R1.10) */
export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; last?: SearchResult }
  | { status: 'done'; result: SearchResult }

interface SearchViewProps {
  filter: SearchFilter
  page: number
  state: SearchState
  onSearch: (filter: SearchFilter, page: number) => void
  onPick: (row: ProductRow) => void
}

const PAGE_BLOCK = 10
const TYPE_OPTIONS = Object.entries(PRD_TYP_LABELS) as [PrdTypCd, string][]

export default function SearchView({
  filter,
  page,
  state,
  onSearch,
  onPick
}: SearchViewProps): React.JSX.Element {
  // 입력값 — 검색 시 적용 조건(filter)으로 반영. 복귀 시 적용 조건으로 초기화 (부모가 key 로 재생성)
  const [typ, setTyp] = useState<PrdTypCd | ''>(filter.prdTypCd)
  const [nm, setNm] = useState(filter.prdNm)

  const loading = state.status === 'loading'
  const result =
    state.status === 'done' ? state.result : state.status === 'loading' ? state.last : undefined
  const listed = result?.ok ? result : undefined
  const pages = listed ? Math.max(1, Math.ceil(listed.total / PAGE_SIZE)) : 1
  const blockStart = Math.floor((page - 1) / PAGE_BLOCK) * PAGE_BLOCK + 1
  const blockEnd = Math.min(pages, blockStart + PAGE_BLOCK - 1)

  const submit = (): void => {
    if (!loading) onSearch({ prdTypCd: typ, prdNm: nm.trim() }, 1)
  }
  const goPage = (p: number): void => {
    if (!loading && p >= 1 && p <= pages && p !== page) onSearch(filter, p)
  }

  let body: React.ReactNode
  if (!result) {
    body = (
      <tr>
        <td colSpan={6} className={styles.tableMessage}>
          {loading ? '조회 중…' : '[검색]을 눌러 상품을 조회하세요'}
        </td>
      </tr>
    )
  } else if (!result.ok) {
    body = (
      <tr>
        <td colSpan={6} className={cx(styles.tableMessage, styles.tableError)}>
          조회에 실패했습니다. ({result.message})
        </td>
      </tr>
    )
  } else if (result.rows.length === 0) {
    body = (
      <tr>
        <td colSpan={6} className={styles.tableMessage}>
          조회된 상품이 없습니다
        </td>
      </tr>
    )
  } else {
    body = result.rows.map((r) => (
      <tr key={r.prdPrcId} className={styles.clickRow} onClick={() => onPick(r)}>
        <td>{r.prdPrcId}</td>
        <td title={r.prdNm}>{r.prdNm}</td>
        <td className={styles.right}>{won(r.salePrc)}</td>
        <td>{prdTypLabel(r.prdTypCd)}</td>
        <td>{r.resolution}</td>
        <td>{r.viewPeriod}</td>
      </tr>
    ))
  }

  return (
    <>
      <div className={styles.search}>
        <label htmlFor="sp-typ">상품유형</label>
        <select id="sp-typ" value={typ} onChange={(e) => setTyp(e.target.value as PrdTypCd | '')}>
          <option value="">전체</option>
          {TYPE_OPTIONS.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="sp-nm">상품명</label>
        <input
          id="sp-nm"
          value={nm}
          placeholder="상품명 입력 (비우면 전체)"
          onChange={(e) => setNm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
          }}
        />
        <button type="button" className={styles.searchBtn} onClick={submit} disabled={loading}>
          검색
        </button>
      </div>

      <p className={cx(styles.count, !listed && styles.hidden)}>총 {listed?.total ?? 0}건</p>

      <table className={styles.table}>
        <colgroup>
          <col style={{ width: 150 }} />
          <col />
          <col style={{ width: 130 }} />
          <col style={{ width: 150 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 150 }} />
        </colgroup>
        <thead>
          <tr>
            <th>상품가격ID</th>
            <th>상품명</th>
            <th className={styles.right}>판매가</th>
            <th>상품유형</th>
            <th>해상도</th>
            <th>시청가능기간</th>
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>

      <div className={cx(styles.pager, !listed && styles.hidden)}>
        <button type="button" disabled={page <= 1 || loading} onClick={() => goPage(page - 1)}>
          ‹
        </button>
        {Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i).map((p) => (
          <button
            key={p}
            type="button"
            className={cx(p === page && styles.pageOn)}
            disabled={loading}
            onClick={() => goPage(p)}
          >
            {p}
          </button>
        ))}
        <button type="button" disabled={page >= pages || loading} onClick={() => goPage(page + 1)}>
          ›
        </button>
      </div>
    </>
  )
}
