import Store from 'electron-store'
import { safeStorage } from 'electron'
import type { SettingsInput, SettingsView } from './types'

// 설정값 계약 (CLAUDE.md › 화면 모듈 계약 › 설정값 계약) — 다른 화면이 이 형식으로 직접 읽는다
interface SettingsSchema {
  serverUrl: string
  svcMgmtNo: string
  dbConnectString: string
  dbUser: string
  /** safeStorage.encryptString(비밀번호) 결과의 base64 */
  dbPasswordEnc: string
}

let store: Store<SettingsSchema> | undefined

function getStore(): Store<SettingsSchema> {
  if (!store) store = new Store<SettingsSchema>({ name: 'settings' })
  return store
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function readSettings(): SettingsView {
  const s = getStore()
  return {
    serverUrl: str(s.get('serverUrl')),
    svcMgmtNo: str(s.get('svcMgmtNo')),
    dbConnectString: str(s.get('dbConnectString')),
    dbUser: str(s.get('dbUser')),
    hasPassword: str(s.get('dbPasswordEnc')) !== ''
  }
}

/** 저장된 비밀번호 복호화 — 없으면 빈 문자열 */
export function readPassword(): string {
  const enc = str(getStore().get('dbPasswordEnc'))
  if (!enc) return ''
  return safeStorage.decryptString(Buffer.from(enc, 'base64'))
}

/** R2.2 — 앞뒤 공백 제거 후 저장. dbPassword 미전달(또는 빈 값) 시 기존 값 유지 */
export function writeSettings(input: SettingsInput): void {
  const s = getStore()
  const password = typeof input.dbPassword === 'string' ? input.dbPassword.trim() : ''
  // 암호화를 먼저 수행해 실패 시 일부만 저장되지 않게 한다
  const passwordEnc = password ? safeStorage.encryptString(password).toString('base64') : undefined

  s.set('serverUrl', str(input.serverUrl))
  s.set('svcMgmtNo', str(input.svcMgmtNo))
  s.set('dbConnectString', str(input.dbConnectString))
  s.set('dbUser', str(input.dbUser))
  if (passwordEnc) s.set('dbPasswordEnc', passwordEnc)
}
