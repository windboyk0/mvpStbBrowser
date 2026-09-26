import { useEffect, useState } from 'react'
import Modal from './Modal'
import SearchView from './SearchView'
import PurchaseView from './PurchaseView'
import CompleteView from './CompleteView'
import type { Product, PurchaseResult, SearchQuery } from './types'
import styles from './MonthlyPurchase.module.css'

type View =
  | { name: 'search' }
  | { name: 'purchase'; product: Product }
  | { name: 'complete'; success: boolean; message: string }

const INITIAL_QUERY: SearchQuery = { type: 'ALL', prdNm: '', page: 1 }

function navigate(key: string): void {
  window.dispatchEvent(new CustomEvent('app:navigate', { detail: { key } }))
}

/** R4.1 · R4.2 — 구매 결과 → [D] 표시 */
function toComplete(result: PurchaseResult): { success: boolean; message: string } {
  if (result.kind === 'error') return { success: false, message: result.message }
  if (result.result === '0000') return { success: true, message: '구매가 완료되었습니다.' }
  const reason = result.reason.replace(/\\n/g, '\n')
  return { success: false, message: reason || '구매 요청에 실패했습니다.' }
}

// 월정액구매 (spec 030_monthlyPurchase)
export default function MonthlyPurchaseScreen(): React.JSX.Element {
  // null = 확인 중
  const [settingsOk, setSettingsOk] = useState<boolean | null>(null)
  const [view, setView] = useState<View>({ name: 'search' })
  // 2. 공통 동작 — 직전 조회조건 · 페이지 (이 화면 내부 상태)
  const [query, setQuery] = useState<SearchQuery>(INITIAL_QUERY)

  // R0 진입 조건
  useEffect(() => {
    let alive = true
    window.api
      .invoke<{ ok: boolean }>('monthlyPurchase:checkSettings')
      .then((r) => alive && setSettingsOk(!!r?.ok))
      .catch(() => alive && setSettingsOk(false))
    return () => {
      alive = false
    }
  }, [])

  const backToSearch = (): void => setView({ name: 'search' })

  if (settingsOk === null) return <></>

  if (!settingsOk) {
    return (
      <Modal
        actions={
          <>
            <button type="button" className={styles.modalBtn} onClick={() => navigate('main')}>
              취소
            </button>
            <button
              type="button"
              className={`${styles.modalBtn} ${styles.primary}`}
              onClick={() => navigate('settings')}
            >
              설정으로
            </button>
          </>
        }
      >
        설정을 먼저 입력해 주세요.
      </Modal>
    )
  }

  if (view.name === 'purchase') {
    return (
      <PurchaseView
        product={view.product}
        onCancel={backToSearch}
        onComplete={(result) => setView({ name: 'complete', ...toComplete(result) })}
      />
    )
  }

  if (view.name === 'complete') {
    return (
      <CompleteView
        success={view.success}
        message={view.message}
        onHome={() => navigate('main')}
        onContinue={backToSearch}
      />
    )
  }

  return (
    <SearchView
      query={query}
      onQueryChange={setQuery}
      onPurchase={(product) => setView({ name: 'purchase', product })}
    />
  )
}
