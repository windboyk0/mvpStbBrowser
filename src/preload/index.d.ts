import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      /** channel = `<메뉴 key>:<action>` (예: `singlePurchase:search`). 접두어가 메뉴 key 가 아니면 reject */
      invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>
    }
  }
}
