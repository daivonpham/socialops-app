import { useEffect, useMemo, useState } from 'react'
import { FaArrowUpRightFromSquare, FaPlay } from 'react-icons/fa6'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Button,
  DataTable,
  EmptyState,
  IconInfo,
  Image,
  Input,
  Pagination,
  SectionError,
  SectionSkeleton,
  Tooltip,
  type DataTableColumn,
  type DataTableSorting,
} from '@/shared/ui'
import {
  useFacebookRecentPosts,
  type FacebookPostContentType,
  type FacebookPostSort,
  type FacebookQuery,
  type FacebookRecentPostDto,
} from '../api'
import { facebookPostDetailPath } from '../config/facebook.routes'
import { useFormatDuration } from '../model/duration'

/** The figure columns: the sort key, and the post field it shows. */
const METRIC_COLUMNS = [
  { key: 'mediaViews', field: 'mediaViews' },
  { key: 'viewers', field: 'viewers' },
  { key: 'contentInteractions', field: 'contentInteractions' },
  { key: 'reactions', field: 'reactions' },
  { key: 'comments', field: 'comments' },
  { key: 'shares', field: 'shares' },
  { key: 'clicks', field: 'clicks' },
  { key: 'linkClicks', field: 'linkClicks' },
  { key: 'newFollowers', field: 'newFollowers' },
  { key: 'videoViews', field: 'videoViews' },
  { key: 'videoViewTime', field: 'videoViewTimeMs', duration: true },
  { key: 'videoAvgTime', field: 'videoAvgTimeMs', duration: true },
] as const satisfies ReadonlyArray<{
  key: FacebookPostSort
  field: keyof FacebookRecentPostDto
  duration?: boolean
}>

const DEFAULT_LIMIT = 20

/** Every published post of the period: search, sort and page; dates and kind come from the page. */
export function FacebookPostsTab({
  brandId,
  query,
  contentType,
  onClearContentType,
}: {
  brandId: string
  query: FacebookQuery
  contentType: FacebookPostContentType
  onClearContentType: () => void
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const navigate = useNavigate()
  const formatDuration = useFormatDuration()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [sorting, setSorting] = useState<DataTableSorting[]>([
    { columnKey: 'publishedAt', direction: 'desc' },
  ])
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timeout)
  }, [search])
  // Any change to what is listed starts again from the first page.
  const listKey = JSON.stringify([query, debouncedSearch, contentType, limit, sorting])
  const [pageState, setPageState] = useState({ listKey, page: 1 })
  const page = pageState.listKey === listKey ? pageState.page : 1
  const posts = useFacebookRecentPosts(brandId, {
    ...query,
    page,
    limit,
    search: debouncedSearch,
    contentType,
    sortBy: (sorting[0]?.columnKey as FacebookPostSort) ?? 'publishedAt',
    sortOrder: sorting[0]?.direction ?? 'desc',
  })
  const columns = useMemo<DataTableColumn<FacebookRecentPostDto>[]>(
    () => [
      {
        key: 'message',
        title: t('overview.postContent'),
        width: 'content',
        size: 290,
        minSize: 230,
        render: (_, post) => (
          <div className="flex min-w-56 items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-bg-surface-muted">
              {post.thumbnailUrl ? (
                <Image
                  src={post.thumbnailUrl}
                  alt=""
                  preview={false}
                  className="size-10 object-cover"
                  wrapperClassName="size-10"
                />
              ) : null}
              {post.mediaType === 'video' ? (
                <FaPlay
                  className="absolute bottom-1 right-1 text-[10px] text-text-inverse drop-shadow"
                  aria-hidden
                />
              ) : null}
            </div>
            <span className="min-w-0">
              <span className="line-clamp-2 text-body-sm text-text-primary">
                {post.message || t('overview.noPostMessage')}
              </span>
              <span className="text-caption text-text-tertiary">
                {t(`overview.contentKind.${post.contentType ?? 'post'}`)} ·{' '}
                {t(`overview.mediaKind.${post.mediaType}`)}
              </span>
            </span>
          </div>
        ),
      },
      {
        key: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        size: 205,
        minSize: 155,
        render: (_, post) => (
          <span className="flex items-center gap-2">
            <Avatar name={post.pageName} src={post.avatarUrl} size="sm" />
            <span className="line-clamp-2">{post.pageName}</span>
          </span>
        ),
      },
      {
        key: 'publishedAt',
        title: t('overview.publishedAt'),
        width: 'wide',
        size: 175,
        minSize: 160,
        sortable: true,
        render: (_, post) => (
          <span className="whitespace-nowrap">
            {formatDateTime(post.publishedAt ?? post.createdAt, locale)}
          </span>
        ),
      },
      ...METRIC_COLUMNS.map(({ key, field, ...column }): DataTableColumn<FacebookRecentPostDto> => {
        const duration = 'duration' in column && column.duration
        return {
          key,
          label: t(`postColumns.${key}`),
          title: (
            <span className="inline-flex items-center gap-1">
              {t(`postColumns.${key}`)}
              <Tooltip title={t(`postColumns.${key}Hint`)}>
                <span
                  className="inline-flex text-text-tertiary"
                  // The hint must not sort the column it sits in.
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconInfo aria-hidden />
                </span>
              </Tooltip>
            </span>
          ),
          width: 'compact',
          size: duration ? 136 : 124,
          minSize: 100,
          align: 'end',
          sortable: true,
          render: (_, post) => {
            const value = post[field]
            return (
              <span className="whitespace-nowrap tabular-nums">
                {value == null
                  ? '—'
                  : duration
                    ? formatDuration(value)
                    : formatNumber(value, locale)}
              </span>
            )
          },
        }
      }),
      {
        key: 'link',
        title: '',
        width: 'actions',
        size: 30,
        fixed: 'right',
        reorderable: false,
        render: (_, post) =>
          post.permalinkUrl ? (
            <a
              href={post.permalinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('overview.openPost')}
              className="text-action-primary"
              onClick={(event) => event.stopPropagation()}
            >
              <FaArrowUpRightFromSquare />
            </a>
          ) : (
            '—'
          ),
      },
    ],
    [formatDuration, locale, t],
  )

  return (
    <div className="grid gap-4">
      {posts.isPending ? (
        <SectionSkeleton rows={6} />
      ) : posts.isError ? (
        <SectionError
          title={t('common.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void posts.refetch()}
        />
      ) : (
        <>
          <DataTable
            data={posts.data?.items ?? []}
            columns={columns}
            title={t('overview.allPosts')}
            toolbar={
              <Input
                className="w-[260px] max-w-full"
                type="search"
                value={search}
                placeholder={t('overview.searchPosts')}
                aria-label={t('overview.searchPosts')}
                onChange={(event) => setSearch(event.target.value)}
              />
            }
            emptyState={
              <EmptyState
                title={t('overview.noPosts')}
                description={t('overview.noPostsHint')}
                action={
                  search || contentType !== 'all' ? (
                    <Button
                      onClick={() => {
                        setSearch('')
                        onClearContentType()
                      }}
                    >
                      {t('overview.clearPostFilters')}
                    </Button>
                  ) : undefined
                }
              />
            }
            getRowId={(post) => `${post.pageId}:${post.id}`}
            // The details screen goes back to this list with the same filters.
            onRowClick={(post) =>
              navigate(facebookPostDetailPath(post.id), { state: { from: location.search } })
            }
            showColumnSettings
            columnPersistenceKey={`facebook-recent-posts:${brandId}:v3`}
            manualSorting
            sorting={sorting}
            onSortingChange={(value) => setSorting(value.slice(0, 1))}
          />
          {posts.data?.total ? (
            <div className="flex justify-end">
              <Pagination
                compact
                current={page}
                pageSize={limit}
                total={posts.data.total}
                pageSizeOptions={[20, 50, 100]}
                onChange={(nextPage, nextLimit) => {
                  if (nextLimit !== limit) setLimit(Math.min(nextLimit, 100))
                  else setPageState({ listKey, page: nextPage })
                }}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
