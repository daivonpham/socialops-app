import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmAiOnboarding,
  followUpAiGeneration,
  getAiAvailability,
  getAiConversation,
  getAiConversations,
  getAiOnboarding,
  getAiTemplates,
  getBrandAiProfile,
  postAiSuggestion,
  skipAiOnboarding,
  suggestAiProfile,
  startAiGeneration,
  updateBrandAiProfile,
} from './service'
import type { AiConversation } from './types'

const POLL_MS = 2000
/** The history sync takes minutes, so the first-run screen looks now and then. */
const SYNC_POLL_MS = 5000

export const AI_CONTENT_QUERY_KEYS = {
  root: (brandId: string | null) => ['ai-content', brandId] as const,
  availability: (brandId: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.root(brandId), 'availability'] as const,
  templates: (brandId: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.root(brandId), 'templates'] as const,
  profile: (brandId: string | null) => [...AI_CONTENT_QUERY_KEYS.root(brandId), 'profile'] as const,
  onboarding: (brandId: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.root(brandId), 'onboarding'] as const,
  conversations: (brandId: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.root(brandId), 'conversations'] as const,
  conversation: (brandId: string | null, id: string | null) =>
    [...AI_CONTENT_QUERY_KEYS.conversations(brandId), id] as const,
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

export function useAiOnboarding(brandId: string) {
  return useQuery({
    queryKey: AI_CONTENT_QUERY_KEYS.onboarding(brandId),
    queryFn: () => getAiOnboarding(brandId),
    refetchInterval: (query) => (query.state.data?.state === 'syncing' ? SYNC_POLL_MS : false),
  })
}

export const useSuggestAiProfile = () => useMutation({ mutationFn: suggestAiProfile })

/** Answering the screen changes what the button opens, so availability is read again. */
function useOnboardingAnswer<A extends string | { brandId: string }, R>(
  fn: (input: A) => Promise<R>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (_, input) =>
      queryClient.invalidateQueries({
        queryKey: AI_CONTENT_QUERY_KEYS.root(typeof input === 'string' ? input : input.brandId),
      }),
  })
}

export const useSkipAiOnboarding = () => useOnboardingAnswer(skipAiOnboarding)
export const useConfirmAiOnboarding = () => useOnboardingAnswer(confirmAiOnboarding)

/** A new turn changes the chat and the list of chats, so both are read again. */
function useTurnMutation<A, R extends { conversationId: string }>(fn: (input: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (_, input) => {
      const brandId = (input as { brandId: string }).brandId
      return queryClient.invalidateQueries({
        queryKey: AI_CONTENT_QUERY_KEYS.conversations(brandId),
      })
    },
  })
}

export const useStartAiGeneration = () => useTurnMutation(startAiGeneration)
export const useFollowUpAiGeneration = () => useTurnMutation(followUpAiGeneration)

export function usePostAiSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postAiSuggestion,
    onSuccess: (_, { brandId }) =>
      queryClient.invalidateQueries({ queryKey: AI_CONTENT_QUERY_KEYS.conversations(brandId) }),
  })
}

export function useAiConversations(brandId: string | null, enabled = true) {
  return useQuery({
    queryKey: AI_CONTENT_QUERY_KEYS.conversations(brandId),
    queryFn: () => getAiConversations(brandId!),
    enabled: brandId !== null && enabled,
  })
}

const isUnfinished = (conversation: AiConversation | undefined): boolean =>
  Boolean(conversation?.turns.some((turn) => turn.status === 'queued' || turn.status === 'running'))

/** One chat; asked again every two seconds while a turn is still being made. */
export function useAiConversation(brandId: string | null, conversationId: string | null) {
  return useQuery({
    queryKey: AI_CONTENT_QUERY_KEYS.conversation(brandId, conversationId),
    queryFn: () => getAiConversation(brandId!, conversationId!),
    enabled: brandId !== null && conversationId !== null,
    refetchInterval: (query) => (isUnfinished(query.state.data) ? POLL_MS : false),
  })
}
