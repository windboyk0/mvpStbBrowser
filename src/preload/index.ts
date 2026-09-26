import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// renderer에 노출할 API. DB/API/설정 기능은 각 화면 spec 확정 후 추가한다.
const api = {}

contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
