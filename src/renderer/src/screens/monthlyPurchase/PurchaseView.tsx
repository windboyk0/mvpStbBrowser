import { useCallback, useEffect, useState } from 'react'
import { buildAgreementOptions, won, type AgreementOption } from './agreementOptions'
import { paymentAmount } from './amount'
import CouponModal from './CouponModal'
import type { AgreementsResult, Coupon, CouponListResult, Product, PurchaseResult } from './types'
import styles from './MonthlyPurchase.module.css'

type AgreementState =
  | { status: 'loading' }
  | { status: 'done'; options: AgreementOption[] }
  | { status: 'error'; error: string }

// R5 쿠폰 조회 상태 — 조회 전 · 조회 중은 비활성(0원)
type CouponState =
  { status: 'loading' } | { status: 'done'; coupons: Coupon[] } | { status: 'error'; error: string }

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
// R2.4 — 쿠폰은 2차(R5)에서 활성, T멤버십은 계속 비활성
const DISABLED_DISCOUNT_METHODS = ['T멤버십']

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
  const [coupons, setCoupons] = useState<CouponState>({ status: 'loading' })
  const [applied, setApplied] = useState<Coupon | null>(null)
  const [couponModal, setCouponModal] = useState(false)

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
  const { price, discount, total } = paymentAmount(option?.price ?? 0, applied)

  // R5.1 · Q8 — [C] 진입(첫 약정) 및 약정 변경 시 쿠폰 (재)조회
  const hasOption = option !== undefined
  const optionAgmtId = option?.prdAgmtId ?? null
  const optionPrice = option?.price ?? 0
  useEffect(() => {
    if (!hasOption) return
    let alive = true
    window.api
      .invoke<CouponListResult>('monthlyPurchase:couponList', {
        idProduct: product.idProduct,
        prdAgmtId: optionAgmtId,
        amtPrice: optionPrice
      })
      .catch((err): CouponListResult => ({
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      }))
      .then((result) => {
        if (!alive) return
        setApplied(null)
        setCoupons(
          result.ok
            ? { status: 'done', coupons: result.rows }
            : { status: 'error', error: result.error }
        )
      })
    return () => {
      alive = false
    }
    // selected: 약정 옵션이 바뀌면 (약정 ID · 가격이 같아도) 재조회
  }, [product, selected, hasOption, optionAgmtId, optionPrice])

  // Q8 — 약정 변경 시 적용 중인 쿠폰 해제 + 재조회 대기
  const selectAgreement = (i: number): void => {
    if (i === selected) return
    setSelected(i)
    setApplied(null)
    setCoupons({ status: 'loading' })
  }

  const couponEnabled = coupons.status === 'done' && coupons.coupons.length > 0
  // R5.5 — 미적용: 선택 팝업 열기 / 적용: 체크 해제
  const clickCoupon = (): void => {
    if (!couponEnabled) return
    if (applied) setApplied(null)
    else setCouponModal(true)
  }
  const closeCouponModal = useCallback(() => setCouponModal(false), [])

  const pay = async (): Promise<void> => {
    if (!option || purchasing) return
    setPurchasing(true)
    let result: PurchaseResult
    try {
      result = await window.api.invoke<PurchaseResult>('monthlyPurchase:purchase', {
        prdPrcId: product.idProduct,
        prdAgmtId: option.prdAgmtId,
        couponNo: applied?.noCoupon ?? null
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
                onClick={() => selectAgreement(i)}
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
          <div
            role="checkbox"
            aria-checked={applied !== null}
            aria-disabled={!couponEnabled}
            className={`${styles.optRow} ${applied ? styles.optSel : ''} ${
              couponEnabled ? '' : styles.optDis
            }`}
            onClick={clickCoupon}
          >
            <span className={styles.check}>{applied ? '✓' : couponEnabled ? '' : '✕'}</span>
            <span className={styles.optName}>쿠폰</span>
            {applied && <span className={styles.optDesc}>{applied.nmCoupon}</span>}
            {coupons.status === 'error' && (
              <span className={`${styles.optDesc} ${styles.danger}`}>
                조회에 실패했습니다. ({coupons.error})
              </span>
            )}
            <span className={styles.optAmt}>{applied ? `-${won(discount)}` : won(0)}</span>
          </div>
          {DISABLED_DISCOUNT_METHODS.map((m) => (
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
              할인 금액<b>{discount > 0 ? `-${won(discount)}` : won(0)}</b>
            </div>
            <div className={styles.sumLine}>
              부가세<b>포함</b>
            </div>
            <div className={`${styles.sumLine} ${styles.sumTotal}`}>
              구매 금액<b>{won(total)}</b>
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
          {won(total)} 결제
        </button>
      </div>

      {couponModal && coupons.status === 'done' && (
        <CouponModal
          coupons={coupons.coupons}
          appliedNo={applied?.noCoupon ?? null}
          onSelect={(c) => {
            setApplied(c)
            setCouponModal(false)
          }}
          onClose={closeCouponModal}
        />
      )}
    </div>
  )
}
