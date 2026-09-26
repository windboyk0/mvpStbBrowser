import type { IpcMain } from 'electron'
import { readSettings, hasRequiredSettings, type MonthlyPurchaseSettings } from './settings'
import { withConnection, type Row } from './db'
import {
  PRODUCT_TYPES,
  productListSql,
  agreementListSql,
  stbIdSql,
  type ProductType
} from './queries'
import { buildEpsRequest, callEps, type PrdAgmtId } from './eps'

// IPC 계약 — renderer `screens/monthlyPurchase/types.ts` 와 같은 형식 (코드 공유 없이 형식만 맞춘다)
const PAGE_SIZE = 10

interface SearchPayload {
  type?: string
  prdNm?: string
  page?: number
}

interface AgreementsPayload {
  prdPrcId?: string
}

interface PurchasePayload {
  prdPrcId?: string
  prdAgmtId?: PrdAgmtId
}

type Result<T> = ({ ok: true } & T) | { ok: false; error: string }

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function toProduct(row: Row): Record<string, string> {
  return {
    gubun: str(row.GUBUN),
    idProduct: str(row.ID_PRODUCT),
    nmProduct: str(row.NM_PRODUCT),
    idPackage: str(row.ID_PACKAGE),
    idProductPar: str(row.ID_PRODUCT_PAR),
    tpPpm: str(row.TP_PPM),
    amtPrice: str(row.AMT_PRICE),
    ppmFreeJoinPerdCd: str(row.PPM_FREE_JOIN_PERD_CD),
    agmtMndtYn: str(row.AGMT_MNDT_YN)
  }
}

async function search(
  payload: SearchPayload
): Promise<Result<{ rows: Record<string, string>[]; total: number }>> {
  try {
    const type: ProductType = PRODUCT_TYPES.includes(payload?.type as ProductType)
      ? (payload.type as ProductType)
      : 'ALL'
    const page = Math.max(1, Math.floor(Number(payload?.page) || 1))
    const prdNm = (payload?.prdNm ?? '').trim()
    const settings = readSettings()
    const sql = productListSql(type)
    const binds = { svcMgmtNo: settings.svcMgmtNo, prdNm: prdNm === '' ? null : prdNm }

    return await withConnection(settings, async (db) => {
      const listRows = await db.query(sql.list, {
        ...binds,
        offset: (page - 1) * PAGE_SIZE,
        pageSize: PAGE_SIZE
      })
      const countRows = await db.query(sql.count, binds)
      return {
        ok: true as const,
        rows: listRows.map(toProduct),
        total: Number(countRows[0]?.TOTAL_CNT ?? 0)
      }
    })
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
}

async function agreements(
  payload: AgreementsPayload
): Promise<Result<{ rows: { prdAgmtId: PrdAgmtId; months: number; amtSale: number }[] }>> {
  try {
    const prdPrcId = str(payload?.prdPrcId)
    const settings = readSettings()
    return await withConnection(settings, async (db) => {
      const rows = await db.query(agreementListSql(), { prdPrcId })
      return {
        ok: true as const,
        rows: rows.map((row) => ({
          prdAgmtId: (row.PRD_AGMT_ID ?? null) as PrdAgmtId,
          months: Number(row.PER_MM_CNTR),
          amtSale: Number(row.AMT_SALE)
        }))
      }
    })
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
}

/** R3 — 결과: 응답 있음(response) / 오류 메시지(error) */
type PurchaseResult =
  { kind: 'response'; result: string; reason: string } | { kind: 'error'; message: string }

async function purchase(payload: PurchasePayload): Promise<PurchaseResult> {
  let settings: MonthlyPurchaseSettings
  let stbId: string
  try {
    const current = readSettings()
    settings = current
    const rows = await withConnection(current, (db) =>
      db.query(stbIdSql(), { svcMgmtNo: current.svcMgmtNo })
    )
    stbId = str(rows[0]?.STB_ID)
  } catch (err) {
    return { kind: 'error', message: `조회에 실패했습니다. (${errorMessage(err)})` }
  }
  if (!stbId) return { kind: 'error', message: '서비스관리번호에 해당하는 STB가 없습니다.' }

  try {
    const request = buildEpsRequest({
      serverUrl: settings.serverUrl,
      prdPrcId: str(payload?.prdPrcId),
      prdAgmtId: payload?.prdAgmtId ?? null,
      stbId,
      now: new Date()
    })
    const response = await callEps(request)
    if (!response) return { kind: 'error', message: '구매 요청에 실패했습니다.' }
    return { kind: 'response', ...response }
  } catch (err) {
    console.error('[monthlyPurchase] IF-EPS-001 요청 실패', err)
    return { kind: 'error', message: '구매 요청에 실패했습니다.' }
  }
}

export function register(ipcMain: IpcMain): void {
  ipcMain.handle('monthlyPurchase:checkSettings', () => ({ ok: hasRequiredSettings() }))
  ipcMain.handle('monthlyPurchase:search', (_e, payload: SearchPayload) => search(payload))
  ipcMain.handle('monthlyPurchase:agreements', (_e, payload: AgreementsPayload) =>
    agreements(payload)
  )
  ipcMain.handle('monthlyPurchase:purchase', (_e, payload: PurchasePayload) => purchase(payload))
}
