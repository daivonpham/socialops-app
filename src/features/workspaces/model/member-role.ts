import type { StatusTone } from '@/shared/ui'
import type { BrandAccessInput, WorkspaceMemberDto, WorkspaceMemberRole } from '../api'

export type InvitableRole = Exclude<WorkspaceMemberRole, 'owner'>

/** Single source for role order and presentation. Labels live in i18n `roles.*`. */
export const MEMBER_ROLE_TONE: Record<WorkspaceMemberRole, StatusTone> = {
  owner: 'brand',
  admin: 'info',
  editor: 'success',
  viewer: 'neutral',
}

/** Owners and admins always see every Brand and Page; access is not configurable. */
export function hasFullAccess(role: WorkspaceMemberRole): boolean {
  return role === 'owner' || role === 'admin'
}

/** Roles the actor may grant: only an owner can grant admin. */
export function grantableRoles(actorRole: WorkspaceMemberRole | undefined): InvitableRole[] {
  return actorRole === 'owner' ? ['admin', 'editor', 'viewer'] : ['editor', 'viewer']
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
