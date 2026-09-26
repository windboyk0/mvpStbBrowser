import { calcAmount } from './amount'
import { Check, OptionRow, PurchaseActionBar, PurchaseHeader, Radio, StepChips } from './components'
import { cx, prdTypLabel, won } from './format'
import type { ProductRow } from './types'
import styles from './singlePurchase.module.css'

// [C] Step 2 결제·할인 수단 선택 — R3 (1차: 결제 수단 청구서, 할인 수단 B캐시만 활성 — 1.1)

const PAY_METHODS = ['청구서', '신용카드', '휴대폰', '카카오페이', '네이버페이', 'PAYCO', 'SK pay']

interface Step2ViewProps {
  product: ProductRow
  useBcash: boolean
  paying: boolean
  onToggleBcash: () => void
  onPrev: () => void
  onCancel: () => void
  onPay: () => void
}

export default function Step2View({
  product,
  useBcash,
  paying,
  onToggleBcash,
  onPrev,
  onCancel,
  onPay
}: Step2ViewProps): React.JSX.Element {
  const amount = calcAmount(product.salePrc, useBcash)
  const discountText = amount.discount ? `-${won(amount.discount)}` : '0원'

  // 비활성(☒) 할인 수단 — 추후
  const disabledDiscount = (name: string, desc: string): React.JSX.Element => (
    <OptionRow disabled control={<Check disabled />}>
      <div className={cx(styles.name, styles.discountName)}>{name}</div>
      <div className={styles.desc}>{desc}</div>
      <div className={styles.amt}>0원</div>
    </OptionRow>
  )

  return (
    <div className={styles.step}>
      <StepChips active={2} />
      <PurchaseHeader title={product.prdNm} guide="결제 및 할인 수단을 선택해 주세요." />

      <div className={cx(styles.cols, styles.cols2)}>
        <div className={styles.col}>
          <h3>결제 수단</h3>
          <div className={styles.payList}>
            {PAY_METHODS.map((name, i) => (
              <OptionRow key={name} selected={i === 0} disabled={i !== 0} control={<Radio />}>
                <div className={cx(styles.name, styles.nameNormal)}>{name}</div>
              </OptionRow>
            ))}
          </div>
        </div>

        <div className={styles.col}>
          <h3>
            할인 수단 <small>결제 수단 변경 시, 할인 수단이 변경될 수 있습니다.</small>
          </h3>
          {disabledDiscount('쿠폰', '')}
          <OptionRow selected={useBcash} onClick={onToggleBcash} control={<Check on={useBcash} />}>
            <div className={cx(styles.name, styles.discountName)}>B캐시</div>
            <div className={cx(styles.desc, useBcash && styles.descOn)}>
              {amount.bcashPoint.toLocaleString('ko-KR')}P 차감
            </div>
            <div className={styles.amt}>{useBcash ? discountText : '0원'}</div>
          </OptionRow>
          {disabledDiscount('OK 캐쉬백', '')}
          {disabledDiscount('T멤버십', 'T멤버십 번호 등록')}
          {disabledDiscount('TV포인트', '포인트 조회')}
        </div>

        <div className={styles.col}>
          <h3>결제 금액</h3>
          <div className={styles.sum}>
            <div className={styles.sumLine}>
              상품 금액<b>{won(amount.base)}</b>
            </div>
            <div className={styles.sumLine}>
              할인 금액<b>{discountText}</b>
            </div>
            <div className={styles.sumLine}>
              부가세<b>{amount.vat ? `+${won(amount.vat)}` : '0원'}</b>
            </div>
            <div className={cx(styles.sumLine, styles.sumTotal)}>
              구매 금액<b>{won(amount.total)}</b>
            </div>
            {/* 1차: 표시만, 동작 없음 (R3.4) */}
            <div className={styles.sumOpt}>
              <Check />
              선택한 결제수단을 다음 번에도 사용
            </div>
          </div>
        </div>
      </div>

      <PurchaseActionBar
        items={[prdTypLabel(product.prdTypCd), product.resolution]}
        note={product.viewPeriod}
      >
        <button type="button" className={styles.btn} onClick={onPrev} disabled={paying}>
          이전
        </button>
        <button type="button" className={styles.btn} onClick={onCancel} disabled={paying}>
          구매취소
        </button>
        <button
          type="button"
          className={cx(styles.btn, styles.primary)}
          onClick={onPay}
          disabled={paying}
        >
          {won(amount.total)} 결제
        </button>
      </PurchaseActionBar>
    </div>
  )
}
