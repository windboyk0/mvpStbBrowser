import type { MenuItem, MenuKey } from '@renderer/screens/main/menus'
import MenuCard from './MenuCard'
import styles from './MenuGrid.module.css'

interface MenuGridProps {
  items: readonly MenuItem[]
  onSelect: (key: MenuKey) => void
}

export default function MenuGrid({ items, onSelect }: MenuGridProps): React.JSX.Element {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <MenuCard key={item.key} item={item} onClick={() => onSelect(item.key)} />
      ))}
    </div>
  )
}
