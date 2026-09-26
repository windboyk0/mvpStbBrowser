import { safeStorage } from 'electron'
import Store from 'electron-store'

// 설정값 읽기 — CLAUDE.md › 화면 모듈 계약 › 설정값 계약 (쓰기는 settings 화면만, 여기서는 읽기만)
// store 파일명 `settings`, dbPasswordEnc = safeStorage.encryptString(비밀번호) 의 base64

export const REQUIRED_SETTING_KEYS = [
  'serverUrl',
  'svcMgmtNo',
  'dbConnectString',
  'dbUser',
  'dbPasswordEnc'
] as const

type SettingKey = (typeof REQUIRED_SETTING_KEYS)[number]
type RawSettings = Partial<Record<SettingKey, unknown>>

export interface Settings {
  serverUrl: string
  svcMgmtNo: string
  dbConnectString: string
  dbUser: string
  dbPassword: string
}

let store: Store<RawSettings> | undefined

function readRaw(): RawSettings {
  // 다른 화면이 쓴 값을 매번 새로 읽도록 get 시점에 조회 (electron-store 는 get 마다 파일을 읽음)
  store ??= new Store<RawSettings>({ name: 'settings' })
  const raw: RawSettings = {}
  for (const key of REQUIRED_SETTING_KEYS) raw[key] = store.get(key)
  return raw
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** 비어 있는 필수 설정 키 목록 */
export function missingSettings(): string[] {
  const raw = readRaw()
  return REQUIRED_SETTING_KEYS.filter((key) => text(raw[key]) === '')
}

/** 필수 설정 전체 (비밀번호 복호화 포함). 누락 · 복호화 실패 시 예외 */
export function readSettings(): Settings {
  const raw = readRaw()
  const missing = REQUIRED_SETTING_KEYS.filter((key) => text(raw[key]) === '')
  if (missing.length > 0) throw new Error('설정을 먼저 입력해 주세요.')

  return {
    serverUrl: text(raw.serverUrl),
    svcMgmtNo: text(raw.svcMgmtNo),
    dbConnectString: text(raw.dbConnectString),
    dbUser: text(raw.dbUser),
    dbPassword: safeStorage.decryptString(Buffer.from(text(raw.dbPasswordEnc), 'base64'))
  }
}
