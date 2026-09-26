// 입력 검증 규칙 — settings_spec R1, R1.2

export type FieldKey = 'serverUrl' | 'svcMgmtNo' | 'dbConnectString' | 'dbUser' | 'dbPassword'

export type FormValues = Record<FieldKey, string>
export type FormErrors = Partial<Record<FieldKey, string>>

export const FIELD_LABELS: Record<FieldKey, string> = {
  serverUrl: 'STG 서버 주소',
  svcMgmtNo: '서비스관리번호',
  dbConnectString: 'DB 접속 정보',
  dbUser: 'DB 아이디',
  dbPassword: 'DB 비밀번호'
}

const FIELD_ORDER: FieldKey[] = [
  'serverUrl',
  'svcMgmtNo',
  'dbConnectString',
  'dbUser',
  'dbPassword'
]

/**
 * 오류가 없으면 빈 객체.
 * hasStoredPassword = 저장된 비밀번호가 있으면 비밀번호 빈 값은 "기존 값 유지"로 통과 (R2.3)
 */
export function validate(values: FormValues, hasStoredPassword: boolean): FormErrors {
  const errors: FormErrors = {}
  for (const key of FIELD_ORDER) {
    const v = values[key].trim()
    if (!v) {
      if (key === 'dbPassword' && hasStoredPassword) continue
      errors[key] = `${FIELD_LABELS[key]}를 입력해 주세요.`
    } else if (key === 'serverUrl' && !/^https?:\/\//.test(v)) {
      errors[key] = 'http:// 또는 https:// 로 시작해야 합니다.'
    } else if (key === 'svcMgmtNo' && !/^\d+$/.test(v)) {
      errors[key] = '숫자만 입력해 주세요.'
    }
  }
  return errors
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0
}
