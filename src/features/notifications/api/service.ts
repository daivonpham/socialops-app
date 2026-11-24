import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { AppNotification, NotificationCounts, NotificationTab } from './types'

export const NOTIFICATIONS_PAGE_SIZE = 20

export async function getNotifications(page: number, tab: NotificationTab) {
  const { data } = await apiClient.get<CommonApiResponse<AppNotification[]>>('/notifications', {
    params: {
      page,
      limit: NOTIFICATIONS_PAGE_SIZE,
      ...(tab === 'action' ? { needsAction: true } : {}),
    },
  })
  return data
}

export async function getNotificationCounts() {
  const { data } = await apiClient.get<CommonApiResponse<NotificationCounts>>(
    '/notifications/unread-count',
  )
  return data.data
}

export async function markNotificationRead(id: string) {
  await apiClient.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  await apiClient.post('/notifications/read-all')
}
