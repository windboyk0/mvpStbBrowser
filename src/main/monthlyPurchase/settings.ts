import { safeStorage } from 'electron'
import Store from 'electron-store'

// 설정값 계약 (CLAUDE.md › 화면 모듈 계약 3) — 이 모듈은 읽기만 한다
const REQUIRED_KEYS = [
  'serverUrl',
  'svcMgmtNo',
  'dbConnectString',
  'dbUser',
  'dbPasswordEnc'
] as const

type SettingKey = (typeof REQUIRED_KEYS)[number]

export interface MonthlyPurchaseSettings {
  serverUrl: string
  svcMgmtNo: string
  dbConnectString: string
  dbUser: string
  dbPassword: string
}

let store: Store<Partial<Record<SettingKey, string>>> | null = null

function getStore(): Store<Partial<Record<SettingKey, string>>> {
  if (!store) store = new Store<Partial<Record<SettingKey, string>>>({ name: 'settings' })
  return store
}

function readRaw(key: SettingKey): string {
  const value = getStore().get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** R0.1 필수 설정이 모두 있는지 */
export function hasRequiredSettings(): boolean {
  return REQUIRED_KEYS.every((key) => readRaw(key) !== '')
}

/** 설정값 읽기 + dbPasswordEnc 복호화. 필수 값이 없으면 예외 */
export function readSettings(): MonthlyPurchaseSettings {
  if (!hasRequiredSettings()) throw new Error('설정을 먼저 입력해 주세요.')
  const dbPassword = safeStorage.decryptString(Buffer.from(readRaw('dbPasswordEnc'), 'base64'))
  return {
    serverUrl: readRaw('serverUrl'),
    svcMgmtNo: readRaw('svcMgmtNo'),
    dbConnectString: readRaw('dbConnectString'),
    dbUser: readRaw('dbUser'),
    dbPassword
  }
}
