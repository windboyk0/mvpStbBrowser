import type { IpcMain } from 'electron'
import { readPassword, readSettings, writeSettings } from './store'
import { queryStbId } from './connection'
import type { SaveResult, SettingsInput, SettingsView, TestConnectionResult } from './types'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function trim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// IPC 채널 — settings_spec 3. 설계 › IPC
export function register(ipc: IpcMain): void {
  ipc.handle('settings:get', (): SettingsView => readSettings())

  ipc.handle('settings:save', (_e, input: SettingsInput): SaveResult => {
    try {
      writeSettings(input)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: errorMessage(err) }
    }
  })

  // R3.4 — 저장하지 않고 현재 입력값으로만 접속한다
  ipc.handle(
    'settings:testConnection',
    async (_e, input: SettingsInput): Promise<TestConnectionResult> => {
      try {
        const typed = trim(input?.dbPassword)
        const stbId = await queryStbId({
          svcMgmtNo: trim(input?.svcMgmtNo),
          dbConnectString: trim(input?.dbConnectString),
          dbUser: trim(input?.dbUser),
          dbPassword: typed || readPassword()
        })
        return { ok: true, stbId }
      } catch (err) {
        return { ok: false, message: errorMessage(err) }
      }
    }
  )
}
