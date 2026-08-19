import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { SocialAccountCounts } from './types'

export async function getSocialAccountCounts(brandId: string) {
  const { data } = await apiClient.get<CommonApiResponse<SocialAccountCounts>>(
    `/brands/${brandId}/social-accounts/counts`,
  )
  return data
}
