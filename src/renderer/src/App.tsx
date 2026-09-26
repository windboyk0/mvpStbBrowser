import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import TopBar from './components/TopBar'
import MainScreen from './screens/main/MainScreen'
import PlaceholderScreen from './screens/placeholder/PlaceholderScreen'
import { findMenu, MENUS, type MenuKey } from './screens/main/menus'
import styles from './App.module.css'

const APP_TITLE = 'MY B tv 구매 테스트'

// 화면 모듈 자동 연결 — `screens/<메뉴 key>/index.tsx` (default export)
// 폴더명이 메뉴 key 와 같을 때만 연결 (main_spec 3. 설계 › 화면 모듈 연결)
const screenLoaders = import.meta.glob<{ default: ComponentType }>('./screens/*/index.tsx')

const SCREENS: Partial<Record<MenuKey, ComponentType>> = {}
for (const [path, load] of Object.entries(screenLoaders)) {
  const folder = path.split('/')[2]
  const menu = MENUS.find((m) => m.key === folder)
  if (menu) SCREENS[menu.key] = lazy(load)
}

// 화면 이동 요청 — window 이벤트 `app:navigate` (detail: { key: 메뉴 key | 'main' })
interface NavigateDetail {
  key?: string
}

export default function App(): React.JSX.Element {
  // null = 메인
  const [route, setRoute] = useState<MenuKey | null>(null)
  const menu = route ? findMenu(route) : undefined
  const Screen = menu ? SCREENS[menu.key] : undefined

  useEffect(() => {
    const onNavigate = (e: Event): void => {
      const key = (e as CustomEvent<NavigateDetail>).detail?.key
      if (key === 'main') setRoute(null)
      else if (key) {
        const target = MENUS.find((m) => m.key === key)
        if (target) setRoute(target.key)
      }
    }
    window.addEventListener('app:navigate', onNavigate)
    return () => window.removeEventListener('app:navigate', onNavigate)
  }, [])

  return (
    <>
      <TopBar title={menu?.label ?? APP_TITLE} showBack={!!menu} onBack={() => setRoute(null)} />
      <main className={styles.content}>
        {!menu ? (
          <MainScreen onSelect={setRoute} />
        ) : Screen ? (
          <Suspense fallback={null}>
            <Screen key={menu.key} />
          </Suspense>
        ) : (
          <PlaceholderScreen label={menu.label} />
        )}
      </main>
    </>
  )
}
