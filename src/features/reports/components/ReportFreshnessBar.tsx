import { useTranslation } from 'react-i18next'
import { formatDateTime } from '@/shared/i18n'
import { Button, IconInfo, IconRefresh, IconWarning, Progress } from '@/shared/ui'
import type { ReportDocument, ReportRefresh } from '../api/types'

/** How fresh the numbers are, with the on-demand refresh/backfill action and its progress. */
export function ReportFreshnessBar({
  document,
  refresh,
  onRefresh,
}: {
  document: ReportDocument
  refresh: ReportRefresh | null
  onRefresh: () => void
}) {
  const { t, i18n } = useTranslation('reports')
  const { freshness, meta } = document
  const running = refresh !== null && ['queued', 'running'].includes(refresh.status)
  const needsAction = freshness.stalePosts > 0 || freshness.missingRanges.length > 0

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border px-4 py-3 ${
        needsAction
          ? 'border-warning-100 bg-warning-50'
          : 'border-border-subtle bg-bg-surface-subtle'
      }`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-icon-sm ${
          needsAction ? 'bg-warning-100 text-warning-700' : 'bg-bg-surface text-text-tertiary'
        }`}
      >
        {needsAction ? <IconWarning aria-hidden /> : <IconInfo aria-hidden />}
      </span>
      <div className="grid min-w-0 flex-1 gap-1 text-body-sm">
        {freshness.lastSyncedAt ? (
          <p className="text-text-secondary">
            {t('freshness.syncedAt', {
              time: formatDateTime(freshness.lastSyncedAt, i18n.language, meta.timeZone),
            })}
          </p>
        ) : null}
        {freshness.stalePosts > 0 ? (
          <p className="text-warning-700">
            {t('freshness.stale', { count: freshness.stalePosts })}
          </p>
        ) : null}
        {freshness.missingRanges.length ? (
          <p className="text-warning-700">{t('freshness.missing')}</p>
        ) : null}
        {running ? (
          <div className="mt-1 grid max-w-sm gap-1">
            <p className="text-caption text-text-tertiary">
              {t('freshness.refreshing', { done: refresh.doneUnits, total: refresh.totalUnits })}
            </p>
            <Progress
              ariaLabel={t('freshness.refreshing', {
                done: refresh.doneUnits,
                total: refresh.totalUnits,
              })}
              percent={
                refresh.totalUnits ? Math.round((refresh.doneUnits / refresh.totalUnits) * 100) : 0
              }
            />
          </div>
        ) : null}
      </div>
      {needsAction ? (
        <Button size="sm" icon={<IconRefresh aria-hidden />} loading={running} onClick={onRefresh}>
          {freshness.missingRanges.length ? t('freshness.backfill') : t('freshness.refresh')}
        </Button>
      ) : null}
    </div>
  )
}
