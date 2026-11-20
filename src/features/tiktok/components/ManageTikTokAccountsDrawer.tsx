import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import { formatDate, formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Button,
  Drawer,
  IconCheckCircle,
  IconDisconnect,
  IconOpen,
  IconPlus,
  IconRefresh,
  IconTikTok,
  Modal,
  StatusTag,
  useToast,
} from '@/shared/ui'
import {
  useDisconnectTikTokAccount,
  useRefreshTikTok,
  type TikTokAccountDto,
  type TikTokIntegrationDto,
} from '../api'
import { HEALTH_TONE } from '../model/health'

/** Every connected TikTok account with all TikTok shares about it, and its connection actions. */
export function ManageTikTokAccountsDrawer({
  brandId,
  integration,
  isOpen,
  onClose,
  onAddAccount,
  isAddingAccount = false,
  canManage,
}: {
  brandId: string
  integration: TikTokIntegrationDto
  isOpen: boolean
  onClose: () => void
  onAddAccount: () => void
  isAddingAccount?: boolean
  /** Connecting and disconnecting; anyone who sees the numbers can still refresh them. */
  canManage: boolean
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const toast = useToast()
  const errorMessage = useApiErrorMessage('tiktok')
  const disconnect = useDisconnectTikTokAccount(brandId)
  const refresh = useRefreshTikTok(brandId)
  const [toDisconnect, setToDisconnect] = useState<TikTokAccountDto | null>(null)

  const syncNow = (accountId?: string) =>
    refresh.mutate(accountId, {
      onSuccess: (result) =>
        result.queued
          ? toast.success({ title: t('sync.refreshed') })
          : toast.info({
              title: result.refreshAvailableAt
                ? t('sync.refreshLater', {
                    time: formatDateTime(result.refreshAvailableAt, locale),
                  })
                : t('sync.refreshed'),
            }),
      onError: (error) => toast.error({ title: errorMessage(error, t('common.loadError')) }),
    })

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        placement="right"
        width="normal"
        title={t('manage.title')}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border-subtle bg-bg-surface-subtle p-4">
            <div className="flex items-start gap-3">
              <IconTikTok className="shrink-0 text-icon-lg text-platform-tiktok" />
              <div className="min-w-0">
                <p className="text-label-md text-text-primary">
                  {t('connection.connectedCount', { count: integration.accounts.length })}
                </p>
                <p className="mt-1 text-body-sm text-text-tertiary">{t('manage.description')}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {canManage ? (
                <Button
                  size="sm"
                  icon={<IconPlus />}
                  loading={isAddingAccount}
                  onClick={onAddAccount}
                >
                  {t('manage.addAccount')}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                icon={<IconRefresh />}
                loading={refresh.isPending && refresh.variables === undefined}
                onClick={() => syncNow()}
              >
                {t('sync.refresh')}
              </Button>
            </div>
          </div>
          <div className="app-scrollbar flex-1 overflow-y-auto p-4">
            {integration.accounts.length ? (
              <div className="grid gap-3">
                {integration.accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    canManage={canManage}
                    reconnecting={isAddingAccount}
                    syncing={refresh.isPending && refresh.variables === account.id}
                    onReconnect={onAddAccount}
                    onSync={() => syncNow(account.id)}
                    onDisconnect={() => setToDisconnect(account)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-text-tertiary">{t('manage.empty')}</p>
            )}
          </div>
        </div>
      </Drawer>
      <Modal
        open={Boolean(toDisconnect)}
        title={t('manage.disconnectTitle', { name: toDisconnect?.name ?? '' })}
        onClose={() => setToDisconnect(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setToDisconnect(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              loading={disconnect.isPending}
              onClick={() =>
                toDisconnect &&
                disconnect.mutate(toDisconnect.id, {
                  onSuccess: () => {
                    setToDisconnect(null)
                    toast.success({ title: t('manage.disconnectSuccess') })
                  },
                  onError: (error) =>
                    toast.error({ title: errorMessage(error, t('manage.disconnectError')) }),
                })
              }
            >
              {t('manage.disconnect')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-tertiary">{t('manage.disconnectDescription')}</p>
      </Modal>
    </>
  )
}

function AccountCard({
  account,
  canManage,
  reconnecting,
  syncing,
  onReconnect,
  onSync,
  onDisconnect,
}: {
  account: TikTokAccountDto
  canManage: boolean
  reconnecting: boolean
  syncing: boolean
  onReconnect: () => void
  onSync: () => void
  onDisconnect: () => void
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const count = (value?: number) =>
    value === undefined
      ? '—'
      : formatNumber(value, locale, {
          notation: value > 9999 ? 'compact' : 'standard',
          maximumFractionDigits: 1,
        })
  const stats = [
    { key: 'followers', value: count(account.followerCount) },
    { key: 'following', value: count(account.followingCount) },
    { key: 'likes', value: count(account.likesCount) },
    { key: 'videos', value: count(account.videoCount) },
  ] as const

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <Avatar name={account.name} src={account.avatarLargeUrl ?? account.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-label-md text-text-primary">{account.name}</strong>
            {account.isVerified ? (
              <IconCheckCircle aria-label={t('manage.verified')} className="text-info-600" />
            ) : null}
            <StatusTag tone={HEALTH_TONE[account.health]}>
              {account.health === 'token_expiring' && account.refreshExpiresAt
                ? t('health.token_expiring', {
                    date: formatDate(account.refreshExpiresAt, locale),
                  })
                : t(`health.${account.health}`)}
            </StatusTag>
          </div>
          {account.username ? (
            <p className="mt-1 text-caption text-text-tertiary">
              {t('manage.username', { username: account.username })}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-line text-body-sm text-text-secondary">
            {account.bioDescription || (
              <span className="text-text-tertiary">{t('manage.noBio')}</span>
            )}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.key} className="grid gap-[2px] rounded-lg bg-bg-surface-subtle px-3 py-2">
            <dt className="text-caption text-text-tertiary">{t(`manage.${stat.key}`)}</dt>
            <dd className="text-label-md tabular-nums text-text-primary">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-3 grid gap-1 text-caption">
        <div className="flex justify-between gap-3">
          <dt className="text-text-tertiary">{t('manage.lastSynced')}</dt>
          <dd className="text-text-secondary">
            {account.sync.lastSyncedAt
              ? formatDateTime(account.sync.lastSyncedAt, locale)
              : t('common.never')}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-tertiary">{t('manage.drafts')}</dt>
          <dd className="text-text-secondary">
            {account.canUploadDrafts ? t('manage.draftsOn') : t('manage.draftsOff')}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-tertiary">{t('manage.connected')}</dt>
          <dd className="text-text-secondary">{formatDate(account.connectedAt, locale)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border-subtle pt-3">
        {canManage && account.health !== 'connected' ? (
          <Button size="sm" icon={<IconRefresh />} loading={reconnecting} onClick={onReconnect}>
            {t('health.reconnect')}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" icon={<IconRefresh />} loading={syncing} onClick={onSync}>
          {t('manage.syncNow')}
        </Button>
        {account.profileDeepLink ? (
          <a
            href={account.profileDeepLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-label-sm text-text-secondary hover:bg-bg-surface-muted hover:text-text-primary focus-visible:focus-ring"
          >
            <IconOpen aria-hidden />
            {t('manage.openProfile')}
          </a>
        ) : null}
        {canManage ? (
          <Button size="sm" variant="ghost" icon={<IconDisconnect />} onClick={onDisconnect}>
            {t('manage.disconnect')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
