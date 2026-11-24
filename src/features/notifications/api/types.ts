export type NotificationType =
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'channel.expiring'
  | 'channel.reconnect'
  | 'channel.permission'
  | 'channel.removed'
  | 'member.invited'
  | 'member.joined'
  | 'member.role_changed'
  | 'ai.succeeded'
  | 'ai.failed'
  | 'credits.low'
  | 'credits.out'
  | 'publish.failed'

/**
 * One notification. `data` holds what its text needs, captured when it happened; what it holds
 * depends on `type`, so it is read through `model/notification-view`.
 */
export type AppNotification = {
  id: string
  type: NotificationType
  /** Null only for an invitation, sent before the person joined. */
  workspaceId: string | null
  brandId: string | null
  data: Record<string, unknown>
  read: boolean
  /** Still waiting on the person: a post to review or fix, a channel to reconnect. */
  needsAction: boolean
  createdAt: string
}

export type NotificationTab = 'all' | 'action'

export type NotificationCounts = {
  /** Unread, leaving out invitations: the bell counts pending invitations itself. */
  count: number
  needsAction: number
}
