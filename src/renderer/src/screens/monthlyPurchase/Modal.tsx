import { useEffect, type ReactNode } from 'react'
import styles from './MonthlyPurchase.module.css'

interface ModalProps {
  children: ReactNode
  actions: ReactNode
  /** Esc · 배경 클릭 시 호출 (없으면 닫히지 않음) */
  onDismiss?: () => void
}

export default function Modal({ children, actions, onDismiss }: ModalProps): React.JSX.Element {
  useEffect(() => {
    if (!onDismiss) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <div
      className={styles.modalBg}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss?.()
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        <p className={styles.modalText}>{children}</p>
        <div className={styles.modalActions}>{actions}</div>
      </div>
    </div>
  )
}
