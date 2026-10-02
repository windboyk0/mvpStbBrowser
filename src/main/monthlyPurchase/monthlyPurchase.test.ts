import { describe, expect, it } from 'vitest'
import { splitStatements, plsqlBlock } from './sql'
import { PRODUCT_TYPES, productListSql, agreementListSql, stbIdSql, couponListSql } from './queries'
import { buildEpsRequest, formatDateTime, formatTimeStamp, parseEpsResponse } from './eps'
import { toCoupon } from './coupon'

describe('splitStatements', () => {
  it('헤더 주석 제거, 구분 주석 기준 분리, 끝 ; 제거', () => {
    const text = `/* 헤더 :svcMgmtNo */\n\n/* ===== 목록 ===== */\nSELECT 1 FROM DUAL;\n\n/* ===== 전체 건수 ===== */\nSELECT COUNT(*) FROM (\n SELECT 1 FROM DUAL\n);\n`
    expect(splitStatements(text)).toEqual([
      'SELECT 1 FROM DUAL',
      'SELECT COUNT(*) FROM (\n SELECT 1 FROM DUAL\n)'
    ])
  })
})

describe('Query 파일 (R1.2 · R1.3)', () => {
  it.each(PRODUCT_TYPES)('%s: 목록 · 건수 2개 문, 바인드 변수', (type) => {
    const { list, count } = productListSql(type)
    expect(list).toMatch(/:svcMgmtNo/)
    expect(list).toMatch(/:prdNm/)
    expect(list).toMatch(/OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY$/)
    expect(count).toMatch(/^SELECT COUNT\(\*\) AS TOTAL_CNT/)
    expect(count).not.toMatch(/:offset|:pageSize/)
    expect(list.endsWith(';') || count.endsWith(';')).toBe(false)
  })

  it('약정 Query: :prdPrcId, 끝 ; 없음', () => {
    const sql = agreementListSql()
    expect(sql).toMatch(/:prdPrcId/)
    expect(sql.endsWith(';')).toBe(false)
  })

  it('STB ID Query', () => {
    expect(stbIdSql().replace(/\s+/g, ' ')).toBe(
      'SELECT STB_ID FROM STB WHERE USER_SERVICE_NUM = :svcMgmtNo'
    )
  })
})

describe('쿠폰 조회 PL/SQL (R5.2)', () => {
  it('plsqlBlock: 헤더 주석만 제거, 끝 END; 유지', () => {
    const text = `\uFEFF/* 헤더 */\nBEGIN\n  NULL;\nEND;\n`
    expect(plsqlBlock(text)).toBe('BEGIN\n  NULL;\nEND;')
  })

  it('쿠폰 Query: DECLARE … END; 블록, 바인드 변수', () => {
    const sql = couponListSql()
    expect(sql.startsWith('DECLARE')).toBe(true)
    expect(sql.endsWith('END;')).toBe(true)
    expect(sql).not.toMatch(/^\s*\/\*/)
    for (const bind of [':svcMgmtNo', ':idProduct', ':prdAgmtId', ':idContents', ':amtPrice']) {
      expect(sql).toContain(bind)
    }
    expect(sql).toContain(':couponCursor')
  })

  it('결과 행 → 쿠폰 (Q9 · Q10)', () => {
    expect(
      toCoupon({
        NO_COUPON: 'C001',
        NM_COUPON: '테스트 쿠폰',
        NM_COUPON2: '다른 이름',
        DD_APPLY_END: '20261231',
        AMT_DISCOUNT: 3000
      })
    ).toEqual({
      noCoupon: 'C001',
      nmCoupon: '테스트 쿠폰',
      ddApplyEnd: '20261231',
      amtDiscount: 3000
    })
    expect(toCoupon({ DD_APPLY_END: new Date(2026, 11, 31), AMT_DISCOUNT: null })).toEqual({
      noCoupon: '',
      nmCoupon: '',
      ddApplyEnd: '20261231',
      amtDiscount: 0
    })
  })
})

describe('IF-EPS-001 요청 매핑', () => {
  const now = new Date(2026, 8, 26, 9, 5, 7, 42)

  it('시각 형식', () => {
    expect(formatDateTime(now)).toBe('20260926090507')
    expect(formatTimeStamp(now)).toBe('20260926090507.042')
  })

  it('URL · Header · Body', () => {
    const req = buildEpsRequest({
      serverUrl: 'http://example.invalid/',
      prdPrcId: 'P001',
      prdAgmtId: null,
      couponNo: null,
      stbId: 'STB-TEST',
      now
    })
    expect(req.url).toBe('http://example.invalid/eps/v5/payment/product/P001?method=POST')
    expect(req.headers).toEqual({
      'Content-Type': 'application/json',
      Api_Key: '',
      Auth_Val: '',
      Client_IP: '',
      Referer: '',
      Client_ID: 'STB-TEST',
      TimeStamp: '20260926090507.042',
      Trace: 'IPTV'
    })
    expect(req.body).toMatchObject({
      if: 'IF-EPS-001',
      ver: '5.0',
      ui_name: 'BTVUH2V500',
      client_name: null,
      response_format: 'json',
      stb_id: 'STB-TEST',
      requestDateTime: '20260926090507',
      prdAgmtId: null,
      useCoupon: false,
      couponNo: null,
      paymentType: null,
      ocbAmount: 0,
      track_id: ''
    })
    expect(req.body).not.toHaveProperty('mac')
    expect(req.body).not.toHaveProperty('contentId')
  })

  it('약정 선택 시 prdAgmtId 전달', () => {
    const req = buildEpsRequest({
      serverUrl: 'http://example.invalid',
      prdPrcId: 'P001',
      prdAgmtId: 'AG12',
      couponNo: null,
      stbId: 'S',
      now
    })
    expect(req.body.prdAgmtId).toBe('AG12')
  })

  it('쿠폰 적용: useCoupon true / couponNo = NO_COUPON (R5.8)', () => {
    const req = buildEpsRequest({
      serverUrl: 'http://example.invalid',
      prdPrcId: 'P001',
      prdAgmtId: null,
      couponNo: 'C001',
      stbId: 'S',
      now
    })
    expect(req.body.useCoupon).toBe(true)
    expect(req.body.couponNo).toBe('C001')
  })

  it('쿠폰 미적용: useCoupon false / couponNo null (빈 값도 미적용)', () => {
    for (const couponNo of [null, '']) {
      const req = buildEpsRequest({
        serverUrl: 'http://example.invalid',
        prdPrcId: 'P001',
        prdAgmtId: null,
        couponNo,
        stbId: 'S',
        now
      })
      expect(req.body.useCoupon).toBe(false)
      expect(req.body.couponNo).toBeNull()
    }
  })

  it('응답 파싱', () => {
    expect(parseEpsResponse('{"result":"0000","reason":"ok"}')).toEqual({
      result: '0000',
      reason: 'ok'
    })
    expect(parseEpsResponse('{"result":"9999"}')).toEqual({ result: '9999', reason: '' })
    expect(parseEpsResponse('<html>')).toBeNull()
    expect(parseEpsResponse('{}')).toBeNull()
  })
})
