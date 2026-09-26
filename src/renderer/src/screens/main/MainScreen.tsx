import MenuGrid from '@renderer/components/MenuGrid'
import { MENUS, type MenuKey } from './menus'
import styles from './MainScreen.module.css'

interface MainScreenProps {
  onSelect: (key: MenuKey) => void
}

export default function MainScreen({ onSelect }: MainScreenProps): React.JSX.Element {
  return (
    <>
      <h2 className={styles.sectionTitle}>MY B tv</h2>
      <MenuGrid items={MENUS} onSelect={onSelect} />
    </>
  )
}
