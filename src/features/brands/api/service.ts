import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { BrandDetailDto, BrandDto, CreateBrandInput, UpdateBrandInput } from './types'

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

export async function createBrand({ workspaceId, ...input }: CreateBrandInput) {
  const { data } = await apiClient.post<CommonApiResponse<BrandDto>>(
    `/workspaces/${workspaceId}/brands`,
    input,
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  )
  return data.data
}

export async function updateBrand({ brandId, ...input }: UpdateBrandInput) {
  const { data } = await apiClient.patch<CommonApiResponse<BrandDto>>(`/brands/${brandId}`, input)
  return data.data
}

export async function deleteBrand(brandId: string) {
  await apiClient.delete(`/brands/${brandId}`)
}

export async function uploadBrandAvatar(brandId: string, avatar: File) {
  const body = new FormData()
  body.append('avatar', avatar)
  const { data } = await apiClient.post<CommonApiResponse<BrandDto>>(
    `/brands/${brandId}/avatar`,
    body,
  )
  return data.data
}

export async function completeBrandOnboarding() {
  const { data } = await apiClient.post('/users/me/brand-onboarding/complete', {})
  return data.data
}
