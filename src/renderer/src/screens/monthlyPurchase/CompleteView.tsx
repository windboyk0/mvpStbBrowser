import styles from './MonthlyPurchase.module.css'

interface CompleteViewProps {
  success: boolean
  message: string
  onHome: () => void
  onContinue: () => void
}

// [D] 구매완료 — R4
export default function CompleteView({
  success,
  message,
  onHome,
  onContinue
}: CompleteViewProps): React.JSX.Element {
  return (
    <div className={styles.done}>
      <div className={`${styles.doneIcon} ${success ? styles.ok : styles.danger}`}>
        {success ? '✔' : '✖'}
      </div>
      <p className={styles.doneText}>{message}</p>
      <div className={styles.doneActions}>
        <button type="button" className={styles.btn} onClick={onHome}>
          홈으로
        </button>
        <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onContinue}>
          구매 계속하기
        </button>
      </div>
    </div>
  )
}
