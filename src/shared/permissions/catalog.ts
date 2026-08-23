/**
 * Permission catalog — the single source of permission keys for the whole app.
 * Keys are string constants shared with the backend contract; keep them
 * identical to the server's names so drift is visible. Features never define
 * new keys — they only combine these into access policies.
 */
export const PERMISSIONS = {
  CHANNELS_MANAGE: { key: 'channels.manage', labelKey: 'permissions.manageChannels' },
  PUBLISHING_PUBLISH: { key: 'publishing.publish', labelKey: 'permissions.publishContent' },
  ANALYTICS_VIEW: { key: 'analytics.view', labelKey: 'permissions.viewAnalytics' },
  REPORTS_VIEW: { key: 'reports.view', labelKey: 'permissions.viewReports' },
  MEMBERS_VIEW: { key: 'members.view', labelKey: 'permissions.viewMembers' },
  SETTINGS_VIEW: { key: 'settings.view', labelKey: 'permissions.viewSettings' },
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]['key']
