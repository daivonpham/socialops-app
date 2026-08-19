/**
 * Permission catalog — the single source of permission keys for the whole app.
 * Keys are string constants shared with the backend contract; keep them
 * identical to the server's names so drift is visible. Features never define
 * new keys — they only combine these into access policies.
 */
export const PERMISSIONS = {
  REPORTS_VIEW: { key: 'reports.view', label: 'View reports' },
  MEMBERS_VIEW: { key: 'members.view', label: 'View members' },
  SETTINGS_VIEW: { key: 'settings.view', label: 'View settings' },
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]['key']
