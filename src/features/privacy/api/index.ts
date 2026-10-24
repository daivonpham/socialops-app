import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'

export type FacebookDataDeletionStatusDto = {
  confirmationCode: string
  status: 'COMPLETED'
  requestedAt: string
  completedAt: string
}

export async function getFacebookDataDeletionStatus(code: string) {
  const { data } = await apiClient.get<CommonApiResponse<FacebookDataDeletionStatusDto>>(
    `/social-accounts/facebook/data-deletion/${encodeURIComponent(code)}`,
  )
  return data.data
}

export function useFacebookDataDeletionStatus(code: string | null) {
  return useQuery({
    queryKey: ['privacy', 'facebook-data-deletion', code],
    queryFn: () => getFacebookDataDeletionStatus(code!),
    enabled: Boolean(code),
    retry: false,
  })
}
