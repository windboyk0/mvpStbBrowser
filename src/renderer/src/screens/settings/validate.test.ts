import { describe, expect, it } from 'vitest'
import { hasErrors, validate, type FormValues } from './validate'

const valid: FormValues = {
  serverUrl: 'https://example.invalid',
  svcMgmtNo: '12345',
  dbConnectString: 'host:1521/service',
  dbUser: 'user',
  dbPassword: 'pw'
}

describe('settings validate (R1.2)', () => {
  it('정상 입력은 오류 없음', () => {
    expect(hasErrors(validate(valid, false))).toBe(false)
  })

  it('빈 값은 "{항목명}를 입력해 주세요."', () => {
    const e = validate(
      { serverUrl: '', svcMgmtNo: ' ', dbConnectString: '', dbUser: '', dbPassword: '' },
      false
    )
    expect(e).toEqual({
      serverUrl: 'STG 서버 주소를 입력해 주세요.',
      svcMgmtNo: '서비스관리번호를 입력해 주세요.',
      dbConnectString: 'DB 접속 정보를 입력해 주세요.',
      dbUser: 'DB 아이디를 입력해 주세요.',
      dbPassword: 'DB 비밀번호를 입력해 주세요.'
    })
  })

  it('서버 주소는 http:// 또는 https:// 로 시작', () => {
    expect(validate({ ...valid, serverUrl: 'ftp://x' }, false).serverUrl).toBe(
      'http:// 또는 https:// 로 시작해야 합니다.'
    )
    expect(validate({ ...valid, serverUrl: ' http://x ' }, false).serverUrl).toBeUndefined()
  })

  it('서비스관리번호는 숫자만', () => {
    expect(validate({ ...valid, svcMgmtNo: '12a4' }, false).svcMgmtNo).toBe('숫자만 입력해 주세요.')
    expect(validate({ ...valid, svcMgmtNo: ' 007 ' }, false).svcMgmtNo).toBeUndefined()
  })

  it('저장된 비밀번호가 있으면 비밀번호 빈 값 허용 (기존 값 유지)', () => {
    expect(validate({ ...valid, dbPassword: '' }, true).dbPassword).toBeUndefined()
    expect(validate({ ...valid, dbPassword: '' }, false).dbPassword).toBeDefined()
  })
})
