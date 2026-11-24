import { describe, expect, it } from 'vitest'
import type { AppNotification } from '../api'
import { dayGroup, notificationView, timeAgo } from './notification-view'

const notification = (
  type: AppNotification['type'],
  data: Record<string, unknown>,
  needsAction = false,
): AppNotification => ({
  id: 'n',
  type,
  workspaceId: 'ws',
  brandId: 'brand',
  data,
  read: false,
  needsAction,
  createdAt: '2026-11-21T00:00:00.000Z',
})

describe('notificationView', () => {
  it('words a post without a caption on its own', () => {
    expect(notificationView(notification('approval.requested', { caption: '' })).key).toBe(
      'approval.requested_untitled',
    )
    expect(notificationView(notification('approval.approved', { caption: 'Hi' })).key).toBe(
      'approval.approved',
    )
  })

  it('offers review only while the post still waits', () => {
    const data = { contentId: 'c', platform: 'facebook', caption: 'Hi' }
    expect(notificationView(notification('approval.requested', data, true)).action).toEqual({
      kind: 'open',
      labelKey: 'actions.review',
    })
    expect(notificationView(notification('approval.requested', data, false)).action).toBeNull()
    // Reviewed posts never ask for anything.
    expect(notificationView(notification('approval.approved', data, true)).action).toBeNull()
  })

  it('tells a failed post from an unknown one, and opens it while it is still not out', () => {
    const failed = notificationView(
      notification(
        'publish.failed',
        { contentId: 'c', platform: 'tiktok', accountName: 'Shop', caption: '', outcome: 'failed' },
        true,
      ),
    )
    expect(failed).toMatchObject({
      key: 'publish.failed_untitled',
      platform: 'tiktok',
      action: { kind: 'open', labelKey: 'actions.openPost' },
      target: { kind: 'planning', platform: 'tiktok', contentId: 'c' },
    })
    expect(
      notificationView(notification('publish.failed', { outcome: 'unknown', caption: 'Hi' })).key,
    ).toBe('publish.unknown')
  })

  it('reconnects the channels named in the notification', () => {
    const data = {
      provider: 'facebook',
      accounts: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ],
    }
    const view = notificationView(notification('channel.reconnect', data, true))
    expect(view.key).toBe('channel.reconnect_more')
    expect(view.params).toMatchObject({ channels: 'A, B', count: 1, network: 'Facebook' })
    expect(view.action).toEqual({
      kind: 'reconnect',
      platform: 'facebook',
      accountIds: ['a', 'b', 'c'],
    })
    expect(notificationView(notification('channel.reconnect', data, false)).action).toBeNull()
  })

  it('opens the post an AI turn made, or else its chat', () => {
    expect(
      notificationView(
        notification('ai.succeeded', {
          platform: 'tiktok',
          contentId: 'c',
          conversationId: 'chat',
        }),
      ).target,
    ).toEqual({ kind: 'planning', platform: 'tiktok', contentId: 'c', chatId: 'chat' })
    expect(
      notificationView(notification('ai.failed', { platform: 'facebook', conversationId: 'chat' }))
        .target,
    ).toEqual({ kind: 'planning', platform: 'facebook', contentId: null, chatId: 'chat' })
  })

  it('reads data that is missing or of the wrong kind without failing', () => {
    const view = notificationView(notification('credits.low', { used: 'x', accounts: 'no' }))
    expect(view.params).toMatchObject({ used: 0, limit: 0, workspace: '' })
    expect(view.platform).toBeNull()
  })
})

describe('dayGroup and timeAgo', () => {
  it('groups by calendar day', () => {
    const now = new Date(2026, 10, 21, 9, 0)
    expect(dayGroup(new Date(2026, 10, 21, 0, 5).toISOString(), now)).toBe('today')
    expect(dayGroup(new Date(2026, 10, 20, 23, 59).toISOString(), now)).toBe('yesterday')
    expect(dayGroup(new Date(2026, 10, 19, 12, 0).toISOString(), now)).toBe('earlier')
  })

  it('speaks in the coarsest fitting unit', () => {
    const now = Date.parse('2026-11-21T12:00:00.000Z')
    expect(timeAgo('2026-11-21T11:59:30.000Z', 'en-US', now)).toBe('now')
    expect(timeAgo('2026-11-21T11:55:00.000Z', 'en-US', now)).toBe('5 minutes ago')
    expect(timeAgo('2026-11-20T12:00:00.000Z', 'en-US', now)).toBe('yesterday')
  })
})
