import { IconArrowLeft } from '@tabler/icons-react'
import styles from './TopBar.module.css'

interface TopBarProps {
  title: string
  showBack: boolean
  onBack?: () => void
}

export default function TopBar({ title, showBack, onBack }: TopBarProps): React.JSX.Element {
  return (
    <header className={styles.topBar}>
      {showBack && (
        <button type="button" className={styles.back} onClick={onBack} aria-label="뒤로">
          <IconArrowLeft size={22} stroke={1.75} />
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
    </header>
  )
}
