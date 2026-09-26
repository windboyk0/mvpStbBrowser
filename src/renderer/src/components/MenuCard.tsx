import {
  IconBarcode,
  IconCalendarRepeat,
  IconCash,
  IconChevronRight,
  IconCoin,
  IconDeviceTv,
  IconIdBadge2,
  IconLetterT,
  IconReceipt,
  IconSettings,
  IconShoppingCart,
  IconTicket,
  type Icon
} from '@tabler/icons-react'
import type { MenuIcon, MenuItem } from '@renderer/screens/main/menus'
import styles from './MenuCard.module.css'

const ICONS: Record<MenuIcon, Icon> = {
  'shopping-cart': IconShoppingCart,
  'calendar-repeat': IconCalendarRepeat,
  ticket: IconTicket,
  coin: IconCoin,
  'id-badge-2': IconIdBadge2,
  receipt: IconReceipt,
  barcode: IconBarcode,
  'device-tv': IconDeviceTv,
  'letter-t': IconLetterT,
  cash: IconCash,
  settings: IconSettings
}

interface MenuCardProps {
  item: MenuItem
  onClick: () => void
}

export default function MenuCard({ item, onClick }: MenuCardProps): React.JSX.Element {
  const MenuIconComponent = ICONS[item.icon]
  const className = item.isNew ? `${styles.card} ${styles.buy}` : styles.card

  return (
    <button type="button" className={className} onClick={onClick}>
      {item.isNew && <span className={styles.newBadge}>신규</span>}
      <span className={styles.titleRow}>
        <MenuIconComponent className={styles.icon} size={26} stroke={1.75} />
        {item.label}
      </span>
      <span className={styles.bottomRow}>
        <IconChevronRight size={20} stroke={1.75} />
      </span>
    </button>
  )
}
