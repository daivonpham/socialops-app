import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '@/shared/i18n'
import { Alert, Button, IconRefresh, useToast } from '@/shared/ui'
import { useFacebookSyncStatus, useRequestFacebookSync } from '../api'
import { persistentSyncIssues } from '../model/sync-issues'
import { isApiErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'

const NON_DATA_KEYS = new Set(['integration', 'sync', 'available-pages'])

/**
 * Overview/Analytics read locally synced data. This hook refetches those reads whenever
 * the Brand's sync finishes, so new figures appear without a manual reload.
 */
function useRefreshOnSync(brandId: string) {
  const client = useQueryClient()
  const status = useFacebookSyncStatus(brandId)
  const previous = useRef<string | null>(null)
  const marker = status.data ? `${status.data.lastSyncedAt}|${status.data.syncing}` : null

  useEffect(() => {
    if (!marker) return
    if (previous.current !== null && previous.current !== marker) {
      void client.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'facebook' &&
          query.queryKey[1] === brandId &&
          !NON_DATA_KEYS.has(String(query.queryKey[2])),
      })
    }
    previous.current = marker
  }, [brandId, client, marker])

  return status
}

export function FacebookSyncBanner({ brandId }: { brandId: string }) {
  const { t, i18n } = useTranslation('facebook')
  const { data } = useRefreshOnSync(brandId)
  if (!data) return null
  // Initial backfill runs silently; figures refresh on their own via useRefreshOnSync.
  const failing = persistentSyncIssues(data.pages)
  const rateLimitedOnly = failing.every((page) => page.status === 'rate_limited')
  const names = failing.map((page) => page.name)
  const pageList = new Intl.ListFormat(i18n.resolvedLanguage, { type: 'conjunction' }).format(
    names.length > 3
      ? [...names.slice(0, 3), t('sync.morePages', { count: names.length - 3 })]
      : names,
  )

  return (
    <>
      {failing.length ? (
        <Alert
          variant="soft"
          tone="warning"
          title={
            rateLimitedOnly
              ? t('sync.rateLimitedTitle', { count: failing.length })
              : t('sync.issueTitle', { count: failing.length })
          }
          description={
            rateLimitedOnly
              ? t('sync.rateLimitedDescription', { pages: pageList })
              : t('sync.issueDescription', { pages: pageList })
          }
        />
      ) : null}
    </>
  )
}

export function FacebookSyncControl({ brandId }: { brandId: string }) {
  const { t, i18n } = useTranslation('facebook')
  const errorMessage = useApiErrorMessage('facebook')
  const toast = useToast()
  const { data } = useFacebookSyncStatus(brandId)
  const refresh = useRequestFacebookSync(brandId)
  if (!data) return null
  const label = data.syncing
    ? t('sync.syncing')
    : data.lastSyncedAt
      ? t('sync.updatedAt', { time: formatDateTime(data.lastSyncedAt, i18n.resolvedLanguage) })
      : t('sync.neverSynced')

  return (
    <div className="flex items-center gap-2">
      <span role="status" className="text-caption text-text-tertiary">
        {label}
      </span>
      <Button
        size="sm"
        variant="ghost"
        icon={<IconRefresh aria-hidden />}
        aria-label={t('sync.refresh')}
        title={t('sync.refresh')}
        loading={refresh.isPending}
        disabled={data.syncing || Boolean(data.refreshAvailableAt)}
        onClick={() =>
          refresh.mutate(undefined, {
            onSuccess: () => toast.success({ title: t('sync.refreshQueued') }),
            onError: (error) =>
              toast.error({
                title: isApiErrorCode(error, [
                  'FACEBOOK_SYNC_RECENTLY_REQUESTED',
                  'RATE_LIMIT_EXCEEDED',
                ])
                  ? t('sync.refreshTooSoon')
                  : errorMessage(error, t('sync.refreshError')),
              }),
          })
        }
      />
    </div>
  )
}
