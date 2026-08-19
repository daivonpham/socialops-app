import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { BrandDetailDto, BrandDto } from './types'

export async function getBrands(workspaceId: string) {
  const { data } = await apiClient.get<CommonApiResponse<BrandDto[]>>(
    `/workspaces/${workspaceId}/brands`,
  )
  return data
}

export async function getBrand(brandId: string) {
  const { data } = await apiClient.get<CommonApiResponse<BrandDetailDto>>(`/brands/${brandId}`)
  return data
}
