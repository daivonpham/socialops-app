import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceDto,
  WorkspaceMemberDto,
  UpdateWorkspaceMemberInput,
  WorkspaceMemberBrandInput,
  AccessOptionBrandDto,
  BrandAccessInput,
  InvitationPreviewDto,
  MyInvitationDto,
  InviteWorkspaceMemberInput,
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

export async function inviteWorkspaceMember({ workspaceId, ...body }: InviteWorkspaceMemberInput) {
  await apiClient.post(`/workspaces/${workspaceId}/invitations`, body)
}

export async function getMemberAccessOptions(workspaceId: string) {
  const { data } = await apiClient.get<CommonApiResponse<AccessOptionBrandDto[]>>(
    `/workspaces/${workspaceId}/access-options`,
  )
  return data.data
}

export async function updateWorkspaceMemberAccess(input: {
  workspaceId: string
  memberId: string
  brands: BrandAccessInput[]
}) {
  const { data } = await apiClient.put<CommonApiResponse<WorkspaceMemberDto>>(
    `/workspaces/${input.workspaceId}/members/${input.memberId}/access`,
    { brands: input.brands },
  )
  return data.data
}

export async function getInvitationPreview(token: string) {
  const { data } = await apiClient.get<CommonApiResponse<InvitationPreviewDto>>(
    '/invitations/preview',
    { params: { token } },
  )
  return data.data
}

export async function acceptInvitation(token: string) {
  const { data } = await apiClient.post<CommonApiResponse<{ workspaceId: string }>>(
    '/invitations/accept',
    { token },
  )
  return data.data
}

export async function declineInvitation(token: string) {
  await apiClient.post('/invitations/decline', { token })
}

export async function getMyInvitations() {
  const { data } = await apiClient.get<CommonApiResponse<MyInvitationDto[]>>('/invitations/mine')
  return data.data
}

export async function acceptInvitationById(invitationId: string) {
  const { data } = await apiClient.post<CommonApiResponse<{ workspaceId: string }>>(
    `/invitations/${invitationId}/accept`,
  )
  return data.data
}

export async function declineInvitationById(invitationId: string) {
  await apiClient.post(`/invitations/${invitationId}/decline`)
}
