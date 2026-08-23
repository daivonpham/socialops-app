import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import { hasPermission, usePermissions } from '@/shared/permissions'
import {
  Button,
  Checkbox,
  DataTable,
  Drawer,
  EmptyState,
  IconClose,
  IconFacebook,
  IconImage,
  IconPlus,
  IconSend,
  IconView,
  Input,
  SectionError,
  SectionSkeleton,
  Select,
  StatusTag,
  Textarea,
  type DataTableColumn,
} from '@/shared/ui'
import {
  useCreateFacebookPost,
  useFacebookPosts,
  type FacebookIntegrationDto,
  type FacebookPostDto,
  type FacebookPostQuery,
  type PostStatus,
} from '../api'
import { FACEBOOK_ACCESS } from '../config/facebook-access'
import { POST_TONE } from '../model/status'

export function PostsTab({
  brandId,
  integration,
  query,
  onChange,
}: {
  brandId: string
  integration: FacebookIntegrationDto
  query: FacebookPostQuery
  onChange: (patch: Partial<Record<'pageId' | 'status' | 'keyword' | 'page', string>>) => void
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const posts = useFacebookPosts(brandId, query)
  const [selectedPost, setSelectedPost] = useState<FacebookPostDto | null>(null)
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [visibility, setVisibility] = useState<Record<string, boolean>>({ clicks: false })
  const [composerOpen, setComposerOpen] = useState(false)
  const columns = useMemo<DataTableColumn<FacebookPostDto>[]>(
    () => [
      {
        key: 'caption',
        dataIndex: 'caption',
        title: t('posts.caption'),
        width: 'content',
        sortable: true,
        render: (_, row) => (
          <div className="flex max-w-narrow items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-surface-muted text-text-tertiary">
              <IconImage />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-label-md text-text-primary">{row.caption}</p>
              <span className="text-caption text-text-tertiary">{row.pageName}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        dataIndex: 'status',
        title: t('posts.status'),
        width: 'default',
        sortable: true,
        render: (value) => {
          const status = value as PostStatus
          return <StatusTag tone={POST_TONE[status]}>{t(`postStatus.${status}`)}</StatusTag>
        },
      },
      {
        key: 'publishedAt',
        dataIndex: 'publishedAt',
        title: t('posts.publishedAt'),
        width: 'wide',
        sortable: true,
        render: (value) => (
          <span className="whitespace-nowrap text-text-secondary">
            {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
              new Date(String(value)),
            )}
          </span>
        ),
      },
      {
        key: 'reach',
        dataIndex: 'reach',
        title: t('posts.reach'),
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
        title: t('posts.engagement'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'clicks',
        dataIndex: 'clicks',
        title: t('posts.clicks'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'actions',
        title: t('common.actions'),
        width: 'actions',
        align: 'center',
        hideable: false,
        reorderable: false,
        resizable: false,
        render: (_, row) => (
          <Button
            size="sm"
            variant="ghost"
            icon={<IconView />}
            aria-label={t('posts.rowAction')}
            onClick={(event) => {
              event.stopPropagation()
              setSelectedPost(row)
            }}
          />
        ),
      },
    ],
    [locale, t],
  )

  const data = posts.data
  const selectedCount = Object.values(selection).filter(Boolean).length
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-heading-3 text-text-primary">{t('posts.title')}</h2>
          <p className="mt-1 text-body-sm text-text-tertiary">{t('posts.description')}</p>
        </div>
        <PublishButton onClick={() => setComposerOpen(true)} />
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Input
          value={query.keyword}
          onChange={(event) => onChange({ keyword: event.target.value, page: '1' })}
          placeholder={t('posts.searchPlaceholder')}
          className="lg:max-w-narrow"
        />
        <Select
          aria-label={t('common.page')}
          value={query.pageId}
          onChange={(event) => onChange({ pageId: event.target.value, page: '1' })}
          options={[
            { value: 'all', label: t('common.allPages') },
            ...integration.pages.map((page) => ({ value: page.id, label: page.name })),
          ]}
        />
        <Select
          aria-label={t('posts.status')}
          value={query.status}
          onChange={(event) => onChange({ status: event.target.value, page: '1' })}
          options={[
            { value: 'all', label: t('posts.allStatuses') },
            ...(['draft', 'scheduled', 'publishing', 'published', 'failed'] as const).map(
              (status) => ({ value: status, label: t(`postStatus.${status}`) }),
            ),
          ]}
        />
      </div>
      {selectedCount ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-action-subtle p-3">
          <strong className="text-label-md text-action-text">
            {t('common.selected', { count: selectedCount })}
          </strong>
          <Button size="sm">{t('posts.bulkExport')}</Button>
          <Button size="sm">{t('posts.bulkRetry')}</Button>
          <Button size="sm" variant="ghost" icon={<IconClose />} onClick={() => setSelection({})}>
            {t('common.clear')}
          </Button>
        </div>
      ) : null}
      {posts.isPending ? (
        <SectionSkeleton rows={7} />
      ) : posts.isError ? (
        <SectionError
          title={t('common.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void posts.refetch()}
        />
      ) : data && data.items.length ? (
        <>
          <DataTable
            data={data.items}
            columns={columns}
            getRowId={(row) => row.id}
            rowSelection={selection}
            onRowSelectionChange={setSelection}
            columnVisibility={visibility}
            onColumnVisibilityChange={setVisibility}
            columnPersistenceKey="facebook-posts"
            showColumnSettings
            onRowClick={setSelectedPost}
          />
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="text-caption text-text-tertiary">
              {t('common.showing', {
                from: (data.page - 1) * data.pageSize + 1,
                to: Math.min(data.page * data.pageSize, data.total),
                total: data.total,
              })}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={data.page <= 1}
                onClick={() => onChange({ page: String(data.page - 1) })}
              >
                {t('common.previous')}
              </Button>
              <Button
                size="sm"
                disabled={data.page * data.pageSize >= data.total}
                onClick={() => onChange({ page: String(data.page + 1) })}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<IconFacebook />}
          title={t('posts.noPostsTitle')}
          description={t('posts.noPostsDescription')}
          action={<PublishButton onClick={() => setComposerOpen(true)} />}
        />
      )}
      <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} locale={locale} />
      <PostComposer
        brandId={brandId}
        integration={integration}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  )
}

function PublishButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('facebook')
  const { granted } = usePermissions()
  const allowed = hasPermission(granted, FACEBOOK_ACCESS.publish[0])
  return (
    <div>
      <Button variant="primary" icon={<IconPlus />} disabled={!allowed} onClick={onClick}>
        {t('posts.create')}
      </Button>
      {!allowed ? (
        <p className="mt-1 text-caption text-error-700">{t('common.noPermission')}</p>
      ) : null}
    </div>
  )
}

function PostDetail({
  post,
  onClose,
  locale,
}: {
  post: FacebookPostDto | null
  onClose: () => void
  locale: AppLocale
}) {
  const { t } = useTranslation('facebook')
  const performance = [
    { key: 'posts.reach' as const, value: post?.reach ?? 0 },
    { key: 'posts.engagement' as const, value: post?.engagement ?? 0 },
    { key: 'posts.clicks' as const, value: post?.clicks ?? 0 },
  ]
  return (
    <Drawer
      open={Boolean(post)}
      onClose={onClose}
      placement="right"
      width="normal"
      title={t('posts.detailTitle')}
    >
      {post ? (
        <div className="grid gap-5 p-4">
          <div className="flex h-48 items-center justify-center rounded-xl bg-bg-surface-muted text-icon-lg text-text-tertiary">
            <IconImage />
          </div>
          <div>
            <StatusTag tone={POST_TONE[post.status]}>{t(`postStatus.${post.status}`)}</StatusTag>
            <p className="mt-3 text-body-md text-text-primary">{post.caption}</p>
            <p className="mt-2 text-caption text-text-tertiary">
              {new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
                new Date(post.publishedAt),
              )}
            </p>
          </div>
          <div>
            <h3 className="text-heading-4 text-text-primary">{t('posts.performance')}</h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {performance.map((item) => (
                <div key={item.key} className="rounded-lg bg-bg-surface-muted p-3">
                  <strong className="block text-heading-3 tabular-nums">
                    {formatNumber(item.value, locale)}
                  </strong>
                  <span className="text-caption text-text-tertiary">{t(item.key)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="text-label-sm text-text-tertiary">{t('posts.destination')}</span>
            <p className="mt-1 flex items-center gap-2 text-label-md">
              <IconFacebook />
              {post.pageName}
            </p>
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}

function PostComposer({
  brandId,
  integration,
  open,
  onClose,
}: {
  brandId: string
  integration: FacebookIntegrationDto
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('facebook')
  const create = useCreateFacebookPost(brandId)
  const [pageIds, setPageIds] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const submit = (publishNow: boolean) =>
    create.mutate(
      { brandId, pageIds, caption, publishNow },
      {
        onSuccess: () => {
          setCaption('')
          setPageIds([])
          onClose()
        },
      },
    )
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width="wide"
      title={t('posts.composerTitle')}
    >
      <div className="grid gap-5 p-4">
        <p className="text-body-sm text-text-tertiary">{t('posts.composerDescription')}</p>
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-label-md text-text-secondary">
            {t('posts.chooseDestinations')}
          </legend>
          {integration.pages.map((page) => (
            <Checkbox
              key={page.id}
              checked={pageIds.includes(page.id)}
              disabled={page.health !== 'connected'}
              onChange={(event) =>
                setPageIds((current) =>
                  event.target.checked
                    ? [...current, page.id]
                    : current.filter((id) => id !== page.id),
                )
              }
            >
              {page.name}
            </Checkbox>
          ))}
        </fieldset>
        <Textarea
          label={t('posts.captionLabel')}
          placeholder={t('posts.captionPlaceholder')}
          value={caption}
          maxLength={63206}
          hint={`${caption.length} / 63,206`}
          onChange={(event) => setCaption(event.target.value)}
        />
        <div className="rounded-xl border border-border-subtle bg-bg-surface-subtle p-4">
          <span className="flex items-center gap-2 text-label-md">
            <IconFacebook /> Facebook
          </span>
          <p className="mt-3 whitespace-pre-wrap text-body-sm text-text-secondary">
            {caption || t('posts.captionPlaceholder')}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            disabled={!caption || !pageIds.length}
            loading={create.isPending}
            onClick={() => submit(false)}
          >
            {t('posts.schedule')}
          </Button>
          <Button
            variant="primary"
            icon={<IconSend />}
            disabled={!caption || !pageIds.length}
            loading={create.isPending}
            onClick={() => submit(true)}
          >
            {t('posts.publishNow')}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
