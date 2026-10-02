import { createRequire } from 'module'
import type { MonthlyPurchaseSettings } from './settings'

// oracledb (node-oracledb, Thin 모드 기본) — 타입 패키지가 없어 이 모듈에서 쓰는 부분만 선언한다
interface OracleResultSet<T> {
  getRows(numRows: number): Promise<T[]>
  close(): Promise<void>
}

interface OracleConnection {
  execute<T>(
    sql: string,
    binds: Record<string, unknown>,
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

const nodeRequire = createRequire(__filename)
let oracledb: OracleDb | null = null

function getOracleDb(): OracleDb {
  if (!oracledb) oracledb = nodeRequire('oracledb') as OracleDb
  return oracledb
}

export type Row = Record<string, unknown>

// OUT REF CURSOR 를 끝까지 읽을 때 한 번에 가져오는 행 수
const CURSOR_FETCH_ROWS = 100

export interface DbSession {
  query(sql: string, binds: Record<string, unknown>): Promise<Row[]>
  /** PL/SQL 실행 → OUT REF CURSOR(`cursorBind`) 결과 전체 (끝까지 읽은 뒤 닫는다) */
  queryCursor(sql: string, binds: Record<string, unknown>, cursorBind: string): Promise<Row[]>
}

/** 접속 → 작업 → 해제 (요청마다 1회 접속) */
export async function withConnection<T>(
  settings: MonthlyPurchaseSettings,
  work: (session: DbSession) => Promise<T>
): Promise<T> {
  const db = getOracleDb()
  const conn = await db.getConnection({
    user: settings.dbUser,
    password: settings.dbPassword,
    connectString: settings.dbConnectString
  })
  try {
    return await work({
      async query(sql, binds) {
        const result = await conn.execute<Row>(sql, binds, { outFormat: db.OUT_FORMAT_OBJECT })
        return result.rows ?? []
      },
      async queryCursor(sql, binds, cursorBind) {
        const result = await conn.execute<Row>(
          sql,
          { ...binds, [cursorBind]: { type: db.CURSOR, dir: db.BIND_OUT } },
          { outFormat: db.OUT_FORMAT_OBJECT }
        )
        const cursor = result.outBinds?.[cursorBind] as OracleResultSet<Row> | null | undefined
        if (!cursor) return []
        try {
          const rows: Row[] = []
          for (;;) {
            const batch = await cursor.getRows(CURSOR_FETCH_ROWS)
            rows.push(...batch)
            if (batch.length < CURSOR_FETCH_ROWS) return rows
          }
        } finally {
          await cursor.close().catch(() => undefined)
        }
      }
    })
  } finally {
    await conn.close().catch(() => undefined)
  }
}
