import { useMutation, useQuery } from '@tanstack/react-query'
import {
  completeBrandOnboarding,
  createBrand,
  deleteBrand,
  getBrand,
  getBrands,
  updateBrand,
  uploadBrandAvatar,
} from './service'

export const BRAND_QUERY_KEYS = {
  list: (workspaceId: string | null) => ['brands', 'list', workspaceId] as const,
  detail: (brandId: string | null) => ['brands', 'detail', brandId] as const,
}

export function useBrands(workspaceId: string | null) {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.list(workspaceId),
    queryFn: () => getBrands(workspaceId!),
    enabled: workspaceId !== null,
    select: (response) => response.data,
  })
}

/** Brand detail includes the current user's permission keys for that brand. */
export function useBrand(brandId: string | null) {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.detail(brandId),
    queryFn: () => getBrand(brandId!),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useCreateBrand() {
  return useMutation({ mutationFn: createBrand })
}

export function useUpdateBrand() {
  return useMutation({ mutationFn: updateBrand })
}

export function useDeleteBrand() {
  return useMutation({ mutationFn: deleteBrand })
}

export function useUploadBrandAvatar() {
  return useMutation({
    mutationFn: ({ brandId, avatar }: { brandId: string; avatar: File }) =>
      uploadBrandAvatar(brandId, avatar),
  })
}

export function useCompleteBrandOnboarding() {
  return useMutation({ mutationFn: completeBrandOnboarding })
}
