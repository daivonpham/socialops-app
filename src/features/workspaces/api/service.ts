import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { WorkspaceDto } from './types'

export async function getWorkspaces() {
  const { data } = await apiClient.get<CommonApiResponse<WorkspaceDto[]>>('/workspaces')
  return data
}
