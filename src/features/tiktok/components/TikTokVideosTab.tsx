import { useEffect, useMemo, useState } from 'react'
import { FaArrowUpRightFromSquare, FaPlay } from 'react-icons/fa6'
import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import { formatPercent } from '@/shared/lib/analyticsFormat'
import {
  Avatar,
  Button,
  DataTable,
  EmptyState,
  IconInfo,
  IconSparkles,
  Image,
  Input,
  Pagination,
  SectionError,
  Spin,
  Tooltip,
  type DataTableColumn,
  type DataTableSorting,
} from '@/shared/ui'
import {
  useTikTokVideos,
  type TikTokQuery,
  type TikTokVideoItemDto,
  type TikTokVideoSort,
} from '../api'
import { tiktokVideoDetailPath } from '../config/tiktok.routes'
import { formatVideoLength } from '../model/format'

/** Figure columns: the sort key, the field it shows, and whether it has a hint. */
const METRIC_COLUMNS = [
  { key: 'views', hint: true },
  { key: 'likes' },
  { key: 'comments' },
  { key: 'shares' },
  { key: 'engagementRate', hint: true, percent: true },
] as const satisfies ReadonlyArray<{
  key: TikTokVideoSort & keyof TikTokVideoItemDto
  hint?: boolean
  percent?: boolean
}>

const DEFAULT_LIMIT = 20

/** Every public video posted in the period: search, sort and page; dates come from the page. */
export function TikTokVideosTab({ brandId, query }: { brandId: string; query: TikTokQuery }) {
  const { t, i18n } = useTranslation('tiktok')
  const errorMessage = useApiErrorMessage('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [sorting, setSorting] = useState<DataTableSorting[]>([
    { columnKey: 'createdTime', direction: 'desc' },
  ])
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timeout)
  }, [search])
  // Any change to what is listed starts again from the first page.
  const listKey = JSON.stringify([query, debouncedSearch, limit, sorting])
  const [pageState, setPageState] = useState({ listKey, page: 1 })
  const page = pageState.listKey === listKey ? pageState.page : 1
  const videos = useTikTokVideos(brandId, {
    ...query,
    page,
    limit,
    search: debouncedSearch,
    sortBy: (sorting[0]?.columnKey as TikTokVideoSort) ?? 'createdTime',
    sortOrder: sorting[0]?.direction ?? 'desc',
  })

  const columns = useMemo<DataTableColumn<TikTokVideoItemDto>[]>(
    () => [
      {
        key: 'video',
        title: t('videos.columns.video'),
        width: 'content',
        size: 300,
        minSize: 230,
        render: (_, video) => (
          <div className="flex min-w-56 items-center gap-3">
            {/* TikTok covers are 9:16. */}
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-bg-surface-muted">
              {video.coverImageUrl ? (
                <Image
                  src={video.coverImageUrl}
                  alt=""
                  preview={false}
                  className="h-14 w-10 object-cover"
                  wrapperClassName="h-14 w-10"
                />
              ) : null}
              <FaPlay
                className="absolute bottom-1 right-1 text-[10px] text-text-inverse drop-shadow"
                aria-hidden
              />
            </div>
            <span className="min-w-0">
              <span className="line-clamp-2 text-body-sm text-text-primary">
                {video.title || video.description || t('videos.noTitle')}
              </span>
              {video.isAigc ? (
                <span className="mt-1 inline-flex items-center gap-1 text-caption text-text-tertiary">
                  <IconSparkles aria-hidden />
                  {t('videos.aigc')}
                </span>
              ) : null}
            </span>
          </div>
        ),
      },
      {
        key: 'account',
        title: t('videos.columns.account'),
        width: 'wide',
        size: 205,
        minSize: 155,
        render: (_, video) => (
          <span className="flex items-center gap-2">
            <Avatar name={video.accountName} src={video.accountAvatarUrl} size="sm" />
            <span className="grid min-w-0">
              <span className="line-clamp-1">{video.accountName}</span>
              {video.accountUsername ? (
                <span className="truncate text-caption text-text-tertiary">
                  @{video.accountUsername}
                </span>
              ) : null}
            </span>
          </span>
        ),
      },
      {
        key: 'createdTime',
        title: t('videos.columns.publishedAt'),
        width: 'wide',
        size: 175,
        minSize: 160,
        sortable: true,
        render: (_, video) => (
          <span className="whitespace-nowrap">{formatDateTime(video.createdAt, locale)}</span>
        ),
      },
      {
        key: 'duration',
        title: t('videos.columns.duration'),
        width: 'compact',
        size: 132,
        minSize: 120,
        align: 'end',
        sortable: true,
        render: (_, video) => (
          <span className="tabular-nums">{formatVideoLength(video.duration)}</span>
        ),
      },
      {
        key: 'orientation',
        title: t('videos.columns.orientation'),
        width: 'compact',
        size: 132,
        minSize: 120,
        render: (_, video) =>
          video.orientation ? t(`videos.orientation.${video.orientation}`) : '—',
      },
      ...METRIC_COLUMNS.map((column): DataTableColumn<TikTokVideoItemDto> => {
        const hint = 'hint' in column && column.hint
        const percent = 'percent' in column && column.percent
        return {
          key: column.key,
          label: t(`videos.columns.${column.key}`),
          title: hint ? (
            <span className="inline-flex items-center gap-1">
              {t(`videos.columns.${column.key}`)}
              <Tooltip title={t(`videos.hints.${column.key as 'views' | 'engagementRate'}`)}>
                <span
                  className="inline-flex text-text-tertiary"
                  // The hint must not sort the column it sits in.
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconInfo aria-hidden />
                </span>
              </Tooltip>
            </span>
          ) : (
            t(`videos.columns.${column.key}`)
          ),
          width: 'compact',
          size: 148,
          minSize: 132,
          align: 'end',
          sortable: true,
          render: (_, video) => (
            <span className="whitespace-nowrap tabular-nums">
              {percent
                ? formatPercent(video[column.key], locale)
                : formatNumber(video[column.key], locale)}
            </span>
          ),
        }
      }),
      {
        key: 'link',
        title: '',
        width: 'actions',
        size: 30,
        fixed: 'right',
        reorderable: false,
        render: (_, video) =>
          video.shareUrl ? (
            <a
              href={video.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('videos.open')}
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
    [locale, t],
  )

  return (
    <div className="grid gap-4">
      {videos.isPending ? (
        <div role="status" aria-label={t('common.loading')} className="flex justify-center py-16">
          <Spin size="lg" />
        </div>
      ) : videos.isError ? (
        <SectionError
          title={errorMessage(videos.error, t('common.loadError'))}
          retryLabel={t('common.retry')}
          onRetry={() => void videos.refetch()}
        />
      ) : (
        <>
          <DataTable
            data={videos.data?.items ?? []}
            columns={columns}
            title={t('videos.title')}
            toolbar={
              <Input
                className="w-[260px] max-w-full"
                type="search"
                value={search}
                placeholder={t('videos.search')}
                aria-label={t('videos.search')}
                onChange={(event) => setSearch(event.target.value)}
              />
            }
            emptyState={
              <EmptyState
                title={t('videos.empty')}
                description={t('videos.emptyDescription')}
                action={
                  search ? (
                    <Button onClick={() => setSearch('')}>{t('videos.clear')}</Button>
                  ) : undefined
                }
              />
            }
            getRowId={(video) => `${video.accountId}:${video.id}`}
            // The details screen goes back to this list with the same filters.
            onRowClick={(video) =>
              navigate(tiktokVideoDetailPath(video.id), { state: { from: location.search } })
            }
            showColumnSettings
            columnPersistenceKey={`tiktok-videos:${brandId}:v2`}
            manualSorting
            sorting={sorting}
            onSortingChange={(value) => setSorting(value.slice(0, 1))}
          />
          {videos.data?.total ? (
            <div className="flex justify-end">
              <Pagination
                compact
                current={page}
                pageSize={limit}
                total={videos.data.total}
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
