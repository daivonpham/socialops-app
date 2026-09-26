import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceDto } from './types'

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
