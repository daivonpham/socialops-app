import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Card,
  DataTable,
  IconComment,
  IconFacebook,
  IconHeart,
  IconImage,
  IconLink,
  IconShare,
  IconView,
  Image,
  SectionError,
  SectionSkeleton,
  type DataTableColumn,
} from '@/shared/ui'
import {
  useFacebookDetails,
  useFacebookOverviewSummary,
  type FacebookOverviewSummaryDto,
  type FacebookPostDto,
  type FacebookQuery,
} from '../api'
import { MetricCards, TrendChart } from './FacebookVisuals'

type PageRow = FacebookOverviewSummaryDto['pagePerformance'][number] & { publishedPosts: number }

export function OverviewTab({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const summary = useFacebookOverviewSummary(brandId, query)
  const details = useFacebookDetails(brandId, query)
  const columns = useMemo<DataTableColumn<PageRow>[]>(
    () => [
      {
        key: 'pageName',
        dataIndex: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        render: (_, row) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={row.pageName} src={row.avatarUrl} size="sm" />
            <span className="truncate text-label-md text-text-primary">{row.pageName}</span>
          </span>
        ),
      },
      numberColumn('mediaViews', t('overview.mediaViews'), locale),
      numberColumn('contentInteractions', t('overview.contentInteractions'), locale),
      numberColumn('followersCount', t('overview.followers'), locale),
      numberColumn('publishedPosts', t('overview.posts'), locale),
    ],
    [locale, t],
  )

  if (summary.isPending)
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={6} />
      </div>
    )
  if (summary.isError)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void summary.refetch()}
      />
    )

  const data = summary.data
  if (!data) return null
  const publishedByPage = new Map(
    details.data?.publishedPostsByPage.map((item) => [item.pageId, item.publishedPosts]) ?? [],
  )
  const pagePerformance = data.pagePerformance.map((row) => ({
    ...row,
    publishedPosts: publishedByPage.get(row.pageId) ?? 0,
  }))
  const metrics = details.data ? [...data.metrics, details.data.publishedMetric] : data.metrics
  return (
    <div className="grid gap-6">
      <MetricCards metrics={metrics} />

      <Card title={t('overview.interactionsTrendTitle')}>
        <div className="p-5">
          <TrendChart
            ariaLabel={t('overview.interactionsTrendTitle')}
            points={data.contentInteractionsTrend}
            currentLabel={t('overview.current')}
            comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
          />
        </div>
      </Card>

      {details.isPending ? <SectionSkeleton rows={4} /> : null}
      {details.isError ? (
        <SectionError
          title={t('common.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void details.refetch()}
        />
      ) : null}

      {query.pageId === 'all' && details.data ? (
        <Card title={t('overview.pagePerformance')} background="white">
          <DataTable data={pagePerformance} columns={columns} getRowId={(row) => row.pageId} />
        </Card>
      ) : null}

      {details.data ? (
        <Card title={t('overview.topPosts')}>
          <div className="divide-y divide-border-subtle">
            {details.data.topPosts.map((post, index) => (
              <TopPost key={post.id} post={post} rank={index + 1} locale={locale} />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}

function numberColumn(
  key: keyof PageRow,
  title: string,
  locale: AppLocale,
): DataTableColumn<PageRow> {
  return {
    key: String(key),
    dataIndex: key,
    title,
    width: 'default',
    align: 'end',
    render: (value) => (
      <span className="text-body-sm tabular-nums text-text-primary">
        {formatNumber(Number(value), locale)}
      </span>
    ),
  }
}

function TopPost({
  post,
  rank,
  locale,
}: {
  post: FacebookPostDto
  rank: number
  locale: AppLocale
}) {
  const { t } = useTranslation('facebook')
  return (
    <article className="grid gap-4 px-5 py-4 sm:grid-cols-[auto_112px_minmax(0,1fr)] sm:items-center">
      <span className="w-5 text-center text-label-sm tabular-nums text-text-tertiary">{rank}</span>
      <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg bg-bg-surface-muted text-icon-md text-text-tertiary">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.message || post.pageName}
            preview={false}
            className="h-20 w-28 object-cover"
            wrapperClassName="h-20 w-28"
          />
        ) : (
          <IconImage />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <p className="line-clamp-2 text-body-sm text-text-primary">
            {post.message || t('overview.noPostMessage')}
          </p>
          {post.permalinkUrl ? (
            <a
              href={post.permalinkUrl}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1 text-label-sm text-action-primary hover:text-action-primary-hover"
            >
              <IconLink />
              {t('overview.openPost')}
            </a>
          ) : null}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-caption text-text-tertiary">
          <span className="flex items-center gap-1">
            <IconFacebook className="text-platform-facebook" />
            {post.pageName}
          </span>
          <span aria-hidden>·</span>
          <span>{formatDateTime(post.publishedAt ?? post.createdAt, locale)}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          <PostMetric
            icon={<IconView />}
            label={t('overview.mediaViews')}
            value={post.mediaViews}
          />
          <PostMetric
            icon={<IconHeart />}
            label={t('overview.reactions')}
            value={post.reactions ?? 0}
          />
          <PostMetric
            icon={<IconComment />}
            label={t('overview.comments')}
            value={post.comments ?? 0}
          />
          <PostMetric icon={<IconShare />} label={t('overview.shares')} value={post.shares ?? 0} />
          <PostMetric
            icon={<IconHeart />}
            label={t('overview.contentInteractions')}
            value={post.contentInteractions}
          />
        </div>
      </div>
    </article>
  )
}

function PostMetric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  const { i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  return (
    <span className="flex items-center gap-2 text-caption text-text-tertiary">
      <span className="text-text-disabled">{icon}</span>
      <strong className="text-label-sm tabular-nums text-text-primary">
        {formatNumber(value, locale)}
      </strong>
      {label}
    </span>
  )
}
