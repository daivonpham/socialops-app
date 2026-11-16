/**
 * Text as search compares it: lower case, Vietnamese marks and "đ" dropped, spaces collapsed, so
 * "tieng viet", "Tiếng Việt" and "TIẾNG  VIỆT" are the same.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Mark}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Whether `text` contains `query`, with or without Vietnamese marks. An empty query matches all. */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  const needle = normalizeSearch(query)
  return !needle || normalizeSearch(text ?? '').includes(needle)
}
