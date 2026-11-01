import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  acceptInvitation,
  acceptInvitationById,
  declineInvitation,
  declineInvitationById,
  getMyInvitations,
  getInvitationPreview,
  getMemberAccessOptions,
  updateWorkspaceMemberAccess,
  leaveWorkspace,
} from './service'

export const WORKSPACE_QUERY_KEYS = {
  list: () => ['workspaces'] as const,
  members: (workspaceId: string | null, page: number) =>
    ['workspaces', workspaceId, 'members', page] as const,
  accessOptions: (workspaceId: string | null) =>
    ['workspaces', workspaceId, 'access-options'] as const,
  invitation: (token: string | null) => ['invitations', token] as const,
  myInvitations: () => ['invitations', 'mine'] as const,
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

export function useLeaveWorkspace() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: leaveWorkspace,
    onSuccess: () => client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.list() }),
  })
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

export function useMemberAccessOptions(workspaceId: string | null, enabled = true) {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEYS.accessOptions(workspaceId),
    queryFn: () => getMemberAccessOptions(workspaceId!),
    enabled: Boolean(workspaceId) && enabled,
  })
}

export function useUpdateWorkspaceMemberAccess() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updateWorkspaceMemberAccess,
    onSuccess: (_member, { workspaceId }) =>
      client.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] }),
  })
}

export function useInvitationPreview(token: string | null) {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEYS.invitation(token),
    queryFn: () => getInvitationPreview(token!),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useAcceptInvitation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.list() })
      void client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.myInvitations() })
    },
  })
}

export function useDeclineInvitation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.myInvitations() }),
  })
}

/**
 * Pending invitations for the signed-in user. Polled every minute (and on tab focus) so a new
 * invite shows up without a reload; there is no push channel yet.
 */
export function useMyInvitations() {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEYS.myInvitations(),
    queryFn: getMyInvitations,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useAcceptInvitationById() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: acceptInvitationById,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.list() })
      void client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.myInvitations() })
    },
  })
}

export function useDeclineInvitationById() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: declineInvitationById,
    onSuccess: () => client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.myInvitations() }),
  })
}
