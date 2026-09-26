import { useEffect, useState } from 'react'
import { buildAgreementOptions, won, type AgreementOption } from './agreementOptions'
import type { AgreementsResult, Product, PurchaseResult } from './types'
import styles from './MonthlyPurchase.module.css'

type AgreementState =
  | { status: 'loading' }
  | { status: 'done'; options: AgreementOption[] }
  | { status: 'error'; error: string }

// R2.3 — 1차는 청구서만 활성
const PAYMENT_METHODS = [
  '청구서',
  '신용카드',
  '휴대폰',
  '카카오페이',
  '네이버페이',
  'PAYCO',
  'SK pay'
]
// R2.4 — 1차는 2개 모두 비활성
const DISCOUNT_METHODS = ['쿠폰', 'T멤버십']

interface PurchaseViewProps {
  product: Product
  onCancel: () => void
  onComplete: (result: PurchaseResult) => void
}

// [C] 약정 · 결제 · 할인 — R2
export default function PurchaseView({
  product,
  onCancel,
  onComplete
}: PurchaseViewProps): React.JSX.Element {
  const [agreements, setAgreements] = useState<AgreementState>({ status: 'loading' })
  const [selected, setSelected] = useState(0)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    let alive = true
    window.api
      .invoke<AgreementsResult>('monthlyPurchase:agreements', { prdPrcId: product.idProduct })
      .catch((err): AgreementsResult => ({
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      }))
      .then((result) => {
        if (!alive) return
        setSelected(0)
        setAgreements(
          result.ok
            ? {
                status: 'done',
                options: buildAgreementOptions(product.amtPrice, product.agmtMndtYn, result.rows)
              }
            : { status: 'error', error: result.error }
        )
      })
    return () => {
      alive = false
    }
  }, [product])

  const option = agreements.status === 'done' ? agreements.options[selected] : undefined
  const price = option?.price ?? 0
  const discount = 0

  const pay = async (): Promise<void> => {
    if (!option || purchasing) return
    setPurchasing(true)
    let result: PurchaseResult
    try {
      result = await window.api.invoke<PurchaseResult>('monthlyPurchase:purchase', {
        prdPrcId: product.idProduct,
        prdAgmtId: option.prdAgmtId
      })
    } catch {
      result = { kind: 'error', message: '구매 요청에 실패했습니다.' }
    }
    onComplete(result)
  }

  return (
    <div className={styles.purchase}>
      <div className={styles.purchaseHead}>
        <h2>{product.nmProduct}</h2>
        <p>결제 및 할인 수단을 선택해 주세요.</p>
      </div>

      <div className={styles.cols}>
        <section>
          <h3 className={styles.colTitle}>약정 선택</h3>
          {agreements.status === 'error' && (
            <p className={`${styles.colMessage} ${styles.danger}`}>
              조회에 실패했습니다. ({agreements.error})
            </p>
          )}
          {agreements.status === 'done' && agreements.options.length === 0 && (
            <p className={styles.colMessage}>선택 가능한 약정이 없습니다</p>
          )}
          {agreements.status === 'done' &&
            agreements.options.map((o, i) => (
              <div
                key={`${o.label}-${String(o.prdAgmtId)}`}
                role="radio"
                aria-checked={i === selected}
                className={`${styles.optRow} ${i === selected ? styles.optSel : ''}`}
                onClick={() => setSelected(i)}
              >
                <span className={styles.radio} />
                <span className={styles.optName}>{o.label}</span>
                <span className={styles.optAmt}>{won(o.price)}</span>
              </div>
            ))}
        </section>

        <section>
          <h3 className={styles.colTitle}>결제 수단</h3>
          {PAYMENT_METHODS.map((m, i) => (
            <div
              key={m}
              role="radio"
              aria-checked={i === 0}
              aria-disabled={i !== 0}
              className={`${styles.optRow} ${i === 0 ? styles.optSel : styles.optDis}`}
            >
              <span className={styles.radio} />
              <span className={styles.optName}>{m}</span>
            </div>
          ))}
        </section>

        <section>
          <h3 className={styles.colTitle}>할인 수단</h3>
          {DISCOUNT_METHODS.map((m) => (
            <div
              key={m}
              role="checkbox"
              aria-checked={false}
              aria-disabled
              className={`${styles.optRow} ${styles.optDis}`}
            >
              <span className={styles.check}>✕</span>
              <span className={styles.optName}>{m}</span>
              <span className={styles.optAmt}>{won(0)}</span>
            </div>
          ))}
        </section>

        <section>
          <h3 className={styles.colTitle}>결제 금액</h3>
          <div className={styles.summary}>
            <div className={styles.sumLine}>
              상품 금액<b>{won(price)}</b>
            </div>
            <div className={styles.sumLine}>
              할인 금액<b>{won(discount)}</b>
            </div>
            <div className={styles.sumLine}>
              부가세<b>포함</b>
            </div>
            <div className={`${styles.sumLine} ${styles.sumTotal}`}>
              구매 금액<b>{won(price - discount)}</b>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.barInfo}>
          <div className={styles.barKey}>상품 선택 내역</div>
          <div className={styles.barValue}>
            {product.nmProduct}
            {option && (
              <>
                <span>|</span>
                {option.label}
              </>
            )}
          </div>
        </div>
        <button type="button" className={styles.btn} onClick={onCancel} disabled={purchasing}>
          구매취소
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          disabled={!option || purchasing}
          onClick={() => void pay()}
        >
          {won(price - discount)} 결제
        </button>
      </div>
    </div>
  )
}
