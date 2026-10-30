import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { getApiError } from '@/shared/api/errors'

// App-wide Query defaults (frontend-admin-performance/data-fetching):
// admin data is rarely per-second fresh, admins alt-tab constantly, and
// retrying a 4xx (e.g. 403) only delays the error message.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const { kind, status } = getApiError(error)
        if (kind === 'cancelled' || (status !== undefined && status < 500)) return false
        return failureCount < 1
      },
    },
  },
})

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
