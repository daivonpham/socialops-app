import { useMutation, useQuery } from '@tanstack/react-query'
import { createWorkspace, deleteWorkspace, getWorkspaces, updateWorkspace } from './service'

export const WORKSPACE_QUERY_KEYS = {
  list: () => ['workspaces'] as const,
}

export function useWorkspaces() {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEYS.list(),
    queryFn: getWorkspaces,
    select: (response) => response.data,
  })
}

export function useCreateWorkspace() {
  return useMutation({ mutationFn: createWorkspace })
}

export function useUpdateWorkspace() {
  return useMutation({ mutationFn: updateWorkspace })
}

export function useDeleteWorkspace() {
  return useMutation({ mutationFn: deleteWorkspace })
}
