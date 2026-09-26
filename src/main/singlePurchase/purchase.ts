import stbIdSql from './sql/stbId.sql?raw'
import { errorMessage, withConnection } from './db'
import { buildEpsRequest, interpretResponse, NETWORK_FAIL_MESSAGE } from './eps'
import { readSettings, type Settings } from './settings'
import type { PurchaseRequest, PurchaseResult } from './types'

// 구매 요청 — R4, R5.1 (query_stbId.sql 로 STB ID 조회 → IF-EPS-001)

const NO_STB_MESSAGE = '서비스관리번호에 해당하는 STB가 없습니다.'
const REQUEST_TIMEOUT_MS = 30_000

interface StbDbRow {
  STB_ID: string | number | null
}

/** STB ID 조회. 0건이면 null */
async function findStbId(settings: Settings): Promise<string | null> {
  const rows = await withConnection(settings, (query) =>
    query<StbDbRow>(stbIdSql, { svcMgmtNo: settings.svcMgmtNo })
  )
  const stbId = rows[0]?.STB_ID
  return stbId === null || stbId === undefined || String(stbId) === '' ? null : String(stbId)
}

export async function purchase(payload: unknown): Promise<PurchaseResult> {
  const req = payload as Partial<PurchaseRequest> | undefined
  const prdPrcId = typeof req?.prdPrcId === 'string' ? req.prdPrcId.trim() : ''
  if (!prdPrcId) return { ok: false, message: NETWORK_FAIL_MESSAGE }

  let settings: Settings
  let stbId: string | null
  try {
    settings = readSettings()
    stbId = await findStbId(settings)
  } catch (err) {
    return { ok: false, message: `조회에 실패했습니다. (${errorMessage(err)})` }
  }
  if (!stbId) return { ok: false, message: NO_STB_MESSAGE }

  const { url, headers, body } = buildEpsRequest({
    serverUrl: settings.serverUrl,
    prdPrcId,
    stbId,
    useBcash: req?.useBcash === true,
    now: new Date()
  })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
    const json: unknown = await res.json().catch(() => null)
    return interpretResponse(json)
  } catch (err) {
    console.error('[singlePurchase] IF-EPS-001 요청 실패', errorMessage(err))
    return { ok: false, message: NETWORK_FAIL_MESSAGE }
  }
}
