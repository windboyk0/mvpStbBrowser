import type { Settings } from './settings'

// Oracle 접속 헬퍼 — oracledb Thin 모드 (Oracle Instant Client 불필요, initOracleClient 호출하지 않음)
// oracledb 는 타입 정의가 없어 이 모듈에서 쓰는 API 만 최소 타입으로 선언한다

type BindValue = string | number | null
export type Binds = Record<string, BindValue>

interface OracleConnection {
  execute<T>(sql: string, binds: Binds, options: { outFormat: number }): Promise<{ rows?: T[] }>
  close(): Promise<void>
}

interface OracleDb {
  OUT_FORMAT_OBJECT: number
  getConnection(config: {
    user: string
    password: string
    connectString: string
  }): Promise<OracleConnection>
}

// main 번들에서 external 로 남는 네이티브 의존성 — 런타임 require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const oracledb = require('oracledb') as OracleDb

/** Query 파일 문자열 정리 — 끝의 `;` 제거 (oracledb 는 문장 종결자를 허용하지 않음) */
export function toStatement(sql: string): string {
  return sql.trim().replace(/;\s*$/, '')
}

/** 한 번 접속해 fn 실행 후 접속 종료 */
export async function withConnection<T>(
  settings: Settings,
  fn: (query: <R>(sql: string, binds: Binds) => Promise<R[]>) => Promise<T>
): Promise<T> {
  const conn = await oracledb.getConnection({
    user: settings.dbUser,
    password: settings.dbPassword,
    connectString: settings.dbConnectString
  })
  try {
    return await fn(async <R>(sql: string, binds: Binds) => {
      const result = await conn.execute<R>(toStatement(sql), binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      })
      return result.rows ?? []
    })
  } finally {
    await conn.close().catch(() => undefined)
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
