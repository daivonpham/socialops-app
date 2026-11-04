import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/shared/ui'
import { useFacebookSyncStatus } from '../api'
import { persistentSyncIssues } from '../model/sync-issues'

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
