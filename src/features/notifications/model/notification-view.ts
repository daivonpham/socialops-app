import type { AppNotification } from '../api'

export type NotificationPlatform = 'facebook' | 'tiktok'

/** Where a notification leads; the app turns it into a route. */
export type NotificationTarget =
  | {
      kind: 'planning'
      platform: NotificationPlatform
      /** The post to open; without one, `chatId` opens that AI chat instead. */
      contentId: string | null
      chatId?: string | null
    }
  | { kind: 'channels'; platform: NotificationPlatform }
  | { kind: 'members' }
  | { kind: 'none' }

/** The one button a notification offers while it still waits on the person. */
export type NotificationAction =
  | { kind: 'open'; labelKey: 'actions.review' | 'actions.openPost' }
  | { kind: 'reconnect'; platform: NotificationPlatform; accountIds: string[] }

export type NotificationTone = 'approval' | 'channel' | 'member' | 'ai' | 'credits' | 'publish'

/** How a notification reads: `types.<key>.title` and `types.<key>.body` in this namespace. */
export type NotificationView = {
  tone: NotificationTone
  key: string
  params: Record<string, string | number>
  /** The network it is about, shown as an icon; null when it is about no one network. */
  platform: NotificationPlatform | null
  target: NotificationTarget
  /** Only while it still waits on the person. */
  action: NotificationAction | null
}

const text = (data: Record<string, unknown>, key: string): string => {
  const value = data[key]
  return typeof value === 'string' ? value : ''
}

const number = (data: Record<string, unknown>, key: string): number => {
  const value = data[key]
  return typeof value === 'number' ? value : 0
}

const platformOf = (value: string): NotificationPlatform =>
  value === 'tiktok' ? 'tiktok' : 'facebook'

const accountsOf = (data: Record<string, unknown>): Array<{ id: string; name: string }> =>
  (Array.isArray(data.accounts) ? (data.accounts as unknown[]) : []).flatMap((account) =>
    account && typeof account === 'object' && 'id' in account && 'name' in account
      ? [{ id: String(account.id), name: String(account.name) }]
      : [],
  )

/** Channel names as one phrase: up to two by name, then how many more. */
export function channelNames(data: Record<string, unknown>): { names: string; more: number } {
  const names = accountsOf(data).map((account) => account.name)
  return { names: names.slice(0, 2).join(', '), more: Math.max(0, names.length - 2) }
}

export function notificationView(notification: AppNotification): NotificationView {
  const { data, type, needsAction } = notification
  const common = {
    actor: text(data, 'actorName'),
    workspace: text(data, 'workspaceName'),
    brand: text(data, 'brandName'),
  }
  const caption = text(data, 'caption')
  // A post of pictures or a video alone has no caption to quote.
  const untitled = caption ? '' : '_untitled'
  switch (type) {
    case 'approval.requested':
    case 'approval.approved':
    case 'approval.rejected': {
      const platform = platformOf(text(data, 'platform'))
      return {
        tone: 'approval',
        key: type + untitled,
        params: { ...common, caption },
        platform,
        target: { kind: 'planning', platform, contentId: text(data, 'contentId') || null },
        action:
          needsAction && type === 'approval.requested'
            ? { kind: 'open', labelKey: 'actions.review' }
            : null,
      }
    }
    case 'publish.failed': {
      const platform = platformOf(text(data, 'platform'))
      const outcome = text(data, 'outcome') === 'unknown' ? 'publish.unknown' : 'publish.failed'
      return {
        tone: 'publish',
        key: outcome + untitled,
        params: { ...common, caption, account: text(data, 'accountName') },
        platform,
        target: { kind: 'planning', platform, contentId: text(data, 'contentId') || null },
        action: needsAction ? { kind: 'open', labelKey: 'actions.openPost' } : null,
      }
    }
    case 'channel.expiring':
    case 'channel.reconnect':
    case 'channel.permission':
    case 'channel.removed': {
      const { names, more } = channelNames(data)
      const platform = platformOf(text(data, 'provider'))
      return {
        tone: 'channel',
        key: more ? `${type}_more` : type,
        params: {
          ...common,
          channels: names,
          count: more,
          network: platform === 'tiktok' ? 'TikTok' : 'Facebook',
        },
        platform,
        target: { kind: 'channels', platform },
        action: needsAction
          ? { kind: 'reconnect', platform, accountIds: accountsOf(data).map((item) => item.id) }
          : null,
      }
    }
    case 'member.invited':
    case 'member.role_changed':
      return {
        tone: 'member',
        key: type,
        params: { ...common, role: text(data, 'role') },
        platform: null,
        target: { kind: 'none' },
        action: null,
      }
    case 'member.joined':
      return {
        tone: 'member',
        key: type,
        params: common,
        platform: null,
        target: { kind: 'members' },
        action: null,
      }
    case 'ai.succeeded':
    case 'ai.failed': {
      const platform = platformOf(text(data, 'platform'))
      return {
        tone: 'ai',
        key: type === 'ai.succeeded' && data.reply === true ? 'ai.replied' : type,
        params: common,
        platform,
        target: {
          kind: 'planning',
          platform,
          contentId: text(data, 'contentId') || null,
          chatId: text(data, 'conversationId') || null,
        },
        action: null,
      }
    }
    case 'credits.low':
    case 'credits.out':
      return {
        tone: 'credits',
        key: type,
        params: { ...common, used: number(data, 'used'), limit: number(data, 'limit') },
        platform: null,
        target: { kind: 'members' },
        action: null,
      }
  }
}

/** "Today", "yesterday" or "earlier", by the person's calendar day. */
export function dayGroup(value: string, now = new Date()): 'today' | 'yesterday' | 'earlier' {
  const time = new Date(value).getTime()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (time >= start) return 'today'
  if (time >= start - 86_400_000) return 'yesterday'
  return 'earlier'
}

/** "5 minutes ago", "yesterday": coarse, in the person's language. */
export function timeAgo(value: string, locale: string, now = Date.now()): string {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.35],
    ['month', 12],
    ['year', Infinity],
  ]
  let amount = seconds
  for (const [unit, size] of steps) {
    if (Math.abs(amount) < size) {
      return unit === 'second'
        ? format.format(0, 'second')
        : format.format(Math.round(amount), unit)
    }
    amount /= size
  }
  return format.format(Math.round(amount), 'year')
}
