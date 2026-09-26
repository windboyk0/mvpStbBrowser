import { useEffect, useRef, useState } from 'react'
import {
  FIELD_LABELS,
  hasErrors,
  validate,
  type FieldKey,
  type FormErrors,
  type FormValues
} from './validate'
import styles from './Settings.module.css'

// IPC 응답 형식 — settings_spec 3. 설계 › IPC
interface SettingsView {
  serverUrl: string
  svcMgmtNo: string
  dbConnectString: string
  dbUser: string
  hasPassword: boolean
}

interface SaveResult {
  ok: boolean
  message?: string
}

interface TestConnectionResult {
  ok: boolean
  stbId?: string
  message?: string
}

type TestState =
  { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; success: boolean; text: string }

const EMPTY: FormValues = {
  serverUrl: '',
  svcMgmtNo: '',
  dbConnectString: '',
  dbUser: '',
  dbPassword: ''
}

const TOAST_MS = 2000

/** 요청 payload — 앞뒤 공백 제거, 비밀번호 빈 값이면 미전달(기존 값 유지) */
function toPayload(values: FormValues): Record<string, string> {
  const payload: Record<string, string> = {
    serverUrl: values.serverUrl.trim(),
    svcMgmtNo: values.svcMgmtNo.trim(),
    dbConnectString: values.dbConnectString.trim(),
    dbUser: values.dbUser.trim()
  }
  const password = values.dbPassword.trim()
  if (password) payload.dbPassword = password
  return payload
}

function testResultText(res: TestConnectionResult): { success: boolean; text: string } {
  if (!res.ok) return { success: false, text: `연결 실패 · ${res.message ?? ''}` }
  if (res.stbId) return { success: true, text: `연결 성공 · STB ID: ${res.stbId}` }
  return { success: false, text: '연결 성공 · 서비스관리번호에 해당하는 STB가 없습니다.' }
}

export default function SettingsScreen(): React.JSX.Element {
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasPassword, setHasPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [test, setTest] = useState<TestState>({ kind: 'idle' })
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // R2.3 / R2.4 — 저장된 값 채우기 (비밀번호 원문은 받지 않음)
  useEffect(() => {
    let alive = true
    window.api
      .invoke<SettingsView>('settings:get')
      .then((s) => {
        if (!alive) return
        setValues({
          serverUrl: s.serverUrl,
          svcMgmtNo: s.svcMgmtNo,
          dbConnectString: s.dbConnectString,
          dbUser: s.dbUser,
          dbPassword: ''
        })
        setHasPassword(s.hasPassword)
      })
      .catch(() => undefined)
    return () => {
      alive = false
      clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = (text: string): void => {
    clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(''), TOAST_MS)
  }

  const onChange = (key: FieldKey, value: string): void => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const check = (): boolean => {
    const next = validate(values, hasPassword)
    setErrors(next)
    return !hasErrors(next)
  }

  const onSave = async (): Promise<void> => {
    if (!check()) return
    try {
      const res = await window.api.invoke<SaveResult>('settings:save', toPayload(values))
      if (!res.ok) {
        showToast(`저장 실패 · ${res.message ?? ''}`)
        return
      }
      if (values.dbPassword.trim()) {
        setHasPassword(true)
        setValues((prev) => ({ ...prev, dbPassword: '' }))
      }
      showToast('저장되었습니다.')
    } catch (err) {
      showToast(`저장 실패 · ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // R3 — 현재 입력값으로 테스트, 저장하지 않음
  const onTest = async (): Promise<void> => {
    if (!check()) return
    setTest({ kind: 'running' })
    try {
      const res = await window.api.invoke<TestConnectionResult>(
        'settings:testConnection',
        toPayload(values)
      )
      setTest({ kind: 'done', ...testResultText(res) })
    } catch (err) {
      setTest({
        kind: 'done',
        ...testResultText({ ok: false, message: err instanceof Error ? err.message : String(err) })
      })
    }
  }

  const renderInput = (key: FieldKey, placeholder?: string): React.JSX.Element => (
    <input
      id={`settings-${key}`}
      className={`${styles.input} ${errors[key] ? styles.invalid : ''}`}
      value={values[key]}
      placeholder={placeholder}
      spellCheck={false}
      autoComplete="off"
      onChange={(e) => onChange(key, e.target.value)}
    />
  )

  const renderField = (key: FieldKey, control: React.JSX.Element): React.JSX.Element => (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`settings-${key}`}>
        {FIELD_LABELS[key]}
      </label>
      {control}
      {errors[key] && <div className={styles.error}>{errors[key]}</div>}
    </div>
  )

  const running = test.kind === 'running'

  return (
    <>
      <div className={styles.card}>
        {renderField('serverUrl', renderInput('serverUrl', 'https://'))}
        {renderField('svcMgmtNo', renderInput('svcMgmtNo', '숫자만 입력'))}
        <hr className={styles.divider} />
        {renderField('dbConnectString', renderInput('dbConnectString', 'host:port/serviceName'))}
        <div className={styles.two}>
          {renderField('dbUser', renderInput('dbUser'))}
          {renderField(
            'dbPassword',
            <div className={styles.password}>
              <input
                id="settings-dbPassword"
                className={`${styles.input} ${errors.dbPassword ? styles.invalid : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={values.dbPassword}
                placeholder={hasPassword ? '••••••••' : undefined}
                autoComplete="new-password"
                onChange={(e) => onChange('dbPassword', e.target.value)}
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
          )}
        </div>
        <hr className={styles.divider} />
        <div className={styles.actions}>
          <button type="button" className={styles.button} disabled={running} onClick={onTest}>
            {running ? '연결 확인 중…' : '연결 테스트'}
          </button>
          {test.kind === 'done' && (
            <span className={`${styles.result} ${test.success ? styles.success : styles.fail}`}>
              {test.text}
            </span>
          )}
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={onSave}>
            저장
          </button>
        </div>
      </div>
      <div className={`${styles.toast} ${toast ? styles.visible : ''}`} role="status">
        {toast}
      </div>
    </>
  )
}
