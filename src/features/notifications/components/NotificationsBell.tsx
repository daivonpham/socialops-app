import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useReconnectFacebookPages } from '@/features/facebook'
import { useConnectTikTok } from '@/features/tiktok'
import { PendingInvitations, useMyInvitations } from '@/features/workspaces'
import { useApiErrorMessage } from '@/shared/hooks'
import {
  Button,
  IconDisconnect,
  IconFacebook,
  IconMembers,
  IconNotification,
  IconPost,
  IconSparkles,
  IconTikTok,
  IconWarning,
  Popover,
  SectionLabel,
  Spin,
  Tabs,
  useToast,
} from '@/shared/ui'
import {
  NOTIFICATION_QUERY_KEYS,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCounts,
  useNotifications,
  useNotificationStream,
  type AppNotification,
  type NotificationTab,
} from '../api'
import {
  dayGroup,
  notificationView,
  timeAgo,
  type NotificationAction,
  type NotificationTarget,
  type NotificationTone,
} from '../model/notification-view'

/** Where a notification leads, with the Workspace and Brand it belongs to. */
export type NotificationOpen = {
  target: NotificationTarget
  workspaceId: string | null
  brandId: string | null
}

const TONE_ICON: Record<NotificationTone, ReactNode> = {
  approval: <IconPost />,
  publish: <IconWarning />,
  channel: <IconDisconnect />,
  member: <IconMembers />,
  ai: <IconSparkles />,
  credits: <IconWarning />,
}

const TONE_CLASS: Record<NotificationTone, string> = {
  approval: 'bg-brand-50 text-brand-700',
  publish: 'bg-error-50 text-error-700',
  channel: 'bg-warning-50 text-warning-700',
  member: 'bg-info-50 text-info-700',
  ai: 'bg-ai-50 text-ai-600',
  credits: 'bg-warning-50 text-warning-700',
}

const GROUPS = ['today', 'yesterday', 'earlier'] as const

/**
 * The top-bar bell: pending invitations first, then notifications from every Workspace, kept
 * current by the API's stream. "To do" keeps only what still waits on the person; each of those
 * offers its one action. Opening a notification marks it read and hands its destination to
 * `onOpen`, which switches Workspace or Brand when needed.
 */
export function NotificationsBell({ onOpen }: { onOpen: (open: NotificationOpen) => void }) {
  const { t } = useTranslation('notifications')
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  useNotificationStream()
  const unread = useNotificationCounts().data?.count ?? 0
  const invitations = useMyInvitations().data?.length ?? 0
  const count = unread + invitations

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // What waits on the person can be settled elsewhere without a notification, e.g. a
        // channel reconnected or a post published again: opening shows how things stand now.
        if (next) void queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all() })
        setOpen(next)
      }}
      placement="bottomRight"
      content={
        <div className="grid w-[30rem] max-w-[calc(100vw-2rem)]">
          <NotificationsPanel
            open={open}
            onClose={() => setOpen(false)}
            onOpen={(value) => {
              setOpen(false)
              onOpen(value)
            }}
          />
        </div>
      }
    >
      <button
        type="button"
        aria-label={count ? t('triggerWithCount', { count }) : t('trigger')}
        className="relative flex size-10 items-center justify-center rounded-lg text-icon-md text-text-secondary outline-none hover:bg-bg-surface-subtle focus-visible:focus-ring"
      >
        <IconNotification aria-hidden />
        {/* A dot says there is something new; the count is in the label. */}
        {count ? (
          <span
            aria-hidden
            className="absolute end-[9px] top-[9px] size-2 rounded-full bg-error-600 ring-2 ring-bg-surface"
          />
        ) : null}
      </button>
    </Popover>
  )
}

function NotificationsPanel({
  open,
  onClose,
  onOpen,
}: {
  open: boolean
  onClose: () => void
  onOpen: (open: NotificationOpen) => void
}) {
  const { t } = useTranslation('notifications')
  const [tab, setTab] = useState<NotificationTab>('all')
  const counts = useNotificationCounts().data
  const list = useNotifications(tab, open)
  const markAll = useMarkAllNotificationsRead()
  const markRead = useMarkNotificationRead()
  const items = list.data?.pages.flatMap((page) => page.data) ?? []
  const unread = counts?.count ?? 0
  const waiting = counts?.needsAction ?? 0

  const choose = (item: AppNotification) => {
    if (!item.read) markRead.mutate(item.id)
    onOpen({
      target: notificationView(item).target,
      workspaceId: item.workspaceId,
      brandId: item.brandId,
    })
  }

  return (
    <>
      <div className="grid gap-2 border-b border-border-subtle px-4 pt-3">
        <div className="flex items-center gap-2">
          <p className="text-label-md text-text-primary">{t('title')}</p>
          {unread ? (
            <span className="rounded-full bg-bg-surface-subtle px-2 text-caption text-text-secondary">
              {t('newCount', { count: unread })}
            </span>
          ) : null}
          <span className="flex-1" />
          {unread ? (
            <Button size="sm" variant="ghost" onClick={() => markAll.mutate()}>
              {t('markAllRead')}
            </Button>
          ) : null}
        </div>
        <Tabs
          variant="line"
          ariaLabel={t('tabs.label')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: t('tabs.all') },
            {
              value: 'action',
              label: waiting ? `${t('tabs.action')} (${waiting})` : t('tabs.action'),
            },
          ]}
        />
      </div>
      <div className="app-scrollbar max-h-[28rem] overflow-y-auto">
        {tab === 'all' ? <PendingInvitations onDone={onClose} /> : null}
        {list.isPending ? (
          <div className="flex justify-center px-4 py-8">
            <Spin />
          </div>
        ) : list.isError ? (
          <div className="grid justify-items-center gap-3 px-4 py-8 text-center">
            <p className="text-body-sm text-text-secondary">{t('loadError')}</p>
            <Button size="sm" onClick={() => void list.refetch()}>
              {t('retry')}
            </Button>
          </div>
        ) : items.length ? (
          <>
            {GROUPS.map((group) => {
              const rows = items.filter((item) => dayGroup(item.createdAt) === group)
              if (!rows.length) return null
              return (
                <section key={group} aria-label={t(`groups.${group}`)}>
                  <SectionLabel className="block px-4 pt-3 pb-1">
                    {t(`groups.${group}`)}
                  </SectionLabel>
                  <ul>
                    {rows.map((item) => (
                      <NotificationRow key={item.id} item={item} onChoose={() => choose(item)} />
                    ))}
                  </ul>
                </section>
              )
            })}
            {list.hasNextPage ? (
              <div className="flex justify-center border-t border-border-subtle px-4 py-2">
                <Button
                  size="sm"
                  variant="ghost"
                  loading={list.isFetchingNextPage}
                  onClick={() => void list.fetchNextPage()}
                >
                  {t('loadMore')}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="grid justify-items-center gap-2 px-4 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-bg-surface-subtle text-icon-md text-text-tertiary">
              <IconNotification aria-hidden />
            </span>
            <p className="text-body-sm text-text-tertiary">
              {tab === 'action' ? t('emptyAction') : t('empty')}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function NotificationRow({ item, onChoose }: { item: AppNotification; onChoose: () => void }) {
  const { t, i18n } = useTranslation('notifications')
  const view = notificationView(item)
  const params = {
    ...view.params,
    ...(item.type === 'member.role_changed'
      ? { role: t(`roles.${String(view.params.role)}` as never) }
      : {}),
  }
  const where = [view.params.workspace, view.params.brand].filter(Boolean).join(' · ')

  const body = t(`types.${view.key}.body` as never, params)

  // Two lines: what happened and when; then which channel or post, and where. The one action
  // sits at the end of the row.
  return (
    <li className="flex items-center gap-3 px-4 py-[10px] transition-colors hover:bg-bg-surface-subtle">
      <span
        aria-hidden
        className={`relative flex size-8 shrink-0 items-center justify-center rounded-full text-icon-sm ${TONE_CLASS[view.tone]}`}
      >
        {TONE_ICON[view.tone]}
        {item.read ? null : (
          <span className="absolute -start-[2px] -top-[2px] size-[10px] rounded-full bg-brand-600 ring-2 ring-bg-surface" />
        )}
      </span>
      <button
        type="button"
        onClick={onChoose}
        className="grid min-w-0 flex-1 gap-1 rounded-sm text-start outline-none focus-visible:focus-ring"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span
            className={
              'min-w-0 flex-1 truncate text-label-md ' +
              (item.read ? 'text-text-secondary' : 'text-text-primary')
            }
          >
            {item.read ? null : <span className="sr-only">{t('unread')}: </span>}
            {t(`types.${view.key}.title` as never, params)}
          </span>
          <span className="shrink-0 text-caption text-text-tertiary">
            {timeAgo(item.createdAt, i18n.language)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1 text-body-sm text-text-secondary">
          {view.platform === 'tiktok' ? (
            <IconTikTok aria-hidden className="shrink-0 text-text-tertiary" />
          ) : view.platform === 'facebook' ? (
            <IconFacebook aria-hidden className="shrink-0 text-text-tertiary" />
          ) : null}
          <span className="truncate" title={where ? `${body} · ${where}` : body}>
            {body}
            {where ? <span className="text-text-tertiary"> · {where}</span> : null}
          </span>
        </span>
      </button>
      {view.action ? (
        <div className="shrink-0">
          <ActionButton action={view.action} item={item} onOpen={onChoose} />
        </div>
      ) : null}
    </li>
  )
}

function ActionButton({
  action,
  item,
  onOpen,
}: {
  action: NotificationAction
  item: AppNotification
  onOpen: () => void
}) {
  const { t } = useTranslation('notifications')
  if (action.kind === 'open')
    return (
      <Button size="sm" variant="secondary" onClick={onOpen}>
        {t(action.labelKey)}
      </Button>
    )
  return action.platform === 'tiktok' ? (
    <ReconnectTikTok brandId={item.brandId} />
  ) : (
    <ReconnectFacebook brandId={item.brandId} accountIds={action.accountIds} />
  )
}

/** Tries each Page with the login it has, then asks Facebook for a new login if needed. */
function ReconnectFacebook({
  brandId,
  accountIds,
}: {
  brandId: string | null
  accountIds: string[]
}) {
  const { t } = useTranslation('notifications')
  const toast = useToast()
  const errorMessage = useApiErrorMessage('notifications')
  const reconnect = useReconnectFacebookPages(brandId)
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={reconnect.isPending}
      disabled={!brandId}
      onClick={() =>
        void reconnect
          .reconnect(accountIds)
          .then((outcome) => {
            if (outcome === 'reconnected') toast.success({ title: t('actions.reconnected') })
          })
          .catch((error: unknown) =>
            toast.error({ title: errorMessage(error, t('actions.reconnectError')) }),
          )
      }
    >
      {t('actions.reconnect')}
    </Button>
  )
}

/** TikTok has no per-account reconnect: a new TikTok login brings the account back. */
function ReconnectTikTok({ brandId }: { brandId: string | null }) {
  const { t } = useTranslation('notifications')
  const toast = useToast()
  const errorMessage = useApiErrorMessage('notifications')
  const connect = useConnectTikTok()
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={connect.isPending}
      disabled={!brandId}
      onClick={() => {
        if (!brandId) return
        connect.mutate(brandId, {
          onError: (error) =>
            toast.error({ title: errorMessage(error, t('actions.reconnectError')) }),
        })
      }}
    >
      {t('actions.reconnect')}
    </Button>
  )
}
