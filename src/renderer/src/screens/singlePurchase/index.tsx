import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from './components'
import DoneView from './DoneView'
import SearchView, { type SearchFilter, type SearchState } from './SearchView'
import Step1View from './Step1View'
import Step2View, { type CouponState } from './Step2View'
import type {
  CheckSettingsResult,
  CouponListRequest,
  CouponListResult,
  CouponRow,
  ProductRow,
  PurchaseRequest,
  PurchaseResult,
  SearchRequest,
  SearchResult
} from './types'

// 단건구매 화면 진입점 — vibeContext/spec/020_singlePurchase/design/singlePurchase_spec.md
// 흐름: [A] 상품 조회 → [B] Step 1 → [C] Step 2 → [D] 구매완료

type Route = 'A' | 'B' | 'C' | 'D'

function navigate(key: 'main' | 'settings'): void {
  window.dispatchEvent(new CustomEvent('app:navigate', { detail: { key } }))
}

export default function SinglePurchaseScreen(): React.JSX.Element {
  const [needSettings, setNeedSettings] = useState(false)
  const [route, setRoute] = useState<Route>('A')

  // [A] 적용된 조회조건 · 페이지 — 복귀 시 유지 (2. 공통 동작)
  const [filter, setFilter] = useState<SearchFilter>({ prdTypCd: '', prdNm: '' })
  const [page, setPage] = useState(1)
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' })
  const [searchKey, setSearchKey] = useState(0)
  const searchSeq = useRef(0)

  const [confirmTarget, setConfirmTarget] = useState<ProductRow | null>(null)
  const [product, setProduct] = useState<ProductRow | null>(null)
  const [useBcash, setUseBcash] = useState(false)
  const [couponState, setCouponState] = useState<CouponState>({ status: 'loading' })
  const [coupon, setCoupon] = useState<CouponRow | null>(null)
  const couponSeq = useRef(0)
  const [paying, setPaying] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null)

  // R0 진입 조건
  useEffect(() => {
    let alive = true
    window.api
      .invoke<CheckSettingsResult>('singlePurchase:checkSettings')
      .then((r) => alive && setNeedSettings(!r.ok))
      .catch(() => alive && setNeedSettings(true))
    return () => {
      alive = false
    }
  }, [])

  const runSearch = useCallback((next: SearchFilter, nextPage: number) => {
    const seq = ++searchSeq.current
    setFilter(next)
    setPage(nextPage)
    setSearchState((prev) => ({
      status: 'loading',
      last: prev.status === 'done' ? prev.result : prev.status === 'loading' ? prev.last : undefined
    }))
    const req: SearchRequest = {
      prdTypCd: next.prdTypCd || null,
      prdNm: next.prdNm || null,
      page: nextPage
    }
    window.api
      .invoke<SearchResult>('singlePurchase:search', req)
      .catch((err: unknown): SearchResult => ({
        ok: false,
        message: err instanceof Error ? err.message : String(err)
      }))
      .then((result) => {
        if (seq === searchSeq.current) setSearchState({ status: 'done', result })
      })
  }, [])

  // [구매취소] / [구매 계속하기] — 조회조건 · 페이지 유지 + 자동 조회
  const backToSearch = (): void => {
    setRoute('A')
    setSearchKey((k) => k + 1)
    runSearch(filter, page)
  }

  const confirmPick = (): void => {
    if (!confirmTarget) return
    setProduct(confirmTarget)
    setUseBcash(false)
    setCoupon(null)
    setPurchaseResult(null)
    setConfirmTarget(null)
    setRoute('B')
  }

  const pay = (): void => {
    if (!product || paying) return
    setPaying(true)
    const req: PurchaseRequest = {
      prdPrcId: product.prdPrcId,
      useBcash,
      couponNo: coupon?.couponNo ?? null
    }
    window.api
      .invoke<PurchaseResult>('singlePurchase:purchase', req)
      .catch((): PurchaseResult => ({ ok: false, message: '구매 요청에 실패했습니다.' }))
      .then((result) => {
        setPurchaseResult(result)
        setPaying(false)
        setRoute('D')
      })
  }

  // R6.1 Step 2 진입 시 사용가능 쿠폰 조회 — 적용 중 쿠폰은 새 결과에 있으면 유지
  const enterStep2 = (): void => {
    if (!product) return
    const seq = ++couponSeq.current
    setRoute('C')
    setCouponState({ status: 'loading' })
    const req: CouponListRequest = { prdPrcId: product.prdPrcId, salePrc: product.salePrc }
    window.api
      .invoke<CouponListResult>('singlePurchase:couponList', req)
      .catch((err: unknown): CouponListResult => ({
        ok: false,
        message: err instanceof Error ? err.message : String(err)
      }))
      .then((result) => {
        if (seq !== couponSeq.current) return
        setCouponState({ status: 'done', result })
        setCoupon((prev) =>
          prev && result.ok ? (result.rows.find((c) => c.couponNo === prev.couponNo) ?? null) : null
        )
      })
  }

  const closeConfirm = useCallback(() => setConfirmTarget(null), [])

  let view: React.JSX.Element
  if (route === 'B' && product) {
    view = <Step1View product={product} onCancel={backToSearch} onNext={enterStep2} />
  } else if (route === 'C' && product) {
    view = (
      <Step2View
        product={product}
        useBcash={useBcash}
        couponState={couponState}
        coupon={coupon}
        paying={paying}
        onToggleBcash={() => setUseBcash((v) => !v)}
        onCouponChange={setCoupon}
        onPrev={() => setRoute('B')}
        onCancel={backToSearch}
        onPay={pay}
      />
    )
  } else if (route === 'D' && purchaseResult) {
    view = (
      <DoneView result={purchaseResult} onHome={() => navigate('main')} onContinue={backToSearch} />
    )
  } else {
    view = (
      <SearchView
        key={searchKey}
        filter={filter}
        page={page}
        state={searchState}
        onSearch={runSearch}
        onPick={setConfirmTarget}
      />
    )
  }

  return (
    <>
      {view}
      {confirmTarget && (
        <Modal
          message={`[${confirmTarget.prdNm}] 을 구매하겠습니까?`}
          cancelLabel="취소"
          okLabel="확인"
          onCancel={closeConfirm}
          onOk={confirmPick}
          dismissible
        />
      )}
      {needSettings && (
        <Modal
          message="설정을 먼저 입력해 주세요."
          cancelLabel="취소"
          okLabel="설정으로"
          onCancel={() => navigate('main')}
          onOk={() => navigate('settings')}
        />
      )}
    </>
  )
}
