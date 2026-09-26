import { IconCircleCheck, IconCircleX } from '@tabler/icons-react'
import { cx } from './format'
import type { PurchaseResult } from './types'
import styles from './singlePurchase.module.css'

// [D] 구매완료 — R5

interface DoneViewProps {
  result: PurchaseResult
  onHome: () => void
  onContinue: () => void
}

export default function DoneView({ result, onHome, onContinue }: DoneViewProps): React.JSX.Element {
  return (
    <div className={styles.done}>
      {result.ok ? (
        <IconCircleCheck size={72} stroke={1.5} className={styles.iconOk} />
      ) : (
        <IconCircleX size={72} stroke={1.5} className={styles.iconNg} />
      )}
      <p>{result.message}</p>
      <div className={styles.doneActs}>
        <button type="button" className={styles.btn} onClick={onHome}>
          홈으로
        </button>
        <button type="button" className={cx(styles.btn, styles.primary)} onClick={onContinue}>
          구매 계속하기
        </button>
      </div>
    </div>
  )
}
