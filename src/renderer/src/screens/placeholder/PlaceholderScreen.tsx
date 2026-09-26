import styles from './PlaceholderScreen.module.css'

interface PlaceholderScreenProps {
  label: string
}

// 아직 spec이 없는 메뉴 화면 (main_spec R4 / T7)
export default function PlaceholderScreen({ label }: PlaceholderScreenProps): React.JSX.Element {
  return <p className={styles.message}>{label} 화면은 별도 spec에서 정의됩니다.</p>
}
