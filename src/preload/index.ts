import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { MENUS } from '../renderer/src/screens/main/menus'

// 화면 모듈 계약 — IPC 채널명은 `<메뉴 key>:<action>` (main_spec 3. 설계 › 화면 모듈 연결)
const MENU_KEYS: ReadonlySet<string> = new Set(MENUS.map((m) => m.key))

function isAllowedChannel(channel: unknown): channel is string {
  if (typeof channel !== 'string') return false
  const sep = channel.indexOf(':')
  if (sep <= 0 || sep === channel.length - 1) return false
  return MENU_KEYS.has(channel.slice(0, sep))
}

const api = {
  invoke<T = unknown>(channel: string, payload?: unknown): Promise<T> {
    if (!isAllowedChannel(channel)) {
      return Promise.reject(new Error(`허용되지 않은 IPC 채널: ${String(channel)}`))
    }
    return ipcRenderer.invoke(channel, payload) as Promise<T>
  }
}

contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
