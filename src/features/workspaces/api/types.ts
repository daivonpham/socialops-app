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
  brandIds: string[]
  createdAt: string
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
