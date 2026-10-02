// IF-EPS-001 상품 구매 요청 — Header · Body 매핑, Response 해석 (electron 의존 없음 — 단위 테스트 대상)
// spec 4. 설계 › IF-EPS-001 요청 매핑 / Response 처리

export const SUCCESS_RESULT = '0000'
export const SUCCESS_MESSAGE = '구매가 완료되었습니다.'
export const NETWORK_FAIL_MESSAGE = '구매 요청에 실패했습니다.'

export interface EpsRequestInput {
  serverUrl: string
  prdPrcId: string
  stbId: string
  useBcash: boolean
  /** 적용 쿠폰번호 (`NO_COUPON`) — null/생략 = 쿠폰 미적용 (2차, R6.7) */
  couponNo?: string | null
  now: Date
}

export interface EpsRequest {
  url: string
  headers: Record<string, string>
  body: Record<string, unknown>
}

const pad = (n: number, len = 2): string => String(n).padStart(len, '0')

/** `YYYYMMDDHH24MISS` (로컬 시각) */
export function formatDateTime(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

/** Header TimeStamp `YYYYMMDDHHmmss.SSS` (샘플 형식) */
export function formatTimeStamp(d: Date): string {
  return `${formatDateTime(d)}.${pad(d.getMilliseconds(), 3)}`
}

export function buildEpsRequest(input: EpsRequestInput): EpsRequest {
  const base = input.serverUrl.trim().replace(/\/+$/, '')
  const url = `${base}/eps/v5/payment/product/${encodeURIComponent(input.prdPrcId)}?method=POST`

  // 값이 없는 Header 는 빈 값으로 전송 (Host 는 HTTP 클라이언트가 자동 설정)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Api_Key: '',
    Auth_Val: '',
    Client_ID: input.stbId,
    Client_IP: '',
    TimeStamp: formatTimeStamp(input.now),
    Trace: 'IPTV',
    Referer: ''
  }

  const couponNo = input.couponNo || null

  // mac 은 규격상 "Mac Address 없을 경우 생략"
  const body: Record<string, unknown> = {
    if: 'IF-EPS-001',
    ver: '5.0',
    ui_name: 'BTVUH2V500',
    client_name: null,
    response_format: 'json',
    stb_id: input.stbId,
    requestDateTime: formatDateTime(input.now),
    useCoupon: couponNo !== null,
    couponNo,
    useBcash: input.useBcash,
    useNewBpoint: false,
    useOcb: false,
    ocbAmount: 0,
    ocbSequence: 0,
    ocbPassword: null,
    useTmembership: false,
    useUniverseDiscount: false,
    useUniversePoint: false,
    useTvpoint: false,
    tvpointAmount: 0,
    paymentType: null, // 1차: 청구서
    ifSequence: null,
    totalAmount: null,
    phoneData: null,
    track_id: '',
    session_id: '',
    cw_call_id: ''
  }

  return { url, headers, body }
}

/** 응답 reason 의 `\n`(문자열 역슬래시 n) 을 줄바꿈으로 */
export function formatReason(reason: string): string {
  return reason.replace(/\\n/g, '\n')
}

/** Response → [D] 구매완료 메시지. 성공 = result "0000" */
export function interpretResponse(json: unknown): { ok: boolean; message: string } {
  if (!json || typeof json !== 'object') return { ok: false, message: NETWORK_FAIL_MESSAGE }
  const { result, reason } = json as { result?: unknown; reason?: unknown }
  if (String(result ?? '') === SUCCESS_RESULT) return { ok: true, message: SUCCESS_MESSAGE }
  const text = typeof reason === 'string' ? formatReason(reason).trim() : ''
  return { ok: false, message: text || NETWORK_FAIL_MESSAGE }
}
