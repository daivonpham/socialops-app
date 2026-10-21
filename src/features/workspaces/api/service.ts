import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceDto,
  WorkspaceMemberDto,
  UpdateWorkspaceMemberInput,
  WorkspaceMemberBrandInput,
} from './types'

export async function getWorkspaces() {
  const { data } = await apiClient.get<CommonApiResponse<WorkspaceDto[]>>('/workspaces')
  return data
}

export async function createWorkspace(input: CreateWorkspaceInput) {
  const { data } = await apiClient.post<CommonApiResponse<WorkspaceDto>>('/workspaces', input, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  return data.data
}

export async function updateWorkspace({ workspaceId, ...input }: UpdateWorkspaceInput) {
  const { data } = await apiClient.patch<CommonApiResponse<WorkspaceDto>>(
    `/workspaces/${workspaceId}`,
    input,
  )
  return data.data
}

export async function deleteWorkspace(workspaceId: string) {
  await apiClient.delete(`/workspaces/${workspaceId}`)
}

export async function getWorkspaceMembers(workspaceId: string, page: number) {
  const { data } = await apiClient.get<CommonApiResponse<WorkspaceMemberDto[]>>(
    `/workspaces/${workspaceId}/members`,
    { params: { page, limit: 20 } },
  )
  return data
}

export async function updateWorkspaceMember({
  workspaceId,
  memberId,
  role,
}: UpdateWorkspaceMemberInput) {
  const { data } = await apiClient.patch<CommonApiResponse<WorkspaceMemberDto>>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    { role },
  )
  return data.data
}

export async function deleteWorkspaceMember({
  workspaceId,
  memberId,
}: {
  workspaceId: string
  memberId: string
}) {
  await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`)
}

export async function assignWorkspaceMemberBrand({
  workspaceId,
  memberId,
  brandId,
}: WorkspaceMemberBrandInput) {
  await apiClient.put(`/workspaces/${workspaceId}/members/${memberId}/brands/${brandId}`, {})
}

export async function revokeWorkspaceMemberBrand({
  workspaceId,
  memberId,
  brandId,
}: WorkspaceMemberBrandInput) {
  await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}/brands/${brandId}`)
}

export async function inviteWorkspaceMember(input: {
  workspaceId: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
}) {
  await apiClient.post(`/workspaces/${input.workspaceId}/invitations`, {
    email: input.email,
    role: input.role,
  })
}
