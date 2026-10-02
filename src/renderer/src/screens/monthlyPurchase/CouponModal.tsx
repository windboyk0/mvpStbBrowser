import { useEffect } from 'react'
import { won } from './agreementOptions'
import type { Coupon } from './types'
import styles from './MonthlyPurchase.module.css'

interface CouponModalProps {
  coupons: Coupon[]
  /** 적용 중인 쿠폰 NO_COUPON (텍스트 `focus`) */
  appliedNo: string | null
  onSelect: (coupon: Coupon) => void
  /** Esc · 배경 클릭 · [취소] — 선택 없이 닫기 */
  onClose: () => void
}

// 4. 설계 › 쿠폰 선택 팝업 (1.3 쿠폰 잠정값 Q12)
export default function CouponModal({
  coupons,
  appliedNo,
  onSelect,
  onClose
}: CouponModalProps): React.JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={styles.modalBg}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`${styles.modal} ${styles.couponModal}`} role="dialog" aria-modal="true">
        <h3 className={styles.couponTitle}>쿠폰 선택</h3>
        <div className={styles.couponList}>
          {coupons.map((c, i) => (
            <div
              key={`${c.noCoupon}-${i}`}
              role="option"
              aria-selected={c.noCoupon === appliedNo}
              className={`${styles.couponRow} ${c.noCoupon === appliedNo ? styles.couponOn : ''}`}
              onClick={() => onSelect(c)}
            >
              <span className={styles.couponName}>{c.nmCoupon}</span>
              <span className={styles.couponDate}>~{c.ddApplyEnd}</span>
              <span className={styles.couponAmt}>-{won(c.amtDiscount)}</span>
            </div>
          ))}
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.modalBtn} onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
