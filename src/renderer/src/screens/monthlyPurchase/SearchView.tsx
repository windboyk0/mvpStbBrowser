import { useCallback, useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { pageWindow, won } from './agreementOptions'
import {
  PAGE_SIZE,
  PRODUCT_TYPE_OPTIONS,
  type Product,
  type ProductType,
  type SearchQuery,
  type SearchResult
} from './types'
import styles from './MonthlyPurchase.module.css'

type ListState =
  | { status: 'loading' }
  | { status: 'done'; rows: Product[]; total: number }
  | { status: 'error'; error: string }

interface SearchViewProps {
  /** 직전 조회조건 · 페이지 — 진입(복귀) 시 이 조건으로 자동 조회 */
  query: SearchQuery
  onQueryChange: (query: SearchQuery) => void
  onPurchase: (product: Product) => void
}

// [A] 상품 조회 — R1
export default function SearchView({
  query,
  onQueryChange,
  onPurchase
}: SearchViewProps): React.JSX.Element {
  const [type, setType] = useState<ProductType>(query.type)
  const [prdNm, setPrdNm] = useState(query.prdNm)
  const [list, setList] = useState<ListState>({ status: 'loading' })
  const [confirm, setConfirm] = useState<Product | null>(null)
  const requestSeq = useRef(0)

  const run = useCallback(
    async (next: SearchQuery) => {
      onQueryChange(next)
      const seq = ++requestSeq.current
      setList({ status: 'loading' })
      let result: SearchResult
      try {
        result = await window.api.invoke<SearchResult>('monthlyPurchase:search', next)
      } catch (err) {
        result = { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
      if (seq !== requestSeq.current) return
      setList(
        result.ok
          ? { status: 'done', rows: result.rows, total: result.total }
          : { status: 'error', error: result.error }
      )
    },
    [onQueryChange]
  )

  // R1.4 · 2. 공통 동작 — 진입 시 자동 조회 (직전 조건 · 페이지)
  const initialQuery = useRef(query)
  useEffect(() => {
    void run(initialQuery.current)
  }, [run])

  const search = (): void => {
    void run({ type, prdNm: prdNm.trim(), page: 1 })
  }

  const goPage = (page: number): void => {
    void run({ ...query, page })
  }

  const closeConfirm = useCallback(() => setConfirm(null), [])

  const totalPages = list.status === 'done' ? Math.ceil(list.total / PAGE_SIZE) : 0

  return (
    <>
      <div className={styles.search}>
        <label className={styles.searchLabel} htmlFor="mp-type">
          상품유형
        </label>
        <select
          id="mp-type"
          className={styles.select}
          value={type}
          onChange={(e) => setType(e.target.value as ProductType)}
        >
          {PRODUCT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className={styles.searchLabel} htmlFor="mp-name">
          상품명
        </label>
        <input
          id="mp-name"
          className={styles.input}
          value={prdNm}
          placeholder="상품명 입력 (비우면 전체)"
          onChange={(e) => setPrdNm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
          }}
        />
        <button type="button" className={styles.searchBtn} onClick={search}>
          검색
        </button>
      </div>

      <p className={styles.count}>{list.status === 'done' ? `총 ${list.total}건` : ' '}</p>

      <table className={styles.table}>
        <colgroup>
          <col style={{ width: 70 }} />
          <col style={{ width: 130 }} />
          <col />
          <col style={{ width: 100 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 80 }} />
        </colgroup>
        <thead>
          <tr>
            <th>구분</th>
            <th>상품ID</th>
            <th>상품명</th>
            <th>패키지ID</th>
            <th>상위상품ID</th>
            <th>PPM유형</th>
            <th className={styles.right}>가격</th>
            <th>무료가입기간</th>
            <th>약정필수</th>
          </tr>
        </thead>
        <tbody>
          {list.status === 'error' ? (
            <tr>
              <td colSpan={9} className={`${styles.tableMessage} ${styles.danger}`}>
                조회에 실패했습니다. ({list.error})
              </td>
            </tr>
          ) : list.status === 'done' && list.rows.length === 0 ? (
            <tr>
              <td colSpan={9} className={styles.tableMessage}>
                조회된 상품이 없습니다
              </td>
            </tr>
          ) : list.status === 'done' ? (
            list.rows.map((r) => (
              <tr
                key={`${r.gubun}-${r.idProduct}`}
                className={styles.clickRow}
                onClick={() => setConfirm(r)}
              >
                <td className={styles.small}>{r.gubun}</td>
                <td className={styles.small}>{r.idProduct}</td>
                <td title={r.nmProduct}>{r.nmProduct}</td>
                <td className={styles.small}>{r.idPackage}</td>
                <td className={styles.small}>{r.idProductPar}</td>
                <td className={styles.small}>{r.tpPpm}</td>
                <td className={styles.right}>{won(Number(r.amtPrice) || 0)}</td>
                <td className={styles.small}>{r.ppmFreeJoinPerdCd}</td>
                <td className={styles.small}>{r.agmtMndtYn}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className={styles.tableMessage} />
            </tr>
          )}
        </tbody>
      </table>

      {list.status === 'done' && totalPages > 0 && (
        <div className={styles.pager}>
          <button
            type="button"
            disabled={query.page <= 1}
            onClick={() => goPage(query.page - 1)}
            aria-label="이전"
          >
            ‹
          </button>
          {pageWindow(query.page, totalPages).map((p) => (
            <button
              type="button"
              key={p}
              className={p === query.page ? styles.pageOn : undefined}
              onClick={() => goPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={query.page >= totalPages}
            onClick={() => goPage(query.page + 1)}
            aria-label="다음"
          >
            ›
          </button>
        </div>
      )}

      {confirm && (
        <Modal
          onDismiss={closeConfirm}
          actions={
            <>
              <button type="button" className={styles.modalBtn} onClick={closeConfirm}>
                취소
              </button>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.primary}`}
                onClick={() => {
                  const product = confirm
                  setConfirm(null)
                  onPurchase(product)
                }}
              >
                확인
              </button>
            </>
          }
        >
          [{confirm.nmProduct}] 을 구매하겠습니까?
        </Modal>
      )}
    </>
  )
}
