import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'
import { formatDate, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Button,
  Drawer,
  IconDisconnect,
  IconFacebook,
  IconInfo,
  IconPlus,
  IconRefresh,
  Modal,
  StatusTag,
  Tooltip,
  useToast,
} from '@/shared/ui'
import {
  useDisconnectFacebook,
  useDisconnectFacebookPage,
  useFacebookSyncStatus,
  useReconnectFacebookPage,
  useRequestFacebookSync,
  type FacebookIntegrationDto,
  type FacebookPageDto,
} from '../api'
import { HEALTH_TONE } from '../model/status'
import { refreshAllAvailability } from '../model/sync-refresh'

export function ManageFacebookPagesDrawer({
  brandId,
  integration,
  isOpen,
  onClose,
  onAddPage,
  isAddingPage = false,
  canManage,
}: {
  brandId: string
  integration: FacebookIntegrationDto
  isOpen: boolean
  onClose: () => void
  onAddPage: () => void
  isAddingPage?: boolean
  /** Connecting and disconnecting; anyone who sees the numbers can still refresh them. */
  canManage: boolean
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const disconnectPage = useDisconnectFacebookPage(brandId)
  const disconnectAll = useDisconnectFacebook(brandId)
  const reconnectPage = useReconnectFacebookPage(brandId)
  const toast = useToast()
  const errorMessage = useApiErrorMessage('facebook')
  // Re-rendered each minute so the wait in the tooltip stays true.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const syncStatus = useFacebookSyncStatus(brandId)
  const syncRefresh = useRequestFacebookSync(brandId)
  const refreshState = refreshAllAvailability(syncStatus.data?.pages ?? [], now)
  const refreshHint = [
    t('sync.refreshHint'),
    refreshState.state === 'wait'
      ? t('sync.refreshAvailableIn', { minutes: refreshState.minutes })
      : refreshState.state === 'syncing'
        ? t('sync.syncing')
        : refreshState.state === 'rate_limited'
          ? t('sync.pageRateLimited')
          : null,
  ]
    .filter(Boolean)
    .join(' ')
  const requestRefresh = () =>
    syncRefresh.mutate(undefined, {
      onSuccess: () => toast.success({ title: t('sync.refreshQueued') }),
      onError: (error) =>
        toast.error({
          title: isApiErrorCode(error, ['FACEBOOK_SYNC_RECENTLY_REQUESTED', 'RATE_LIMIT_EXCEEDED'])
            ? t('sync.refreshTooSoon')
            : errorMessage(error, t('sync.refreshError')),
        }),
    })
  // Re-validate the existing grant first; only fall back to Facebook OAuth when the
  // stored connection can no longer see the Page. An expiring grant can only be renewed by
  // logging in to Facebook again, so it goes straight to OAuth.
  const reconnect = (page: FacebookPageDto) =>
    page.health === 'token_expiring'
      ? onAddPage()
      : reconnectPage.mutate(
          { brandId, pageId: page.id },
          {
            onSuccess: () =>
              toast.success({ title: t('connection.reconnected', { page: page.name }) }),
            onError: onAddPage,
          },
        )
  const [pageToDisconnect, setPageToDisconnect] = useState<FacebookPageDto | null>(null)
  const [isDisconnectAllConfirmationOpen, setIsDisconnectAllConfirmationOpen] = useState(false)

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        placement="right"
        width="normal"
        title={t('connection.drawerTitle')}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border-subtle bg-bg-surface-subtle p-4">
            <div className="flex items-start gap-3">
              <IconFacebook className="shrink-0 text-icon-lg text-platform-facebook" />
              <div className="min-w-0">
                <p className="text-label-md text-text-primary">
                  {t('connection.connectedCount', { count: integration.pages.length })}
                </p>
                <p className="mt-1 text-body-sm text-text-tertiary">
                  {t('connection.drawerDescription')}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {canManage ? (
                <Button size="sm" icon={<IconPlus />} loading={isAddingPage} onClick={onAddPage}>
                  {t('connection.addPage')}
                </Button>
              ) : null}
              {/* The icon sits apart from the button so its help stays reachable while locked. */}
              <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-bg-surface">
                <Button
                  size="sm"
                  variant="ghost"
                  borderRadius={0}
                  icon={<IconRefresh />}
                  disabled={!syncStatus.data || refreshState.state !== 'ready'}
                  loading={syncRefresh.isPending}
                  onClick={requestRefresh}
                >
                  {t('sync.refresh')}
                </Button>
                <Tooltip title={refreshHint}>
                  <button
                    type="button"
                    aria-label={refreshHint}
                    className="flex w-8 items-center justify-center border-s border-border text-icon-sm text-text-tertiary outline-none transition-colors duration-fast hover:bg-bg-surface-muted hover:text-text-primary focus-visible:bg-bg-surface-muted focus-visible:text-text-primary"
                  >
                    <IconInfo aria-hidden />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="app-scrollbar flex-1 overflow-y-auto p-4">
            <div className="grid gap-3">
              {integration.pages.map((page) => (
                <div
                  key={page.id}
                  className="rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={page.name} src={page.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-label-md text-text-primary">
                          {page.name}
                        </strong>
                        <StatusTag tone={HEALTH_TONE[page.health]}>
                          {t(`health.${page.health}`)}
                        </StatusTag>
                      </div>
                      <p className="mt-1 text-caption text-text-tertiary">
                        {page.username ? `@${page.username} · ` : ''}
                        {formatNumber(page.followersCount, locale)}{' '}
                        {t('metrics.followers').toLowerCase()}
                      </p>
                      {page.health === 'permission_missing' ? (
                        <p className="mt-1 text-caption text-error-700">
                          {t('tokenHealth.permissionHint')}
                        </p>
                      ) : null}
                      {page.health === 'token_expiring' && page.reconnectBy ? (
                        <p className="mt-1 text-caption text-warning-700">
                          {t('tokenHealth.reconnectBy', {
                            date: formatDate(page.reconnectBy, locale),
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {canManage ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border-subtle pt-3">
                      {page.health !== 'connected' ? (
                        <Button
                          size="sm"
                          icon={<IconRefresh />}
                          loading={
                            isAddingPage ||
                            (reconnectPage.isPending && reconnectPage.variables?.pageId === page.id)
                          }
                          onClick={() => reconnect(page)}
                        >
                          {t('connection.reconnect')}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<IconDisconnect />}
                        onClick={() => setPageToDisconnect(page)}
                      >
                        {t('connection.disconnectPage')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          {canManage ? (
            <div className="border-t border-border-subtle bg-bg-surface p-4">
              <Button
                className="w-full"
                variant="destructive"
                icon={<IconDisconnect />}
                onClick={() => setIsDisconnectAllConfirmationOpen(true)}
              >
                {t('connection.disconnectAll')}
              </Button>
            </div>
          ) : null}
        </div>
      </Drawer>
      <Modal
        open={Boolean(pageToDisconnect)}
        title={t('connection.disconnectPageTitle')}
        onClose={() => setPageToDisconnect(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPageToDisconnect(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              loading={disconnectPage.isPending}
              onClick={() =>
                pageToDisconnect &&
                disconnectPage.mutate(
                  { brandId, pageId: pageToDisconnect.id },
                  { onSuccess: () => setPageToDisconnect(null) },
                )
              }
            >
              {t('common.confirm')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-tertiary">
          {t('connection.disconnectPageDescription', { page: pageToDisconnect?.name ?? '' })}
        </p>
      </Modal>
      <Modal
        open={isDisconnectAllConfirmationOpen}
        title={t('connection.disconnectAllTitle')}
        onClose={() => setIsDisconnectAllConfirmationOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsDisconnectAllConfirmationOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              loading={disconnectAll.isPending}
              onClick={() =>
                disconnectAll.mutate(brandId, {
                  onSuccess: () => {
                    setIsDisconnectAllConfirmationOpen(false)
                    onClose()
                  },
                })
              }
            >
              {t('connection.disconnectAll')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-tertiary">
          {t('connection.disconnectAllDescription')}
        </p>
      </Modal>
    </>
  )
}
