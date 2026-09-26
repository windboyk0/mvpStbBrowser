import { describe, expect, it } from 'vitest'
import {
  buildEpsRequest,
  formatDateTime,
  formatTimeStamp,
  interpretResponse,
  NETWORK_FAIL_MESSAGE,
  SUCCESS_MESSAGE
} from './eps'

const now = new Date(2026, 8, 26, 7, 5, 9, 42)

describe('IF-EPS-001 요청 매핑', () => {
  it('시각 형식', () => {
    expect(formatDateTime(now)).toBe('20260926070509')
    expect(formatTimeStamp(now)).toBe('20260926070509.042')
  })

  it('URL · Header · Body', () => {
    const req = buildEpsRequest({
      serverUrl: 'http://stg.example/',
      prdPrcId: 'P1',
      stbId: 'STB1',
      useBcash: true,
      now
    })
    expect(req.url).toBe('http://stg.example/eps/v5/payment/product/P1?method=POST')
    expect(req.headers.Client_ID).toBe('STB1')
    expect(req.headers.Trace).toBe('IPTV')
    expect(req.headers.TimeStamp).toBe('20260926070509.042')
    expect(req.headers.Api_Key).toBe('')
    expect(req.body).toMatchObject({
      if: 'IF-EPS-001',
      ver: '5.0',
      ui_name: 'BTVUH2V500',
      client_name: null,
      response_format: 'json',
      stb_id: 'STB1',
      requestDateTime: '20260926070509',
      useCoupon: false,
      useBcash: true,
      paymentType: null
    })
    expect(req.body).not.toHaveProperty('mac')
  })
})

describe('IF-EPS-001 응답 해석', () => {
  it('성공 0000', () => {
    expect(interpretResponse({ result: '0000', reason: 'OK' })).toEqual({
      ok: true,
      message: SUCCESS_MESSAGE
    })
  })

  it('실패 reason 의 \\n 줄바꿈', () => {
    expect(interpretResponse({ result: '3002', reason: '이미 구매한\\n상품입니다.' })).toEqual({
      ok: false,
      message: '이미 구매한\n상품입니다.'
    })
  })

  it('응답 없음 / reason 없음', () => {
    expect(interpretResponse(null).message).toBe(NETWORK_FAIL_MESSAGE)
    expect(interpretResponse({ result: '9999' }).message).toBe(NETWORK_FAIL_MESSAGE)
  })
})
