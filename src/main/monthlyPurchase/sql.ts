// Query 파일(query_*.sql) → 실행 가능한 SQL 문 분리
// - 파일 맨 앞 설명 주석 제거
// - `/* ===== 목록 ===== */` 같은 구분 주석이 있으면 그 기준으로 문을 나눈다 (목록 / 전체 건수)
// - 문 끝의 `;` 제거 (oracledb 는 `;` 를 허용하지 않음)

const HEADER_COMMENT = /^\s*\/\*[\s\S]*?\*\//
const SECTION_MARKER = /\/\*\s*=====[\s\S]*?=====\s*\*\//

export function splitStatements(fileText: string): string[] {
  const body = fileText.replace(/^\uFEFF/, '').replace(HEADER_COMMENT, '')
  return body
    .split(SECTION_MARKER)
    .map((part) => part.trim().replace(/;\s*$/, '').trim())
    .filter((part) => part !== '')
}
