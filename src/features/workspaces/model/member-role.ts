import type { StatusTone } from '@/shared/ui'
import type { BrandAccessInput, WorkspaceMemberDto, WorkspaceMemberRole } from '../api'

export type InvitableRole = Exclude<WorkspaceMemberRole, 'owner'>

/** Single source for role order and presentation. Labels live in i18n `roles.*`. */
export const MEMBER_ROLE_TONE: Record<WorkspaceMemberRole, StatusTone> = {
  owner: 'brand',
  full_access: 'brand',
  admin: 'info',
  editor: 'success',
  viewer: 'neutral',
}

/** Owner and Full access always see every Brand and Page; access is not configurable. */
export function hasFullAccess(role: WorkspaceMemberRole): boolean {
  return role === 'owner' || role === 'full_access'
}

/** Owner and Full access manage the whole Workspace (rename it, create or delete Brands). */
export function canManageWorkspace(role: WorkspaceMemberRole | undefined): boolean {
  return role === 'owner' || role === 'full_access'
}

/** Owner, Full access and Admin invite and manage members (an Admin within their scope). */
export function canManageMembers(role: WorkspaceMemberRole | undefined): boolean {
  return canManageWorkspace(role) || role === 'admin'
}

/** Roles the actor may grant: only the owner grants Full access. */
export function grantableRoles(actorRole: WorkspaceMemberRole | undefined): InvitableRole[] {
  return actorRole === 'owner'
    ? ['full_access', 'admin', 'editor', 'viewer']
    : ['admin', 'editor', 'viewer']
}

/** Every chosen Brand needs either all Pages or at least one selected Page. */
export function isAccessComplete(access: BrandAccessInput[]): boolean {
  return (
    access.length > 0 && access.every((item) => item.pageIds === null || item.pageIds.length > 0)
  )
}

/** Editable form of a member's current access. */
export function memberAccessInput(member: WorkspaceMemberDto): BrandAccessInput[] {
  return member.brands.map((brand) => ({
    brandId: brand.brandId,
    pageIds: brand.pageAccess === 'ALL' ? null : brand.pageIds,
  }))
}
