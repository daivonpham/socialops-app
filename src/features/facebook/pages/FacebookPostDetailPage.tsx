import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { FacebookPostPreview, type PlanningPostType } from '@/features/planning'
import { isApiErrorCode } from '@/shared/api/errors'
import { formatDateTime, type AppLocale } from '@/shared/i18n'
import { useActiveBrand } from '@/shared/scope'
import { Button, EmptyState, IconArrowLeft, IconOpen, SectionError, Spin } from '@/shared/ui'
import { useFacebookPostDetail, type FacebookPostDetailDto } from '../api'
import { FACEBOOK_ROUTES } from '../config/facebook.routes'
import { formatCompact } from '../components/dashboard/format'
import {
  ClicksCard,
  InteractionsCard,
  PostStatTiles,
  RetentionCard,
  SourcesCard,
  VideoAudienceCard,
  VideoPerformanceCard,
  ViewsOverTimeCard,
} from '../components/post-detail/PostInsightCards'

type Post = FacebookPostDetailDto['post']

const POST_TYPE: Record<Post['contentType'], PlanningPostType> = {
  post: 'facebook_feed',
  reel: 'facebook_reel',
  story: 'facebook_story',
}

/** The synced photos or video, in the shape the composer preview draws. */
function previewMedia(post: Post) {
  if (post.mediaType === 'video' && post.mediaUrl)
    return [{ id: 'video', type: 'video' as const, url: post.mediaUrl, name: post.pageName }]
  const images = post.details.media?.length
    ? post.details.media.flatMap((item) => (item.imageUrl ? [item.imageUrl] : []))
    : post.thumbnailUrl
      ? [post.thumbnailUrl]
      : []
  return images.map((url, index) => ({
    id: `image-${index}`,
    type: 'image' as const,
    url,
    name: post.pageName,
  }))
}

/** Everything SocialOps has synced for one Facebook post, laid out like Facebook's own insights. */
export default function FacebookPostDetailPage() {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const { postId } = useParams<{ postId: string }>()
  const { brandId } = useActiveBrand()
  const navigate = useNavigate()
  const location = useLocation()
  const detail = useFacebookPostDetail(brandId, postId)
  // Back to the Posts list as it was left; opened directly, back to its default view.
  const from = (location.state as { from?: string } | null)?.from
  const goBack = () =>
    navigate(`${FACEBOOK_ROUTES.OVERVIEW}${from ?? '?tab=posts'}`, { replace: Boolean(from) })

  const header = (
    <header className="flex items-start gap-3">
      <Button icon={<IconArrowLeft />} aria-label={t('postDetail.back')} onClick={goBack} />
      <div className="grid gap-1">
        <span className="text-caption text-text-tertiary">{t('postDetail.eyebrow')}</span>
        <h1 className="text-heading-2 font-semibold text-text-primary">{t('postDetail.title')}</h1>
      </div>
    </header>
  )

  if (detail.isPending)
    return (
      <div className="grid gap-6">
        {header}
        <div className="flex justify-center py-24" aria-label={t('common.loading')}>
          <Spin size="lg" />
        </div>
      </div>
    )
  if (detail.isError)
    return (
      <div className="grid gap-6">
        {header}
        {isApiErrorCode(detail.error, 'RESOURCE_NOT_FOUND') ? (
          <EmptyState
            title={t('postDetail.notFoundTitle')}
            description={t('postDetail.notFoundDescription')}
            action={<Button onClick={goBack}>{t('postDetail.back')}</Button>}
          />
        ) : (
          <SectionError
            title={t('postDetail.loadError')}
            retryLabel={t('common.retry')}
            onRetry={() => void detail.refetch()}
          />
        )}
      </div>
    )

  const { post } = detail.data
  const video = post.mediaType === 'video'
  const count = (value: number | null) => (value === null ? '—' : formatCompact(value, locale))

  return (
    <div className="grid gap-6">
      {header}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <aside className="grid gap-3 lg:sticky lg:top-6">
          <FacebookPostPreview
            fluid
            viewport="desktop"
            postType={POST_TYPE[post.contentType]}
            account={{
              id: post.pageId,
              name: post.pageName,
              avatarUrl: post.avatarUrl,
              platform: 'facebook',
            }}
            caption={post.message}
            media={previewMedia(post)}
            facts={{
              time: formatDateTime(post.publishedAt ?? post.createdAt, locale),
              reactions: count(post.reactions),
              comments: count(post.comments),
              shares: count(post.shares),
            }}
          />
          {post.permalinkUrl ? (
            <Button
              icon={<IconOpen />}
              onClick={() => window.open(post.permalinkUrl, '_blank', 'noopener,noreferrer')}
            >
              {t('postDetail.openOnFacebook')}
            </Button>
          ) : null}
          <p className="text-center text-caption text-text-tertiary">
            {t('postDetail.updatedAt', { time: formatDateTime(post.metricsUpdatedAt, locale) })}
          </p>
        </aside>
        <div className="grid min-w-0 gap-6">
          <PostStatTiles detail={detail.data} />
          <ViewsOverTimeCard detail={detail.data} />
          <div className="grid gap-6 xl:grid-cols-2">
            <InteractionsCard post={post} />
            <ClicksCard post={post} />
          </div>
          {video ? (
            <>
              <VideoPerformanceCard post={post} />
              {/* One card alone takes the full width. */}
              <div className="grid gap-6 xl:grid-cols-2 xl:[&>*:only-child]:col-span-2">
                <RetentionCard post={post} />
                <SourcesCard post={post} />
              </div>
              <VideoAudienceCard post={post} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
