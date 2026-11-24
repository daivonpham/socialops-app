import { useEffect } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { WORKSPACE_QUERY_KEYS } from '@/features/workspaces'
import { readEventStream } from '@/shared/api/eventStream'
import type { CommonApiResponse } from '@/shared/api/types'
import {
  getNotificationCounts,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './service'
import type { AppNotification, NotificationCounts, NotificationTab } from './types'

export const NOTIFICATION_QUERY_KEYS = {
  all: () => ['notifications'] as const,
  lists: () => ['notifications', 'list'] as const,
  list: (tab: NotificationTab) => ['notifications', 'list', tab] as const,
  counts: () => ['notifications', 'counts'] as const,
}

type Pages = InfiniteData<CommonApiResponse<AppNotification[]>, number>

/** Waits before opening the stream again, longer each time it fails in a row. */
const RECONNECT_MS = [2_000, 5_000, 15_000, 30_000]

export function useNotificationCounts() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.counts(),
    queryFn: getNotificationCounts,
    refetchOnWindowFocus: true,
  })
}

/** Newest first, a page at a time; loaded once the list is opened. */
export function useNotifications(tab: NotificationTab, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(tab),
    queryFn: ({ pageParam }) => getNotifications(pageParam, tab),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const pagination = last.metadata?.pagination
      return pagination && pagination.page < pagination.totalPage ? pagination.page + 1 : undefined
    },
    enabled,
  })
}

/** Marks matching notifications read in every loaded list; returns how many were unread. */
function markReadInLists(client: QueryClient, match: (item: AppNotification) => boolean): number {
  let changed = 0
  client.setQueriesData<Pages>({ queryKey: NOTIFICATION_QUERY_KEYS.lists() }, (pages) =>
    pages
      ? {
          ...pages,
          pages: pages.pages.map((page) => ({
            ...page,
            data: page.data.map((item) => {
              if (item.read || !match(item)) return item
              changed += 1
              return { ...item, read: true }
            }),
          })),
        }
      : pages,
  )
  return changed
}

/** Shown as read at once; the counts and lists are asked for again afterwards. */
export function useMarkNotificationRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id) => {
      if (markReadInLists(client, (item) => item.id === id))
        client.setQueryData<NotificationCounts>(NOTIFICATION_QUERY_KEYS.counts(), (counts) =>
          counts ? { ...counts, count: Math.max(0, counts.count - 1) } : counts,
        )
    },
    onSettled: () => client.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all() }),
  })
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: () => {
      markReadInLists(client, () => true)
      client.setQueryData<NotificationCounts>(NOTIFICATION_QUERY_KEYS.counts(), (counts) =>
        counts ? { ...counts, count: 0 } : counts,
      )
    },
    onSettled: () => client.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all() }),
  })
}

/**
 * Keeps notifications current: the API says when they change, and the counts, the lists and the
 * pending invitations are asked for again. The stream opens with such a message, so reopening it
 * after a drop also catches up on what was missed.
 */
export function useNotificationStream() {
  const client = useQueryClient()
  useEffect(() => {
    const controller = new AbortController()
    let failures = 0
    let retryTimer: number | undefined
    const listen = () => {
      readEventStream(
        '/notifications/stream',
        () => {
          failures = 0
          void client.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all() })
          void client.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.myInvitations() })
        },
        controller.signal,
      )
        .catch(() => {
          failures += 1
        })
        .then(() => {
          if (controller.signal.aborted) return
          const wait = RECONNECT_MS[Math.min(failures, RECONNECT_MS.length - 1)]
          retryTimer = window.setTimeout(listen, wait)
        })
    }
    listen()
    return () => {
      controller.abort()
      window.clearTimeout(retryTimer)
    }
  }, [client])
}
