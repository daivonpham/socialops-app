import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
  getWorkspaceMembers,
  updateWorkspaceMember,
  deleteWorkspaceMember,
  assignWorkspaceMemberBrand,
  revokeWorkspaceMemberBrand,
  inviteWorkspaceMember,
} from './service'

export const WORKSPACE_QUERY_KEYS = {
  list: () => ['workspaces'] as const,
  members: (workspaceId: string | null, page: number) =>
    ['workspaces', workspaceId, 'members', page] as const,
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

export function useWorkspaceMembers(workspaceId: string | null, page: number) {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEYS.members(workspaceId, page),
    queryFn: () => getWorkspaceMembers(workspaceId!, page),
    enabled: Boolean(workspaceId),
  })
}

export function useUpdateWorkspaceMember() {
  return useMutation({ mutationFn: updateWorkspaceMember })
}

export function useDeleteWorkspaceMember() {
  return useMutation({ mutationFn: deleteWorkspaceMember })
}

export function useAssignWorkspaceMemberBrand() {
  return useMutation({ mutationFn: assignWorkspaceMemberBrand })
}

export function useRevokeWorkspaceMemberBrand() {
  return useMutation({ mutationFn: revokeWorkspaceMemberBrand })
}

export function useInviteWorkspaceMember() {
  return useMutation({ mutationFn: inviteWorkspaceMember })
}
