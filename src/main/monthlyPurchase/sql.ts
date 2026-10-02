// Query 파일(query_*.sql) → 실행 가능한 SQL 문 분리
// - 파일 맨 앞 설명 주석 제거
// - `/* ===== 목록 ===== */` 같은 구분 주석이 있으면 그 기준으로 문을 나눈다 (목록 / 전체 건수)
// - 문 끝의 `;` 제거 (oracledb 는 SQL 문 끝 `;` 를 허용하지 않음)
// - PL/SQL 블록(query_couponList.sql)은 분리 · `;` 제거 없이 plsqlBlock 사용 (`END;` 필수)

const HEADER_COMMENT = /^\s*\/\*[\s\S]*?\*\//
const SECTION_MARKER = /\/\*\s*=====[\s\S]*?=====\s*\*\//

/** 파일 맨 앞 설명 주석만 제거 (BOM 포함) */
export function stripHeader(fileText: string): string {
  return fileText
    .replace(/^\uFEFF/, '')
    .replace(HEADER_COMMENT, '')
    .trim()
}

export function splitStatements(fileText: string): string[] {
  return stripHeader(fileText)
    .split(SECTION_MARKER)
    .map((part) => part.trim().replace(/;\s*$/, '').trim())
    .filter((part) => part !== '')
}

/** PL/SQL 익명 블록 (`DECLARE … END;`) — 헤더 주석만 제거, 끝 `END;` 의 `;` 는 유지 (제거 시 PLS-00103) */
export function plsqlBlock(fileText: string): string {
  return stripHeader(fileText)
}
