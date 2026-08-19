import { useQuery } from '@tanstack/react-query'
import { getWorkspaces } from './service'

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
