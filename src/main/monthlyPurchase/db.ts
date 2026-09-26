import { createRequire } from 'module'
import type { MonthlyPurchaseSettings } from './settings'

// oracledb (node-oracledb, Thin 모드 기본) — 타입 패키지가 없어 이 모듈에서 쓰는 부분만 선언한다
interface OracleConnection {
  execute<T>(
    sql: string,
    binds: Record<string, unknown>,
    options: { outFormat: number }
  ): Promise<{ rows?: T[] }>
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

const nodeRequire = createRequire(__filename)
let oracledb: OracleDb | null = null

function getOracleDb(): OracleDb {
  if (!oracledb) oracledb = nodeRequire('oracledb') as OracleDb
  return oracledb
}

export type Row = Record<string, unknown>

export interface DbSession {
  query(sql: string, binds: Record<string, unknown>): Promise<Row[]>
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
      }
    })
  } finally {
    await conn.close().catch(() => undefined)
  }
}
