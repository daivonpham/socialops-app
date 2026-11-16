import { useEffect, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Alert, IconCheck, Progress, Spin } from '@/shared/ui'
import { useFacebookSyncStatus, type FacebookSyncStatusDto } from '../api'
import { persistentSyncIssues } from '../model/sync-issues'
import { syncProgress } from '../model/sync-progress'

type SyncPage = FacebookSyncStatusDto['pages'][number]

/** The Pages a screen shows: all of them, or those in `pageIds`. */
function scoped(pages: SyncPage[], pageIds?: readonly string[]): SyncPage[] {
  return pageIds ? pages.filter((page) => pageIds.includes(page.pageId)) : pages
}

function useListFormat() {
  const { t, i18n } = useTranslation('facebook')
  return (names: string[]) =>
    new Intl.ListFormat(i18n.resolvedLanguage, { type: 'conjunction' }).format(
      names.length > 3
        ? [...names.slice(0, 3), t('sync.morePages', { count: names.length - 3 })]
        : names,
    )
}

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

/**
 * Sync notices for the Pages a screen shows: a full sync still running (figures may be
 * incomplete; new data appears on its own via useRefreshOnSync), and syncs that keep failing.
 * While nothing has synced yet, `FacebookFirstSync` shows the progress in place of the content.
 */
export function FacebookSyncBanner({
  brandId,
  pageIds,
}: {
  brandId: string
  pageIds?: readonly string[]
}) {
  const { t } = useTranslation('facebook')
  const listFormat = useListFormat()
  const { data } = useRefreshOnSync(brandId)
  if (!data) return null
  const pages = scoped(data.pages, pageIds)
  const progress = syncProgress(pages)
  const failing = persistentSyncIssues(pages)
  const rateLimitedOnly = failing.every((page) => page.status === 'rate_limited')
  const pageList = listFormat(failing.map((page) => page.name))

  return (
    <>
      {progress.syncing.length && !progress.firstSync ? (
        <Alert
          variant="soft"
          tone="info"
          title={
            <span className="inline-flex items-center gap-2">
              <Spin size="sm" indicator="ring" />
              {t('initialSync.bannerTitle', {
                pages: listFormat(progress.syncing.map((page) => page.name)),
              })}
            </span>
          }
          description={t('initialSync.bannerDescription')}
        />
      ) : null}
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

/**
 * Right after Facebook is connected nothing has synced yet, and the screen would show only
 * zeros. This shows the sync's progress instead, then the content once a Page has data.
 */
export function FacebookFirstSync({
  brandId,
  pageIds,
  children,
}: {
  brandId: string
  pageIds?: readonly string[]
  children: ReactNode
}) {
  const { t } = useTranslation('facebook')
  const { data } = useFacebookSyncStatus(brandId)
  const pages = data ? scoped(data.pages, pageIds) : []
  const progress = syncProgress(pages)
  if (!progress.firstSync) return <>{children}</>

  return (
    <section
      role="status"
      aria-live="polite"
      className="grid justify-items-center gap-6 rounded-xl border border-border-subtle bg-bg-surface px-6 py-16 text-center shadow-xs"
    >
      <Spin size="lg" />
      <div className="grid max-w-[540px] gap-2">
        <h2 className="text-heading-3 text-text-primary">{t('initialSync.title')}</h2>
        <p className="text-body-sm text-text-secondary">{t('initialSync.description')}</p>
      </div>
      {pages.length > 1 ? (
        <div className="grid w-full max-w-[360px] gap-2">
          <Progress
            percent={(progress.done / pages.length) * 100}
            ariaLabel={t('initialSync.progress', { done: progress.done, total: pages.length })}
          />
          <span className="text-caption text-text-tertiary">
            {t('initialSync.progress', { done: progress.done, total: pages.length })}
          </span>
        </div>
      ) : null}
      <ul className="grid w-full max-w-[440px] gap-2 text-start">
        {pages.map((page) => {
          const retrying = page.status === 'error' || page.status === 'rate_limited'
          return (
            <li
              key={page.pageId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-4 py-3"
            >
              <span className="truncate text-body-sm text-text-primary">{page.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-caption text-text-secondary">
                {page.backfillCompleted ? (
                  <IconCheck aria-hidden className="text-success-700" />
                ) : (
                  <Spin size="sm" indicator="ring" />
                )}
                {page.backfillCompleted
                  ? t('initialSync.pageDone')
                  : retrying
                    ? t('initialSync.pageRetrying')
                    : t('initialSync.pageSyncing')}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
