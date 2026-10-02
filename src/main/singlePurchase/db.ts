import type { Settings } from './settings'

// Oracle 접속 헬퍼 — oracledb Thin 모드 (Oracle Instant Client 불필요, initOracleClient 호출하지 않음)
// oracledb 는 타입 정의가 없어 이 모듈에서 쓰는 API 만 최소 타입으로 선언한다

type BindValue = string | number | null
export type Binds = Record<string, BindValue>

interface OutBind {
  type: number
  dir: number
}

interface OracleResultSet {
  getRows(count: number): Promise<unknown[]>
  close(): Promise<void>
}

interface OracleConnection {
  execute<T>(
    sql: string,
    binds: Record<string, BindValue | OutBind>,
    options: { outFormat: number }
  ): Promise<{ rows?: T[]; outBinds?: Record<string, unknown> }>
  close(): Promise<void>
}

interface OracleDb {
  OUT_FORMAT_OBJECT: number
  CURSOR: number
  BIND_OUT: number
  getConnection(config: {
    user: string
    password: string
    connectString: string
  }): Promise<OracleConnection>
}

// main 번들에서 external 로 남는 네이티브 의존성 — 런타임 require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const oracledb = require('oracledb') as OracleDb

const CURSOR_FETCH_SIZE = 100

/** Query 파일 문자열 정리 — 끝의 `;` 제거 (oracledb 는 문장 종결자를 허용하지 않음) */
export function toStatement(sql: string): string {
  return sql.trim().replace(/;\s*$/, '')
}

export interface Db {
  /** SQL 문 1개 실행 (끝의 `;` 제거) */
  query: <R>(sql: string, binds: Binds) => Promise<R[]>
  /**
   * PL/SQL 익명 블록 실행 — 끝의 `END;` 세미콜론을 제거하지 않는다 (제거 시 PLS-00103).
   * OUT REF CURSOR 바인드 `cursorName` 의 ResultSet 을 끝까지 읽고 닫는다
   */
  queryCursor: <R>(plsql: string, binds: Binds, cursorName: string) => Promise<R[]>
}

/** 한 번 접속해 fn 실행 후 접속 종료 */
export async function withConnection<T>(
  settings: Settings,
  fn: (query: Db['query'], db: Db) => Promise<T>
): Promise<T> {
  const conn = await oracledb.getConnection({
    user: settings.dbUser,
    password: settings.dbPassword,
    connectString: settings.dbConnectString
  })
  const options = { outFormat: oracledb.OUT_FORMAT_OBJECT }
  try {
    const db: Db = {
      query: async <R>(sql: string, binds: Binds) => {
        const result = await conn.execute<R>(toStatement(sql), binds, options)
        return result.rows ?? []
      },
      queryCursor: async <R>(plsql: string, binds: Binds, cursorName: string) => {
        const result = await conn.execute(
          plsql.trim(),
          { ...binds, [cursorName]: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
          options
        )
        const rs = result.outBinds?.[cursorName] as OracleResultSet | null | undefined
        if (!rs) return []
        try {
          const rows: R[] = []
          for (;;) {
            const chunk = (await rs.getRows(CURSOR_FETCH_SIZE)) as R[]
            rows.push(...chunk)
            if (chunk.length < CURSOR_FETCH_SIZE) return rows
          }
        } finally {
          await rs.close().catch(() => undefined)
        }
      }
    }
    return await fn(db.query, db)
  } finally {
    await conn.close().catch(() => undefined)
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
