export interface WorkspaceDto {
  id: string
  name: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

export type CreateWorkspaceInput = { name: string }
export type UpdateWorkspaceInput = { workspaceId: string; name: string }

export type WorkspaceMemberRole = WorkspaceDto['role']
export interface WorkspaceMemberDto {
  id: string
  userId: string
  email: string
  displayName: string
  role: WorkspaceMemberRole
  avatarUrl: string | null
  brandIds: string[]
  /** Empty for owners and admins, who always see every Brand and Page. */
  brands: MemberBrandAccessDto[]
  createdAt: string
}

export type MemberBrandAccessDto = {
  brandId: string
  pageAccess: 'ALL' | 'SELECTED'
  pageIds: string[]
}

/** `pageIds: null` grants every Page of the Brand. */
export type BrandAccessInput = { brandId: string; pageIds: string[] | null }

export type AccessOptionBrandDto = {
  id: string
  name: string
  avatarUrl: string | null
  pages: Array<{
    id: string
    name: string
    provider: 'facebook' | 'tiktok'
    status: string
    avatarUrl?: string
  }>
}

export type InviteWorkspaceMemberInput = {
  workspaceId: string
  email: string
  role: Exclude<WorkspaceMemberRole, 'owner'>
  brands: BrandAccessInput[]
}

/** A pending invitation addressed to the signed-in user, shown in the in-app inbox. */
export type MyInvitationDto = {
  id: string
  workspaceId: string
  workspaceName: string
  inviterName: string
  role: Exclude<WorkspaceMemberRole, 'owner'>
  expiresAt: string
  createdAt: string
}

export type InvitationPreviewDto = {
  workspaceName: string
  inviterName: string
  email: string
  role: Exclude<WorkspaceMemberRole, 'owner'>
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED' | 'EXPIRED'
  expiresAt: string
  accountExists: boolean
}
export type UpdateWorkspaceMemberInput = {
  workspaceId: string
  memberId: string
  role: Exclude<WorkspaceMemberRole, 'owner'>
}
export type WorkspaceMemberBrandInput = {
  workspaceId: string
  memberId: string
  brandId: string
}
