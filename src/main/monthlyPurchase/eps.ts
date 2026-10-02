// IF-EPS-001 구매 요청 (spec 4. 설계 › IF-EPS-001 요청 매핑)

export type PrdAgmtId = string | number | null

export interface EpsRequestInput {
  serverUrl: string
  prdPrcId: string
  prdAgmtId: PrdAgmtId
  /** 적용 쿠폰 NO_COUPON (R5.8) — 미적용 null */
  couponNo: string | null
  stbId: string
  now: Date
}

export interface EpsRequest {
  url: string
  headers: Record<string, string>
  body: Record<string, unknown>
}

const pad = (n: number, len = 2): string => String(n).padStart(len, '0')

/** YYYYMMDDHH24MISS (로컬 시각) */
export function formatDateTime(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

/** YYYYMMDDHHmmss.SSS (로컬 시각) — Header TimeStamp */
export function formatTimeStamp(d: Date): string {
  return `${formatDateTime(d)}.${pad(d.getMilliseconds(), 3)}`
}

export function buildEpsRequest(input: EpsRequestInput): EpsRequest {
  const base = input.serverUrl.replace(/\/+$/, '')
  const url = `${base}/eps/v5/payment/product/${encodeURIComponent(input.prdPrcId)}?method=POST`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Api_Key: '',
    Auth_Val: '',
    Client_IP: '',
    Referer: '',
    Client_ID: input.stbId,
    TimeStamp: formatTimeStamp(input.now),
    Trace: 'IPTV'
  }

  // R5.8 쿠폰 적용 시 true / NO_COUPON, 미적용 시 false / null
  const couponNo = input.couponNo ? input.couponNo : null

  const body: Record<string, unknown> = {
    if: 'IF-EPS-001',
    ver: '5.0',
    ui_name: 'BTVUH2V500',
    client_name: null,
    response_format: 'json',
    stb_id: input.stbId,
    requestDateTime: formatDateTime(input.now),
    prdAgmtId: input.prdAgmtId,
    useCoupon: couponNo !== null,
    couponNo,
    useBcash: false,
    useNewBpoint: false,
    useUniverseDiscount: false,
    useUniversePoint: false,
    useTmembership: false,
    useOcb: false,
    ocbAmount: 0,
    ocbSequence: 0,
    ocbPassword: null,
    useTvpoint: false,
    tvpointAmount: 0,
    paymentType: null,
    ifSequence: null,
    totalAmount: null,
    phoneData: null,
    track_id: '',
    session_id: '',
    cw_call_id: ''
  }

  return { url, headers, body }
}

export interface EpsResponse {
  result: string
  reason: string
}

/** 응답 본문 → result / reason. JSON 이 아니거나 result 가 없으면 null (통신 오류 취급) */
export function parseEpsResponse(text: string): EpsResponse | null {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return null
  }
  if (!json || typeof json !== 'object') return null
  const { result, reason } = json as Record<string, unknown>
  if (result === undefined || result === null) return null
  return { result: String(result), reason: reason == null ? '' : String(reason) }
}

const REQUEST_TIMEOUT_MS = 30_000

export async function callEps(request: EpsRequest): Promise<EpsResponse | null> {
  const res = await fetch(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(request.body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
  return parseEpsResponse(await res.text())
}
