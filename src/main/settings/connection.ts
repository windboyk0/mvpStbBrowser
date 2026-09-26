import oracledb from 'oracledb'

// 원본: vibeContext/spec/120_settings/design/query_stbId.sql (oracledb 는 끝의 ; 를 허용하지 않아 제외)
const QUERY_STB_ID = `SELECT  STB_ID
FROM    STB
WHERE   USER_SERVICE_NUM = :svcMgmtNo`

export interface ConnectionParams {
  svcMgmtNo: string
  dbConnectString: string
  dbUser: string
  dbPassword: string
}

/** R3 — 매번 새로 접속(oracledb Thin) → STB ID 조회 → 접속 종료. 0건이면 undefined */
export async function queryStbId(params: ConnectionParams): Promise<string | undefined> {
  const conn = await oracledb.getConnection({
    user: params.dbUser,
    password: params.dbPassword,
    connectString: params.dbConnectString
  })
  try {
    const result = await conn.execute<{ STB_ID: unknown }>(
      QUERY_STB_ID,
      { svcMgmtNo: params.svcMgmtNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
    )
    const row = result.rows?.[0]
    return row && row.STB_ID != null ? String(row.STB_ID) : undefined
  } finally {
    await conn.close().catch(() => undefined)
  }
}
