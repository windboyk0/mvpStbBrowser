import { useEffect, type ReactNode } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { cx, won } from './format'
import type { CouponRow } from './types'
import styles from './singlePurchase.module.css'

// 단건구매 화면 전용 컴포넌트 (spec 4. 설계 › 컴포넌트) — 다른 화면과 공유하지 않는다

export function StepChips({ active }: { active: 1 | 2 }): React.JSX.Element {
  return (
    <div className={styles.steps}>
      <span className={cx(active === 1 && styles.stepOn)}>Step 1</span>
      <span className={cx(active === 2 && styles.stepOn)}>Step 2</span>
    </div>
  )
}

export function PurchaseHeader({
  title,
  guide
}: {
  title: string
  guide: string
}): React.JSX.Element {
  return (
    <div className={styles.header}>
      <h2>{title}</h2>
      <p>{guide}</p>
    </div>
  )
}

interface OptionRowProps {
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  /** 앞쪽 컨트롤 — 라디오 / 체크박스 */
  control?: ReactNode
  children: ReactNode
}

/** 선택 행 (라디오/체크 + 이름 + 설명 + 금액) */
export function OptionRow({
  selected,
  disabled,
  onClick,
  control,
  children
}: OptionRowProps): React.JSX.Element {
  return (
    <div
      className={cx(styles.row, selected && styles.sel, disabled && styles.dis)}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
    >
      {control}
      {children}
    </div>
  )
}

export function Radio(): React.JSX.Element {
  return <span className={styles.radio} />
}

/** 체크박스 — disabled 는 ☒ 표시 */
export function Check({ on, disabled }: { on?: boolean; disabled?: boolean }): React.JSX.Element {
  return (
    <span className={cx(styles.chk, on && styles.chkOn)}>
      {disabled ? <IconX size={15} /> : on ? <IconCheck size={15} /> : null}
    </span>
  )
}

interface ActionBarProps {
  /** 상품 선택 내역 (빈 값 제외 후 `|` 로 구분) */
  items: string[]
  note?: string
  children: ReactNode
}

export function PurchaseActionBar({ items, note, children }: ActionBarProps): React.JSX.Element {
  const values = items.filter(Boolean)
  return (
    <div className={styles.bar}>
      <div className={styles.barInfo}>
        <div className={styles.barKey}>상품 선택 내역</div>
        <div className={styles.barValue}>
          {values.map((v, i) => (
            <span key={i}>
              {i > 0 && <span className={styles.barSep}>|</span>}
              {v}
            </span>
          ))}
          {note && (
            <>
              {values.length > 0 && <span className={styles.barSep}>|</span>}
              <small>{note}</small>
            </>
          )}
        </div>
        <div className={styles.barNote}>
          결제 후에는 취소 및 환불이 되지 않으며 콘텐츠 시청 시 광고가 포함될 수 있습니다.
        </div>
      </div>
      {children}
    </div>
  )
}

interface ModalProps {
  message: string
  cancelLabel: string
  okLabel: string
  onCancel: () => void
  onOk: () => void
  /** Esc / 배경 클릭 = 취소 */
  dismissible?: boolean
}

export function Modal({
  message,
  cancelLabel,
  okLabel,
  onCancel,
  onOk,
  dismissible
}: ModalProps): React.JSX.Element {
  useEffect(() => {
    if (!dismissible) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismissible, onCancel])

  return (
    <div
      className={styles.modalBg}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onCancel()
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        <p>{message}</p>
        <div className={styles.modalActs}>
          <button type="button" className={styles.btn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={cx(styles.btn, styles.primary)} onClick={onOk}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

interface CouponModalProps {
  coupons: CouponRow[]
  /** 적용 중인 쿠폰번호 — 텍스트 `focus` */
  appliedNo: string | null
  onSelect: (coupon: CouponRow) => void
  onCancel: () => void
}

/** 쿠폰 선택 팝업 (4. 설계 › 쿠폰 선택 팝업) — 행 클릭 = 선택 · 닫힘, Esc / 배경 / [취소] = 선택 없이 닫기 */
export function CouponModal({
  coupons,
  appliedNo,
  onSelect,
  onCancel
}: CouponModalProps): React.JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className={styles.modalBg}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className={cx(styles.modal, styles.couponModal)} role="dialog" aria-modal="true">
        <h3 className={styles.couponTitle}>쿠폰 선택</h3>
        <div className={styles.couponList}>
          {coupons.map((c) => (
            <div
              key={c.couponNo}
              className={cx(styles.couponItem, c.couponNo === appliedNo && styles.couponItemOn)}
              onClick={() => onSelect(c)}
            >
              <span className={styles.couponName}>{c.name}</span>
              <span className={styles.couponEnd}>{c.applyEnd && `~${c.applyEnd}`}</span>
              <span className={styles.couponAmt}>-{won(c.discount)}</span>
            </div>
          ))}
        </div>
        <div className={styles.modalActs}>
          <button type="button" className={styles.btn} onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
