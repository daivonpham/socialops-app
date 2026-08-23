import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  DataTable,
  EmptyState,
  IconFacebook,
  IconImage,
  SectionError,
  SectionSkeleton,
  StatusTag,
  type DataTableColumn,
} from '@/shared/ui'
import {
  useFacebookOverview,
  type FacebookPostDto,
  type FacebookQuery,
  type FacebookOverviewDto,
} from '../api'
import { MetricCards, TrendChart } from './FacebookVisuals'

type PageRow = FacebookOverviewDto['pagePerformance'][number]

export function OverviewTab({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const overview = useFacebookOverview(brandId, query)
  const columns = useMemo<DataTableColumn<PageRow>[]>(
    () => [
      {
        key: 'pageName',
        dataIndex: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        sortable: true,
        render: (_, row) => (
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-info-50 text-platform-facebook">
              <IconFacebook />
            </span>
            <strong className="truncate text-label-md text-text-primary">{row.pageName}</strong>
          </span>
        ),
      },
      {
        key: 'reach',
        dataIndex: 'reach',
        title: t('overview.reach'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'engagement',
        dataIndex: 'engagement',
        title: t('overview.engagement'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'followers',
        dataIndex: 'followers',
        title: t('overview.followers'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'posts',
        dataIndex: 'posts',
        title: t('overview.posts'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
    ],
    [locale, t],
  )

  if (overview.isPending)
    return (
      <div className="grid gap-5">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={6} />
      </div>
    )
  if (overview.isError)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void overview.refetch()}
      />
    )
  const data = overview.data
  if (!data) return null
  if (!data.metrics.length)
    return (
      <EmptyState title={t('overview.noDataTitle')} description={t('overview.noDataDescription')} />
    )

  return (
    <div className="grid gap-5">
      <MetricCards metrics={data.metrics} />
      <section className="rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs">
        <SectionHeading
          title={t('overview.trendTitle')}
          description={t('overview.trendDescription')}
        />
        <div className="mt-4">
          <TrendChart
            points={data.trend}
            currentLabel={t('overview.current')}
            comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
          />
        </div>
      </section>
      <section>
        <SectionHeading
          title={t('overview.pagePerformance')}
          description={t('overview.pagePerformanceDescription')}
        />
        <div className="mt-4">
          <DataTable data={data.pagePerformance} columns={columns} getRowId={(row) => row.pageId} />
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <SectionHeading
            title={t('overview.topPosts')}
            description={t('overview.topPostsDescription')}
          />
          <div className="mt-4 grid gap-3">
            {data.topPosts.map((post) => (
              <TopPost key={post.id} post={post} locale={locale} />
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
          <SectionHeading
            title={t('overview.publishingHealth')}
            description={t('overview.publishingDescription')}
          />
          <div className="mt-4 grid gap-4">
            <HealthRow
              label={t('overview.published')}
              value={data.publishingHealth.published}
              tone="success"
            />
            <HealthRow
              label={t('overview.scheduled')}
              value={data.publishingHealth.scheduled}
              tone="info"
            />
            <HealthRow
              label={t('overview.failed')}
              value={data.publishingHealth.failed}
              tone="error"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-heading-3 text-text-primary">{title}</h2>
      <p className="mt-1 text-body-sm text-text-tertiary">{description}</p>
    </div>
  )
}

function TopPost({ post, locale }: { post: FacebookPostDto; locale: AppLocale }) {
  const { t } = useTranslation('facebook')
  return (
    <article className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-bg-surface-muted text-icon-lg text-text-tertiary">
        <IconImage />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-label-md text-text-primary">{post.caption}</p>
        <p className="mt-1 text-caption text-text-tertiary">{post.pageName}</p>
      </div>
      <div className="hidden text-end sm:block">
        <strong className="block text-heading-4 tabular-nums">
          {formatNumber(post.reach, locale)}
        </strong>
        <span className="text-caption text-text-tertiary">{t('overview.reach')}</span>
      </div>
    </article>
  )
}

function HealthRow({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'info' | 'error'
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle pb-3 last:border-0 last:pb-0">
      <StatusTag tone={tone}>{label}</StatusTag>
      <strong className="text-heading-4 tabular-nums text-text-primary">{value}</strong>
    </div>
  )
}
