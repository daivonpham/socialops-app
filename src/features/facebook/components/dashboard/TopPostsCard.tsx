import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate, type AppLocale } from '@/shared/i18n'
import { IconImage, IconPost, IconReel, IconVideo, Image, Tabs } from '@/shared/ui'
import type { FacebookDashboardDto, FacebookDashboardPostDto, FacebookPostFormat } from '../../api'
import { DashboardCard } from './DashboardCard'
import { formatCompact, formatPercent } from './format'

const SORTS = ['viewers', 'engagements', 'engagementRate'] as const
type Sort = (typeof SORTS)[number]

const FORMAT_ICON: Record<FacebookPostFormat, typeof IconPost> = {
  reel: IconReel,
  video: IconVideo,
  album: IconImage,
  photo: IconImage,
  text: IconPost,
  link: IconPost,
}

export function TopPostsCard({
  topPosts,
  className,
}: {
  topPosts: FacebookDashboardDto['topPosts']
  className?: string
}) {
  const { t } = useTranslation('facebook')
  const [sort, setSort] = useState<Sort>('viewers')
  const posts = topPosts[sort]

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.topPosts.title')}
      hint={t('dashboard.engagementRateFormula')}
      description={t('dashboard.topPosts.description')}
      extra={
        <Tabs
          value={sort}
          ariaLabel={t('dashboard.topPosts.sortBy')}
          onChange={setSort}
          options={SORTS.map((value) => ({ value, label: t(`dashboard.topPosts.${value}`) }))}
        />
      }
    >
      {posts.length ? (
        <ol className="grid gap-3">
          {posts.map((post, index) => (
            <TopPostRow key={post.id} post={post} rank={index + 1} />
          ))}
        </ol>
      ) : (
        <p className="text-body-sm text-text-tertiary">{t('dashboard.topPosts.empty')}</p>
      )}
    </DashboardCard>
  )
}

function TopPostRow({ post, rank }: { post: FacebookDashboardPostDto; rank: number }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const Icon = FORMAT_ICON[post.format]
  const stats = [
    { key: 'viewers', value: formatCompact(post.viewers, locale) },
    { key: 'views', value: formatCompact(post.views, locale) },
    { key: 'engagements', value: formatCompact(post.engagements, locale) },
    { key: 'comments', value: formatCompact(post.comments, locale) },
    { key: 'engagementRate', value: formatPercent(post.engagementRate, locale, 1), strong: true },
  ] as const
  const body = (
    <>
      <span className="w-4 shrink-0 text-center text-label-md text-text-tertiary">{rank}</span>
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-icon-md text-brand-700">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt=""
            preview={false}
            wrapperClassName="size-full"
            className="size-full object-cover"
          />
        ) : (
          <Icon aria-hidden />
        )}
      </span>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="truncate text-label-md text-text-primary">
          {post.message || t('dashboard.topPosts.noMessage')}
        </span>
        <span className="flex min-w-0 items-center gap-2 text-caption text-text-tertiary">
          <span className="shrink-0 rounded-sm bg-brand-50 px-[6px] text-brand-700">
            {t(`dashboard.formats.names.${post.format}`)}
          </span>
          <span className="truncate">
            {post.pageName} · {formatDate(post.createdAt, locale)}
          </span>
        </span>
      </span>
      <dl className="hidden shrink-0 grid-cols-5 gap-4 md:grid">
        {stats.map((stat) => (
          <div key={stat.key} className="grid w-16 justify-items-end gap-[2px]">
            <dt className="text-caption text-text-tertiary">
              {t(`dashboard.topPosts.${stat.key}`)}
            </dt>
            <dd
              className={`text-label-md tabular-nums ${'strong' in stat ? 'text-brand-700' : 'text-text-primary'}`}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </>
  )
  const className =
    'flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-2 transition-colors duration-fast'
  return (
    <li>
      {post.permalinkUrl ? (
        <a
          href={post.permalinkUrl}
          target="_blank"
          rel="noreferrer"
          title={t('dashboard.topPosts.open')}
          className={`${className} hover:bg-bg-surface-subtle focus-visible:focus-ring`}
        >
          {body}
        </a>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  )
}
