import { useMemo, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FacebookFilters,
  FacebookSyncBanner,
  FacebookSyncControl,
  MetricCards,
  TrendChart,
  useFacebookDetails,
  useFacebookOverviewSummary,
  type DateRange,
  type FacebookPostDto,
  type FacebookQuery,
} from '@/features/facebook'
import { usePlanningSummary } from '@/features/planning'
import { useSocialAccountCounts } from '@/features/social-accounts'
import { useUrlFilters } from '@/shared/hooks'
import { formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import { hasPermission, PERMISSIONS, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  IconFacebook,
  IconTikTok,
  SectionError,
  SectionSkeleton,
} from '@/shared/ui'

const DEFAULT_FILTERS = { range: '30d', since: '', until: '', compare: 'previous' }
const FACEBOOK_PATH = '/platforms/facebook/overview'
const TIKTOK_PATH = '/platforms/tiktok/overview'
const PLANNING_PATH = '/platforms/facebook/planning'

/**
 * Brand-level summary. Every figure comes from locally synced data or Planning records,
 * so the page stays fast regardless of how many Pages the Brand has.
 */
export default function AllPlatformsPage() {
  const { t } = useTranslation('overview')
  const { brandId } = useActiveBrand()
  const { granted, isLoading: permissionsLoading } = usePermissions()
  const [filters, setFilters] = useUrlFilters(DEFAULT_FILTERS)
  const canViewAnalytics = hasPermission(granted, PERMISSIONS.ANALYTICS_VIEW.key)
  const counts = useSocialAccountCounts(brandId)
  const facebookConnected = (counts.data?.facebook ?? 0) > 0
  const analyticsBrandId = canViewAnalytics && facebookConnected ? brandId : null

  const range = (['7d', '30d', '90d'].includes(filters.range) ? filters.range : '30d') as DateRange
  const query: FacebookQuery = {
    pageId: 'all',
    range,
    since: filters.since || undefined,
    until: filters.until || undefined,
    compare: filters.compare,
  }
  const period = useMemo(
    () => resolvePeriod(range, filters.since, filters.until),
    [filters.since, filters.until, range],
  )
  const summary = useFacebookOverviewSummary(analyticsBrandId, query)
  const details = useFacebookDetails(analyticsBrandId, query)
  const publishing = usePlanningSummary(brandId, period)

  if (!brandId)
    return (
      <div className="py-16">
        <EmptyState title={t('noBrandTitle')} description={t('noBrandDescription')} />
      </div>
    )
  if (counts.isPending || permissionsLoading) return <SectionSkeleton rows={8} />
  if (counts.isError)
    return (
      <SectionError
        title={t('loadError')}
        retryLabel={t('retry')}
        onRetry={() => void counts.refetch()}
      />
    )

  const connectedTotal = (counts.data?.facebook ?? 0) + (counts.data?.tiktok ?? 0)
  if (connectedTotal === 0) return <NoAccountsState />

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-body-sm text-text-secondary">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {analyticsBrandId ? <FacebookSyncControl brandId={analyticsBrandId} /> : null}
          <FacebookFilters
            range={range}
            since={query.since}
            until={query.until}
            compare={query.compare}
            onChange={setFilters}
          />
        </div>
      </header>

      {analyticsBrandId ? <FacebookSyncBanner brandId={analyticsBrandId} /> : null}
      {!canViewAnalytics ? <Alert variant="soft" tone="info" title={t('analyticsDenied')} /> : null}

      {analyticsBrandId ? (
        summary.isPending ? (
          <SectionSkeleton rows={3} />
        ) : summary.isError ? (
          <SectionError
            title={t('loadError')}
            retryLabel={t('retry')}
            onRetry={() => void summary.refetch()}
          />
        ) : summary.data ? (
          <MetricCards
            metrics={
              details.data
                ? [...summary.data.metrics, details.data.publishedMetric]
                : summary.data.metrics
            }
          />
        ) : null
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        {analyticsBrandId && summary.data ? (
          <Card title={t('trendTitle')}>
            <div className="p-5">
              <TrendChart
                ariaLabel={t('trendTitle')}
                points={summary.data.contentInteractionsTrend}
                currentLabel={t('current')}
                comparisonLabel={query.compare === 'previous' ? t('comparison') : undefined}
              />
            </div>
          </Card>
        ) : null}
        <PublishingHealth query={publishing} />
      </div>

      <PlatformComparison
        facebookCount={counts.data?.facebook ?? 0}
        tiktokCount={counts.data?.tiktok ?? 0}
        summary={analyticsBrandId ? summary.data : undefined}
        publishedPosts={details.data?.publishedMetric.value}
      />

      {analyticsBrandId ? (
        details.isPending ? (
          <SectionSkeleton rows={4} />
        ) : details.isError ? (
          <SectionError
            title={t('loadError')}
            retryLabel={t('retry')}
            onRetry={() => void details.refetch()}
          />
        ) : (
          <TopContent posts={details.data?.topPosts ?? []} />
        )
      ) : null}
    </div>
  )
}

function NoAccountsState() {
  const { t } = useTranslation('overview')
  const navigate = useNavigate()
  return (
    <div className="py-8 md:py-16">
      <EmptyState
        title={t('noAccountsTitle')}
        description={t('noAccountsDescription')}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="primary"
              icon={<IconFacebook aria-hidden />}
              onClick={() => navigate(FACEBOOK_PATH)}
            >
              {t('connectFacebook')}
            </Button>
            <Button icon={<IconTikTok aria-hidden />} onClick={() => navigate(TIKTOK_PATH)}>
              {t('connectTikTok')}
            </Button>
          </div>
        }
      />
    </div>
  )
}

function PublishingHealth({ query }: { query: ReturnType<typeof usePlanningSummary> }) {
  const { t, i18n } = useTranslation('overview')
  const locale = i18n.resolvedLanguage as AppLocale
  const data = query.data

  return (
    <Card
      title={t('publishing.title')}
      extra={
        <Link
          to={PLANNING_PATH}
          className="rounded-sm text-label-md text-link outline-none hover:text-link-hover focus-visible:focus-ring"
        >
          {t('publishing.openPlanning')}
        </Link>
      }
    >
      {query.isPending ? (
        <div className="p-5">
          <SectionSkeleton rows={4} />
        </div>
      ) : query.isError || !data ? (
        <div className="p-5">
          <SectionError
            title={t('loadError')}
            retryLabel={t('retry')}
            onRetry={() => void query.refetch()}
          />
        </div>
      ) : (
        <dl className="divide-y divide-border-subtle">
          <HealthRow label={t('publishing.publishedInRange')} value={data.publishedInRange} />
          <HealthRow
            label={t('publishing.scheduledNext7Days')}
            value={data.scheduledNext7Days}
            hint={
              data.nextScheduledAt
                ? t('publishing.nextScheduledAt', {
                    time: formatDateTime(data.nextScheduledAt, locale),
                  })
                : t('publishing.nextScheduledNone')
            }
          />
          <HealthRow
            label={t('publishing.needsAction')}
            value={data.needsAction}
            tone={data.needsAction ? 'error' : undefined}
            action={
              data.needsAction ? (
                <Link
                  to={`${PLANNING_PATH}?view=list&statusGroup=needs_action`}
                  className="text-label-sm text-link hover:text-link-hover"
                >
                  {t('publishing.review')}
                </Link>
              ) : undefined
            }
          />
          <HealthRow label={t('publishing.inProgress')} value={data.inProgress} />
          <HealthRow label={t('publishing.drafts')} value={data.drafts} />
          <HealthRow
            label={t('publishing.pendingApproval')}
            value={data.pendingApproval}
            tone={data.pendingApproval ? 'warning' : undefined}
            action={
              data.pendingApproval ? (
                <Link
                  to={`${PLANNING_PATH}?view=list&approvalStatus=pending`}
                  className="text-label-sm text-link hover:text-link-hover"
                >
                  {t('publishing.review')}
                </Link>
              ) : undefined
            }
          />
        </dl>
      )}
    </Card>
  )
}

function HealthRow({
  label,
  value,
  hint,
  tone,
  action,
}: {
  label: string
  value: number
  hint?: string
  tone?: 'error' | 'warning'
  action?: ReactNode
}) {
  const { i18n } = useTranslation('overview')
  const valueClass =
    tone === 'error'
      ? 'text-error-700'
      : tone === 'warning'
        ? 'text-warning-700'
        : 'text-text-primary'
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <dt className="text-body-sm text-text-secondary">{label}</dt>
        {hint ? <p className="mt-0.5 text-caption text-text-tertiary">{hint}</p> : null}
      </div>
      <dd className="flex shrink-0 items-center gap-3">
        {action}
        <span className={`text-heading-4 tabular-nums ${valueClass}`}>
          {formatNumber(value, i18n.resolvedLanguage as AppLocale)}
        </span>
      </dd>
    </div>
  )
}

function PlatformComparison({
  facebookCount,
  tiktokCount,
  summary,
  publishedPosts,
}: {
  facebookCount: number
  tiktokCount: number
  summary?: { metrics: Array<{ key: string; value: number }> }
  publishedPosts?: number
}) {
  const { t, i18n } = useTranslation('overview')
  const locale = i18n.resolvedLanguage as AppLocale
  const metric = (key: string) => summary?.metrics.find((item) => item.key === key)?.value
  const format = (value?: number) => (value === undefined ? '—' : formatNumber(value, locale))

  return (
    <Card title={t('platforms.title')} background="white">
      <div className="divide-y divide-border-subtle">
        <PlatformRow
          icon={<IconFacebook className="text-icon-lg text-platform-facebook" />}
          name={t('platforms.facebook')}
          count={facebookCount}
          path={FACEBOOK_PATH}
        >
          {facebookCount > 0 ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              <PlatformStat label={t('platforms.views')} value={format(metric('mediaViews'))} />
              <PlatformStat
                label={t('platforms.interactions')}
                value={format(metric('contentInteractions'))}
              />
              <PlatformStat label={t('platforms.followers')} value={format(metric('followers'))} />
              <PlatformStat label={t('platforms.posts')} value={format(publishedPosts)} />
            </dl>
          ) : null}
        </PlatformRow>
        <PlatformRow
          icon={<IconTikTok className="text-icon-lg text-text-primary" />}
          name={t('platforms.tiktok')}
          count={tiktokCount}
          path={TIKTOK_PATH}
        >
          {tiktokCount > 0 ? (
            <p className="text-body-sm text-text-tertiary">{t('platforms.tiktokUnavailable')}</p>
          ) : null}
        </PlatformRow>
      </div>
    </Card>
  )
}

function PlatformRow({
  icon,
  name,
  count,
  path,
  children,
}: {
  icon: ReactNode
  name: string
  count: number
  path: string
  children?: ReactNode
}) {
  const { t } = useTranslation('overview')
  return (
    <div className="grid gap-4 p-5 lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-label-md text-text-primary">{name}</p>
          <p className="text-caption text-text-tertiary">
            {count > 0 ? t('platforms.connected', { count }) : t('platforms.notConnected')}
          </p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
      <Link
        to={path}
        className="justify-self-start rounded-sm text-label-md text-link outline-none hover:text-link-hover focus-visible:focus-ring lg:justify-self-end"
      >
        {count > 0 ? t('platforms.viewDetails') : t('platforms.connect')}
      </Link>
    </div>
  )
}

function PlatformStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-text-tertiary">{label}</dt>
      <dd className="text-label-md tabular-nums text-text-primary">{value}</dd>
    </div>
  )
}

function TopContent({ posts }: { posts: FacebookPostDto[] }) {
  const { t, i18n } = useTranslation('overview')
  const locale = i18n.resolvedLanguage as AppLocale

  return (
    <Card title={t('topPosts.title')} background="white">
      {posts.length === 0 ? (
        <p className="p-5 text-body-sm text-text-tertiary">{t('topPosts.empty')}</p>
      ) : (
        <ol className="divide-y divide-border-subtle">
          {posts.map((post) => (
            <li key={`${post.pageId}:${post.id}`} className="flex items-center gap-4 p-4">
              <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-bg-surface-muted">
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="size-12 object-cover"
                  />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-body-sm text-text-primary">
                  {post.message || t('topPosts.noMessage')}
                </p>
                <p className="mt-1 text-caption text-text-tertiary">
                  {post.pageName} · {formatDateTime(post.publishedAt ?? post.createdAt, locale)}
                </p>
              </div>
              <div className="hidden shrink-0 text-end sm:block">
                <p className="text-label-md tabular-nums text-text-primary">
                  {t('topPosts.interactions', {
                    value: formatNumber(post.contentInteractions, locale),
                  })}
                </p>
                <p className="text-caption tabular-nums text-text-tertiary">
                  {t('topPosts.views', { value: formatNumber(post.mediaViews, locale) })}
                </p>
              </div>
              {post.permalinkUrl ? (
                <a
                  href={post.permalinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-label-sm text-link hover:text-link-hover"
                >
                  {t('topPosts.open')}
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

/** Mirrors the analytics endpoints: presets are the last N UTC days including today. */
function resolvePeriod(
  range: DateRange,
  since: string,
  until: string,
): { since: string; until: string } {
  if (since && until) return { since, until }
  const days = Number(range.slice(0, -1))
  const end = new Date()
  const start = new Date(end.getTime() - (days - 1) * 86_400_000)
  return { since: start.toISOString().slice(0, 10), until: end.toISOString().slice(0, 10) }
}
