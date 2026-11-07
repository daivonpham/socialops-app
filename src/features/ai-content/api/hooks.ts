import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAiAvailability,
  getAiGeneration,
  getAiTemplates,
  getBrandAiProfile,
  startAiGeneration,
  updateBrandAiProfile,
} from './service'

const POLL_MS = 2000

export const AI_CONTENT_QUERY_KEYS = {
  root: (brandId: string | null) => ['ai-content', brandId] as const,
  availability: (brandId: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.root(brandId), 'availability'] as const,
  templates: (brandId: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.root(brandId), 'templates'] as const,
  profile: (brandId: string | null) => [...AI_CONTENT_QUERY_KEYS.root(brandId), 'profile'] as const,
  generation: (brandId: string | null, id: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.root(brandId), 'generation', id] as const,
}

export function useAiAvailability(brandId: string | null) {
  return useQuery({
    queryKey: AI_CONTENT_QUERY_KEYS.availability(brandId),
    queryFn: () => getAiAvailability(brandId!),
    enabled: brandId !== null,
  })
}

export function useAiTemplates(brandId: string | null, enabled = true) {
  return useQuery({
    queryKey: AI_CONTENT_QUERY_KEYS.templates(brandId),
    queryFn: () => getAiTemplates(brandId!),
    enabled: brandId !== null && enabled,
  })
}

export function useBrandAiProfile(brandId: string | null, enabled = true) {
  return useQuery({
    queryKey: AI_CONTENT_QUERY_KEYS.profile(brandId),
    queryFn: () => getBrandAiProfile(brandId!),
    enabled: brandId !== null && enabled,
  })
}

export function useUpdateBrandAiProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateBrandAiProfile,
    onSuccess: (_, { brandId }) =>
      queryClient.invalidateQueries({ queryKey: AI_CONTENT_QUERY_KEYS.root(brandId) }),
  })
}

export const useStartAiGeneration = () => useMutation({ mutationFn: startAiGeneration })

/** Asks again every two seconds until the generation has finished one way or the other. */
export function useAiGeneration(brandId: string | null, generationId: string | null) {
  return useQuery({
    queryKey: AI_CONTENT_QUERY_KEYS.generation(brandId, generationId),
    queryFn: () => getAiGeneration(brandId!, generationId!),
    enabled: brandId !== null && generationId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'succeeded' || status === 'failed' ? false : POLL_MS
    },
  })
}
