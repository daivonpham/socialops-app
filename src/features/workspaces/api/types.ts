export interface WorkspaceDto {
  id: string
  name: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

export type CreateWorkspaceInput = { name: string }
export type UpdateWorkspaceInput = { workspaceId: string; name: string }
