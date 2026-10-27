import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { disconnectGoogle, getGoogleConnection } from './service'

export const GOOGLE_QUERY_KEYS = {
  connection: ['google', 'connection'] as const,
}

export function useGoogleConnection(enabled = true) {
  return useQuery({
    queryKey: GOOGLE_QUERY_KEYS.connection,
    queryFn: getGoogleConnection,
    enabled,
    staleTime: 60_000,
  })
}

export function useDisconnectGoogle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => client.invalidateQueries({ queryKey: GOOGLE_QUERY_KEYS.connection }),
  })
}
