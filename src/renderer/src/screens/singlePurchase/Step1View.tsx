import { withVat } from './amount'
import { OptionRow, PurchaseActionBar, PurchaseHeader, Radio, StepChips } from './components'
import { cx, prdTypLabel, won } from './format'
import type { ProductRow } from './types'
import styles from './singlePurchase.module.css'

// [B] Step 1 상품 유형 선택 — R2 (1차: 선택한 상품 1건을 기본 선택 상태로 표시)

interface Step1ViewProps {
  product: ProductRow
  onCancel: () => void
  onNext: () => void
}

export default function Step1View({
  product,
  onCancel,
  onNext
}: Step1ViewProps): React.JSX.Element {
  const typeName = prdTypLabel(product.prdTypCd)
  // 표시 가격 = 판매가 + 부가세
  const price = won(withVat(product.salePrc))

  return (
    <div className={styles.step}>
      <StepChips active={1} />
      <PurchaseHeader title={product.prdNm} guide="구매하실 상품 유형을 선택해 주세요." />

      <div className={cx(styles.cols, styles.cols1)}>
        <div className={styles.col}>
          <h3>상품 유형</h3>
          <OptionRow selected>
            <div className={styles.name}>{typeName}</div>
            <div className={styles.amt}>{price}</div>
          </OptionRow>
        </div>
        <div className={styles.col}>
          <h3>언어</h3>
          <OptionRow selected>
            <div className={styles.name}>
              <span className={styles.empty}>(빈 값)</span>
            </div>
          </OptionRow>
        </div>
        <div className={styles.col}>
          <h3>화질</h3>
          <OptionRow selected control={<Radio />}>
            <div className={styles.name}>
              {product.resolution || <span className={styles.empty}>(해상도 빈 값)</span>}
            </div>
            <div className={styles.amt}>{price}</div>
          </OptionRow>
        </div>
      </div>

      <PurchaseActionBar items={[typeName, product.resolution]} note={product.viewPeriod}>
        <button type="button" className={styles.btn} onClick={onCancel}>
          구매취소
        </button>
        <button type="button" className={cx(styles.btn, styles.primary)} onClick={onNext}>
          다음
        </button>
      </PurchaseActionBar>
    </div>
  )
}
