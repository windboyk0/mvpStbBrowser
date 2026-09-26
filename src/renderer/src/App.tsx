import { useState } from 'react'
import TopBar from './components/TopBar'
import MainScreen from './screens/main/MainScreen'
import PlaceholderScreen from './screens/placeholder/PlaceholderScreen'
import { findMenu, type MenuKey } from './screens/main/menus'
import styles from './App.module.css'

const APP_TITLE = 'MY B tv 구매 테스트'

export default function App(): React.JSX.Element {
  // null = 메인. 화면이 늘어나면 라우터 도입 검토
  const [route, setRoute] = useState<MenuKey | null>(null)
  const menu = route ? findMenu(route) : undefined

  return (
    <>
      <TopBar title={menu?.label ?? APP_TITLE} showBack={!!menu} onBack={() => setRoute(null)} />
      <main className={styles.content}>
        {menu ? <PlaceholderScreen label={menu.label} /> : <MainScreen onSelect={setRoute} />}
      </main>
    </>
  )
}
