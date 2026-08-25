import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCreateFacebookPost,
  useFacebookPosts,
  type FacebookIntegrationDto,
  type FacebookPostDto,
  type FacebookPostQuery,
  type PostStatus,
} from '@/features/facebook'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import { hasPermission, usePermissions } from '@/shared/permissions'
import {
  Button,
  Checkbox,
  DataTable,
  Drawer,
  EmptyState,
  FilterDropdown,
  IconFacebook,
  IconImage,
  IconPlus,
  IconSend,
  IconView,
  Input,
  Select,
  StatusTag,
  Textarea,
  type DataTableColumn,
} from '@/shared/ui'
import { PLANNING_ACCESS } from '../config/planning-access'
import { POST_STATUS_TONE } from '../model/post-status'

const POST_STATUSES: PostStatus[] = ['draft', 'scheduled', 'publishing', 'published', 'failed']
const MIN_SCHEDULE_DELAY_MS = 10 * 60 * 1000
const MAX_SCHEDULE_DELAY_MS = 75 * 24 * 60 * 60 * 1000

type FilterPatch = Partial<Record<'pageId' | 'status' | 'keyword' | 'page', string>>

export function FacebookPostsPanel({
  brandId,
  integration,
  query,
  onChange,
}: {
  brandId: string
  integration: FacebookIntegrationDto
  query: FacebookPostQuery
  onChange: (patch: FilterPatch) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const locale = i18n.resolvedLanguage as AppLocale
  const posts = useFacebookPosts(brandId, query)
  const [selectedPost, setSelectedPost] = useState<FacebookPostDto | null>(null)
  const [visibility, setVisibility] = useState<Record<string, boolean>>({ clicks: false })
  const [composerOpen, setComposerOpen] = useState(false)
  const [draftPageId, setDraftPageId] = useState(query.pageId)
  const [draftStatus, setDraftStatus] = useState(query.status)
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
    [locale],
  )
  const columns = useMemo<DataTableColumn<FacebookPostDto>[]>(
    () => [
      {
        key: 'message',
        dataIndex: 'message',
        title: t('posts.message'),
        width: 'content',
        sortable: true,
        render: (_, row) => (
          <div className="flex max-w-narrow items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-surface-muted text-text-tertiary">
              <IconImage />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-label-md text-text-primary">{row.message}</p>
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
          return <StatusTag tone={POST_STATUS_TONE[status]}>{t(`postStatus.${status}`)}</StatusTag>
        },
      },
      {
        key: 'date',
        title: t('posts.date'),
        width: 'wide',
        render: (_, row) => (
          <span className="whitespace-nowrap text-text-secondary">
            {dateFormatter.format(new Date(getPostDate(row)))}
          </span>
        ),
      },
      {
        key: 'mediaViews',
        dataIndex: 'mediaViews',
        title: t('posts.mediaViews'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'contentInteractions',
        dataIndex: 'contentInteractions',
        title: t('posts.contentInteractions'),
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
        title: t('posts.actions'),
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
    [dateFormatter, locale, t],
  )

  const data = posts.data

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-heading-3 text-text-primary">{t('posts.title')}</h2>
          <p className="mt-1 text-body-sm text-text-tertiary">{t('posts.description')}</p>
        </div>
        <PublishButton onClick={() => setComposerOpen(true)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Input
          type="search"
          value={query.keyword}
          onChange={(event) => onChange({ keyword: event.target.value, page: '1' })}
          placeholder={t('posts.searchPlaceholder')}
          className="w-full sm:max-w-narrow"
          aria-label={t('posts.searchPlaceholder')}
        />
        <FilterDropdown
          onOpenChange={(open) => {
            if (!open) return
            setDraftPageId(query.pageId)
            setDraftStatus(query.status)
          }}
          onReset={() => {
            setDraftPageId('all')
            setDraftStatus('all')
          }}
          onApply={() => onChange({ pageId: draftPageId, status: draftStatus, page: '1' })}
        >
          <Select
            label={t('posts.page')}
            value={draftPageId}
            onChange={(event) => setDraftPageId(event.target.value)}
            options={[
              { value: 'all', label: t('posts.allPages') },
              ...integration.pages.map((page) => ({ value: page.id, label: page.name })),
            ]}
          />
          <Select
            label={t('posts.status')}
            value={draftStatus}
            onChange={(event) => setDraftStatus(event.target.value)}
            options={[
              { value: 'all', label: t('posts.allStatuses') },
              ...POST_STATUSES.map((status) => ({
                value: status,
                label: t(`postStatus.${status}`),
              })),
            ]}
          />
        </FilterDropdown>
      </div>

      {posts.isPending ? (
        <EmptyState title={t('posts.loadingTitle')} description={t('posts.loadingDescription')} />
      ) : posts.isError ? (
        <EmptyState
          title={t('posts.loadErrorTitle')}
          description={t('posts.loadErrorDescription')}
          action={<Button onClick={() => void posts.refetch()}>{t('states.retry')}</Button>}
        />
      ) : data && data.items.length ? (
        <>
          <DataTable
            data={data.items}
            columns={columns}
            getRowId={(row) => row.id}
            columnVisibility={visibility}
            onColumnVisibilityChange={setVisibility}
            columnPersistenceKey="planning-facebook-posts"
            showColumnSettings
            onRowClick={setSelectedPost}
          />
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="text-caption text-text-tertiary">
              {t('posts.showing', {
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
                {t('posts.previous')}
              </Button>
              <Button
                size="sm"
                disabled={data.page * data.pageSize >= data.total}
                onClick={() => onChange({ page: String(data.page + 1) })}
              >
                {t('posts.next')}
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
  const { t } = useTranslation('planning')
  const { granted } = usePermissions()
  const allowed = hasPermission(granted, PLANNING_ACCESS.publish[0])

  return (
    <div>
      <Button variant="primary" icon={<IconPlus />} disabled={!allowed} onClick={onClick}>
        {t('posts.create')}
      </Button>
      {!allowed ? (
        <p className="mt-1 text-caption text-error-700">{t('composer.noPermission')}</p>
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
  const { t } = useTranslation('planning')
  const performance = [
    { key: 'posts.mediaViews' as const, value: post?.mediaViews ?? 0 },
    { key: 'posts.contentInteractions' as const, value: post?.contentInteractions ?? 0 },
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
            <StatusTag tone={POST_STATUS_TONE[post.status]}>
              {t(`postStatus.${post.status}`)}
            </StatusTag>
            <p className="mt-3 text-body-md text-text-primary">{post.message}</p>
            <p className="mt-2 text-caption text-text-tertiary">
              {new Intl.DateTimeFormat(locale, {
                dateStyle: 'long',
                timeStyle: 'short',
              }).format(new Date(getPostDate(post)))}
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
  const { t } = useTranslation('planning')
  const create = useCreateFacebookPost(brandId)
  const [pageIds, setPageIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const scheduleLimits = useMemo(() => getScheduleLimits(), [open])
  const scheduledTime = new Date(scheduledAt).getTime()
  const scheduleValid =
    scheduledAt.length > 0 &&
    Number.isFinite(scheduledTime) &&
    scheduledTime >= Date.now() + MIN_SCHEDULE_DELAY_MS &&
    scheduledTime <= Date.now() + MAX_SCHEDULE_DELAY_MS
  const canSubmit = message.trim().length > 0 && pageIds.length > 0

  const resetAndClose = () => {
    setMessage('')
    setPageIds([])
    setScheduledAt('')
    onClose()
  }
  const submit = (publishNow: boolean) => {
    if (!canSubmit || (!publishNow && !scheduleValid)) return
    create.mutate(
      {
        brandId,
        pageIds,
        message: message.trim(),
        publishNow,
        ...(publishNow ? {} : { scheduledAt: new Date(scheduledAt).toISOString() }),
      },
      { onSuccess: resetAndClose },
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width="wide"
      title={t('composer.title')}
    >
      <div className="grid gap-5 p-4">
        <p className="text-body-sm text-text-tertiary">{t('composer.description')}</p>
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-label-md text-text-secondary">
            {t('composer.destinations')}
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
          label={t('composer.messageLabel')}
          placeholder={t('composer.messagePlaceholder')}
          value={message}
          maxLength={63206}
          hint={`${message.length} / 63,206`}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div>
          <Input
            id="facebook-scheduled-at"
            type="datetime-local"
            label={t('composer.scheduledAtLabel')}
            hint={t('composer.scheduledAtHint')}
            value={scheduledAt}
            min={scheduleLimits.min}
            max={scheduleLimits.max}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
          {scheduledAt && !scheduleValid ? (
            <p className="mt-1 text-caption text-error-700">{t('composer.scheduledAtError')}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-surface-subtle p-4">
          <span className="flex items-center gap-2 text-label-md">
            <IconFacebook /> Facebook
          </span>
          <p className="mt-3 whitespace-pre-wrap text-body-sm text-text-secondary">
            {message || t('composer.messagePlaceholder')}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('composer.cancel')}</Button>
          <Button
            disabled={!canSubmit || !scheduleValid}
            loading={create.isPending}
            onClick={() => submit(false)}
          >
            {t('composer.schedule')}
          </Button>
          <Button
            variant="primary"
            icon={<IconSend />}
            disabled={!canSubmit}
            loading={create.isPending}
            onClick={() => submit(true)}
          >
            {t('composer.publishNow')}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

function getPostDate(post: FacebookPostDto) {
  if (post.status === 'scheduled' && post.scheduledAt) return post.scheduledAt
  if (post.status === 'published' && post.publishedAt) return post.publishedAt
  return post.createdAt
}

function getScheduleLimits() {
  const now = Date.now()
  return {
    min: toLocalDateTimeValue(new Date(now + MIN_SCHEDULE_DELAY_MS + 60_000)),
    max: toLocalDateTimeValue(new Date(now + MAX_SCHEDULE_DELAY_MS)),
  }
}

function toLocalDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
