/**
 * Client-side permission checks are UX ONLY — they hide dead-end screens and
 * buttons. They are never a security control: anyone can call the API
 * directly, so the server re-authorizes every request per Brand
 * (frontend-admin-security/references/authorization.md).
 */
export function hasPermission(granted: readonly string[], key: string): boolean {
  return granted.includes(key)
}

export function allOf(granted: readonly string[], keys: readonly string[]): boolean {
  return keys.every((key) => hasPermission(granted, key))
}

export function anyOf(granted: readonly string[], keys: readonly string[]): boolean {
  return keys.some((key) => hasPermission(granted, key))
}
