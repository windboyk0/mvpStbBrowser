import type { IpcMain } from 'electron'
import { couponList } from './coupon'
import { purchase } from './purchase'
import { search } from './search'
import { missingSettings } from './settings'
import type { CheckSettingsResult } from './types'

// singlePurchase 화면 IPC — CLAUDE.md › 화면 모듈 계약 (채널 `singlePurchase:<action>`)
export function register(ipc: IpcMain): void {
  ipc.handle('singlePurchase:checkSettings', (): CheckSettingsResult => {
    try {
      const missing = missingSettings()
      return { ok: missing.length === 0, missing }
    } catch (err) {
      console.error('[singlePurchase] 설정 읽기 실패', err)
      return { ok: false, missing: [] }
    }
  })
  ipc.handle('singlePurchase:search', (_e, payload: unknown) => search(payload))
  ipc.handle('singlePurchase:purchase', (_e, payload: unknown) => purchase(payload))
  ipc.handle('singlePurchase:couponList', (_e, payload: unknown) => couponList(payload))
}
