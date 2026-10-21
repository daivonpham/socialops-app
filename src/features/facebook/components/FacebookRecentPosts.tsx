import { useEffect, useMemo, useState } from 'react'
import { FaArrowUpRightFromSquare, FaPlay } from 'react-icons/fa6'
import { useTranslation } from 'react-i18next'
import { formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Button,
  Card,
  DataTable,
  DateRangePicker,
  Image,
  Input,
  Modal,
  Pagination,
  SectionError,
  SectionSkeleton,
  Select,
  type DataTableColumn,
  type DataTableSorting,
  type DateRangeValue,
} from '@/shared/ui'
import { useFacebookRecentPosts, type FacebookRecentPostDto, type FacebookQuery } from '../api'

const numericKeys = [
  'mediaViews',
  'reactions',
  'comments',
  'shares',
  'contentInteractions',
] as const
type SortKey = (typeof numericKeys)[number] | 'publishedAt'

export function FacebookRecentPosts({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null)
  const [contentType, setContentType] = useState<'all' | 'post' | 'reel' | 'story'>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sorting, setSorting] = useState<DataTableSorting[]>([
    { columnKey: 'publishedAt', direction: 'desc' },
  ])
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timeout)
  }, [search])
  const recent = useFacebookRecentPosts(brandId, { ...query, page: 1, limit: 12 })
  const all = useFacebookRecentPosts(
    brandId,
    {
      ...query,
      ...(dateRange ? { since: dateRange[0], until: dateRange[1] } : {}),
      page,
      limit,
      search: debouncedSearch,
      contentType,
      sortBy: (sorting[0]?.columnKey as SortKey) ?? 'publishedAt',
      sortOrder: sorting[0]?.direction ?? 'desc',
    },
    open,
  )
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
                {t(`overview.contentKind.${post.contentType ?? 'post'}`)} · {t(`overview.mediaKind.${post.mediaType}`)}
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
      ...numericKeys.map((key): DataTableColumn<FacebookRecentPostDto> => ({
        key,
        title: t(`overview.${key}`),
        width: 'compact',
        size: 112,
        minSize: 100,
        align: 'end',
        sortable: true,
        render: (_, post) => (
          <span className="tabular-nums">
            {post[key] == null ? '—' : formatNumber(post[key], locale)}
          </span>
        ),
      })),
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
    [locale, t],
  )

  return (
    <>
      <Card
        title={t('overview.recentPosts')}
        extra={
          <Button
            variant="ghost"
            icon={<FaArrowUpRightFromSquare />}
            aria-label={t('overview.viewAllPosts')}
            title={t('overview.viewAllPosts')}
            onClick={() => setOpen(true)}
          />
        }
      >
        {recent.isPending ? (
          <SectionSkeleton rows={5} />
        ) : recent.isError ? (
          <SectionError
            title={t('common.loadError')}
            retryLabel={t('common.retry')}
            onRetry={() => void recent.refetch()}
          />
        ) : (
          <DataTable
            data={recent.data?.items ?? []}
            columns={columns}
            getRowId={(post) => `${post.pageId}:${post.id}`}
            columnPersistenceKey={`facebook-recent-posts:${brandId}:v2`}
          />
        )}
      </Card>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('overview.allPosts')}
        width="min(96vw, 1500px)"
        footer={null}
      >
        <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px_160px]">
          <div className="min-w-0">
            <Input
              className="w-full"
              type="search"
              value={search}
              placeholder={t('overview.searchPosts')}
              aria-label={t('overview.searchPosts')}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="min-w-0">
            <DateRangePicker
              className="w-full"
              value={dateRange ?? undefined}
              onChange={(value) => {
                setDateRange(value)
                setPage(1)
              }}
              placeholder={[t('overview.fromDate'), t('overview.toDate')]}
            />
          </div>
          <div className="min-w-0">
            <Select
              aria-label={t('overview.filterContentType')}
              className="!w-full !min-w-0"
              showSearch={false}
              value={contentType}
              options={(['all', 'post', 'reel', 'story'] as const).map((value) => ({
                value,
                label: t(`overview.contentKind.${value}`),
              }))}
              onChange={(event) => {
                setContentType(event.target.value as typeof contentType)
                setPage(1)
              }}
            />
          </div>
        </div>
        {all.isError ? (
          <SectionError
            title={t('common.loadError')}
            retryLabel={t('common.retry')}
            onRetry={() => void all.refetch()}
          />
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            <DataTable
              data={all.data?.items ?? []}
              columns={columns}
              getRowId={(post) => `${post.pageId}:${post.id}`}
              showColumnSettings
              columnPersistenceKey={`facebook-recent-posts:${brandId}:v2`}
              manualSorting
              sorting={sorting}
              onSortingChange={(value) => {
                setSorting(value.slice(0, 1))
                setPage(1)
              }}
            />
            <div className="flex justify-end border-t border-border-subtle px-4 py-3">
              <Pagination
                current={page}
                pageSize={limit}
                total={all.data?.total ?? 0}
                pageSizeOptions={[20, 50, 100]}
                onChange={(nextPage, nextLimit) => {
                  setPage(nextLimit === limit ? nextPage : 1)
                  setLimit(Math.min(nextLimit, 100))
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
