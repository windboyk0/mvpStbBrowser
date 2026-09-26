// 설정 IPC 요청 · 응답 형식 (settings_spec 3. 설계 › IPC)

/** `settings:get` 응답 — 비밀번호 원문은 renderer 로 보내지 않는다 */
export interface SettingsView {
  serverUrl: string
  svcMgmtNo: string
  dbConnectString: string
  dbUser: string
  hasPassword: boolean
}

/** `settings:save` · `settings:testConnection` 요청 — dbPassword 미전달 시 저장된 값 사용 */
export interface SettingsInput {
  serverUrl: string
  svcMgmtNo: string
  dbConnectString: string
  dbUser: string
  dbPassword?: string
}

export interface SaveResult {
  ok: boolean
  message?: string
}

export interface TestConnectionResult {
  ok: boolean
  stbId?: string
  message?: string
}
