import type { WorkspaceDto } from '@/features/workspaces'
import { PERMISSIONS } from '@/shared/permissions'

export function hasWorkspaceRouteAccess(
  role: WorkspaceDto['role'] | undefined,
  permission: string,
) {
  if (permission === PERMISSIONS.MEMBERS_VIEW.key) return role !== undefined && role !== 'viewer'
  if (permission === PERMISSIONS.SETTINGS_VIEW.key) return role !== undefined && role !== 'viewer'
  return false
}
