import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateTime, getLocalTimeZone } from '@/shared/i18n'
import {
  Avatar,
  Button,
  IconCalendar,
  IconClock,
  IconEdit,
  IconDelete,
  IconFacebook,
  IconLink,
  IconProfile,
  IconRefresh,
  IconTikTok,
  Modal,
  StatusTag,
  Textarea,
} from '@/shared/ui'
import type {
  PlanningContent,
  PlanningPostType,
  PlanningPublication,
  PlanningRetryResult,
  PlanningTarget,
} from '../api'
import {
  createComposerDraftFromContent,
  PLANNING_APPROVAL_STATUS_TONE,
  PLANNING_STATUS_TONE,
  type PlanningAccount,
  type PreviewViewport,
} from '../model'
import { FacebookPostPreview } from './preview/FacebookPostPreview'
import { TikTokPostPreview } from './preview/TikTokPostPreview'

export function PlanningPostModal({
  content,
  onClose,
  onEdit,
  onCancelContent,
  onRetryPublication,
  onRetryFailed,
  retryResults,
  onEditPublishedCaption,
  onDeletePublished,
}: {
  content: PlanningContent | null
  onClose: () => void
  onEdit: (content: PlanningContent) => void
  onCancelContent: (content: PlanningContent) => Promise<void>
  onRetryPublication: (publicationId: string) => Promise<void>
  onRetryFailed: (contentId: string) => Promise<void>
  retryResults: PlanningRetryResult[]
  onEditPublishedCaption: (publicationId: string, caption: string) => Promise<void>
  onDeletePublished: (publicationId: string) => Promise<void>
}) {
  const { t } = useTranslation('planning')
  const timeZone = getLocalTimeZone()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [editPublication, setEditPublication] = useState<PlanningPublication | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [deletePublication, setDeletePublication] = useState<PlanningPublication | null>(null)
  const canCancel =
    content && ['draft', 'scheduled', 'queued', 'failed', 'retry_wait'].includes(content.status)
  const canEdit = content && ['draft', 'scheduled', 'failed', 'cancelled'].includes(content.status)

  return (
    <>
      <Modal
        open={Boolean(content)}
        onClose={onClose}
        width={1120}
        floatingClose
        title={
          <span className="flex items-center gap-2">
            {content?.platform === 'tiktok' ? (
              <IconTikTok className="shrink-0 text-icon-md text-text-primary" />
            ) : (
              <IconFacebook className="shrink-0 text-icon-md text-platform-facebook" />
            )}
            <span>{t('detail.title')}</span>
          </span>
        }
        footer={
          content ? (
            <div className="flex justify-end gap-2">
              <Button onClick={onClose}>{t('common.close')}</Button>
              {canCancel ? (
                <Button
                  variant="secondary"
                  icon={<IconDelete aria-hidden />}
                  onClick={() => setConfirmCancel(true)}
                >
                  {t('detail.cancelContent')}
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  variant="primary"
                  icon={<IconEdit aria-hidden />}
                  onClick={() => onEdit(content)}
                >
                  {t('detail.edit')}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {content ? (
          <PlanningPostModalContent
            key={content.id}
            content={content}
            timeZone={timeZone}
            onRetryPublication={onRetryPublication}
            onRetryFailed={onRetryFailed}
            retryResults={retryResults}
            onEditPublished={(publication) => {
              setEditPublication(publication)
              setEditCaption(publication.captionOverride ?? content.caption)
            }}
            onDeletePublished={setDeletePublication}
          />
        ) : null}
      </Modal>
      <Modal
        open={Boolean(editPublication)}
        onClose={() => setEditPublication(null)}
        title={t('detail.editPublishedTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditPublication(null)}>{t('common.close')}</Button>
            <Button
              variant="primary"
              disabled={!editCaption.trim()}
              onClick={() => {
                if (!editPublication) return
                const id = editPublication.id
                setEditPublication(null)
                void onEditPublishedCaption(id, editCaption)
              }}
            >
              {t('detail.savePublishedCaption')}
            </Button>
          </div>
        }
      >
        <Textarea
          value={editCaption}
          rows={5}
          maxLength={2200}
          onChange={(event) => setEditCaption(event.target.value)}
        />
      </Modal>
      <Modal
        open={Boolean(deletePublication)}
        onClose={() => setDeletePublication(null)}
        title={t('detail.deletePublishedTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeletePublication(null)}>{t('common.close')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!deletePublication) return
                const id = deletePublication.id
                setDeletePublication(null)
                void onDeletePublished(id)
              }}
            >
              {t('detail.deletePublishedConfirm')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-secondary">{t('detail.deletePublishedDescription')}</p>
      </Modal>
      <Modal
        open={confirmCancel && Boolean(content)}
        onClose={() => setConfirmCancel(false)}
        title={t('detail.cancelTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmCancel(false)}>{t('common.close')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!content) return
                setConfirmCancel(false)
                void onCancelContent(content)
              }}
            >
              {t('detail.cancelConfirm')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-secondary">{t('detail.cancelDescription')}</p>
      </Modal>
    </>
  )
}

function PlanningPostModalContent({
  content,
  timeZone,
  onRetryPublication,
  onRetryFailed,
  retryResults,
  onEditPublished,
  onDeletePublished,
}: {
  content: PlanningContent
  timeZone: string
  onRetryPublication: (publicationId: string) => Promise<void>
  onRetryFailed: (contentId: string) => Promise<void>
  retryResults: PlanningRetryResult[]
  onEditPublished: (publication: PlanningPublication) => void
  onDeletePublished: (publication: PlanningPublication) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const viewport = useResponsivePreviewViewport()
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const draft = createComposerDraftFromContent(content)
  const accounts: PlanningAccount[] = content.targets.map((target) => ({
    ...target,
    platform: content.platform,
  }))
  const previewAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]
  const previewPublication = content.publications?.find(
    (item) => item.socialAccountId === previewAccount?.id,
  )
  const previewCaption = previewAccount
    ? previewPublication?.captionOverride ||
      draft.captionOverrides[previewAccount.id] ||
      draft.caption
    : draft.caption
  const failedCount = content.publications?.filter(canRetryPublication).length ?? 0

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0 })
  }, [content.id])

  return (
    <div
      ref={scrollContainerRef}
      className="app-scrollbar max-h-[74vh] overflow-y-auto overscroll-y-contain py-2 pe-1"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(30rem,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <header className="flex items-center gap-3 p-5">
            {content.platform === 'facebook' ? (
              <IconFacebook className="shrink-0 text-icon-lg text-platform-facebook" />
            ) : (
              <IconTikTok className="shrink-0 text-icon-lg text-text-primary" />
            )}
            <div className="min-w-0">
              <p className="text-label-md text-text-primary">{t(`platform.${content.platform}`)}</p>
              <p className="mt-0.5 text-caption text-text-tertiary">
                {content.type
                  ? t(`composer.postType.${POST_TYPE_TRANSLATION_KEY[content.type]}`)
                  : t('detail.post')}
              </p>
            </div>
          </header>

          <div className="grid gap-3 border-t border-border-subtle p-5">
            <StatusRow label={t('detail.postStatus')}>
              <StatusTag tone={PLANNING_STATUS_TONE[content.status]}>
                {t(`status.${content.status}`)}
              </StatusTag>
            </StatusRow>
            <StatusRow label={t('detail.approvalStatus')}>
              <StatusTag tone={PLANNING_APPROVAL_STATUS_TONE[content.approvalStatus]}>
                {t(`approvalStatus.${content.approvalStatus}`)}
              </StatusTag>
            </StatusRow>
          </div>

          <div className="border-t border-border-subtle p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-label-md text-text-primary">{t('detail.accounts')}</h3>
              <div className="flex items-center gap-2">
                <span className="text-caption tabular-nums text-text-tertiary">
                  {t('calendar.targetCount', { count: content.targets.length })}
                </span>
                {failedCount > 0 && content.publications && content.publications.length > 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<IconRefresh aria-hidden />}
                    onClick={() => void onRetryFailed(content.id)}
                  >
                    {t('detail.retryAllFailed', { count: failedCount })}
                  </Button>
                )}
              </div>
            </div>
            <ul className="mt-4 divide-y divide-border-subtle">
              {content.publications?.length
                ? content.publications.map((publication) => (
                    <AccountRow
                      key={publication.id}
                      target={publication.target}
                      publication={publication}
                      selected={previewAccount?.id === publication.socialAccountId}
                      onSelect={() => setSelectedAccountId(publication.socialAccountId)}
                      retryResult={retryResults.find(
                        (item) => item.publicationId === publication.id,
                      )}
                      onRetryPublication={onRetryPublication}
                      onEditPublished={
                        content.type === 'facebook_feed' && !content.media?.length
                          ? onEditPublished
                          : undefined
                      }
                      onDeletePublished={onDeletePublished}
                    />
                  ))
                : content.targets.map((target) => (
                    <AccountRow
                      key={target.id}
                      target={target}
                      selected={previewAccount?.id === target.id}
                      onSelect={() => setSelectedAccountId(target.id)}
                    />
                  ))}
            </ul>
          </div>

          <dl className="grid gap-4 border-t border-border-subtle p-5">
            <MetaItem icon={<IconCalendar />} label={t('detail.scheduledAt')}>
              <span className="block">
                {content.scheduledAt
                  ? formatDateTime(content.scheduledAt, i18n.resolvedLanguage)
                  : '—'}
              </span>
              <span className="mt-0.5 block text-caption font-normal text-text-tertiary">
                {timeZone}
              </span>
            </MetaItem>
            <MetaItem icon={<IconClock />} label={t('detail.createdAt')}>
              {formatDateTime(content.createdAt, i18n.resolvedLanguage)}
            </MetaItem>
            <MetaItem icon={<IconProfile />} label={t('detail.createdBy')}>
              {content.createdBy}
            </MetaItem>
          </dl>

          {content.link ? (
            <div className="border-t border-border-subtle p-4">
              <a
                href={content.link}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-body-sm text-platform-facebook hover:underline"
              >
                <IconLink className="shrink-0" />
                <span className="truncate">{content.link}</span>
              </a>
            </div>
          ) : null}
        </section>

        <aside className="flex min-w-0 items-start justify-center">
          {content.platform === 'facebook' ? (
            <FacebookPostPreview
              account={previewAccount}
              caption={previewCaption}
              media={draft.media}
              viewport={viewport}
              postType={draft.postType}
              fluid
            />
          ) : (
            <TikTokPostPreview
              account={previewAccount}
              caption={previewCaption}
              media={draft.media}
              viewport={viewport}
              fluid
            />
          )}
        </aside>
      </div>
    </div>
  )
}

function useResponsivePreviewViewport(): PreviewViewport {
  const getViewport = (): PreviewViewport =>
    window.matchMedia('(max-width: 1023px)').matches ? 'mobile' : 'desktop'
  const [viewport, setViewport] = useState<PreviewViewport>(getViewport)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const updateViewport = () => setViewport(mediaQuery.matches ? 'mobile' : 'desktop')
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  return viewport
}

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <span className="text-body-sm text-text-secondary">{label}</span>
      {children}
    </div>
  )
}

function AccountRow({
  target,
  publication,
  selected,
  onSelect,
  retryResult,
  onRetryPublication,
  onEditPublished,
  onDeletePublished,
}: {
  target: PlanningTarget
  publication?: PlanningPublication
  selected?: boolean
  onSelect?: () => void
  retryResult?: PlanningRetryResult
  onRetryPublication?: (publicationId: string) => Promise<void>
  onEditPublished?: (publication: PlanningPublication) => void
  onDeletePublished?: (publication: PlanningPublication) => void
}) {
  const { t } = useTranslation('planning')
  return (
    <li className="flex min-w-0 flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-start focus-visible:focus-ring ${selected ? 'bg-bg-surface-muted' : 'hover:bg-bg-surface-muted'}`}
      >
        <Avatar name={target.name} src={target.avatarUrl} size="sm" />
        <span
          className="min-w-0 truncate text-body-sm font-medium text-text-primary"
          title={target.name}
        >
          {target.name}
        </span>
      </button>
      {publication ? (
        <span className="ms-auto flex shrink-0 items-center gap-2">
          <StatusTag tone={PLANNING_STATUS_TONE[publication.status]}>
            {t(`status.${publication.status}`)}
          </StatusTag>
          {canRetryPublication(publication) && onRetryPublication ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<IconRefresh aria-hidden />}
              aria-label={t('detail.retry')}
              onClick={() => void onRetryPublication(publication.id)}
            />
          ) : null}
          {publication.status === 'published' && onEditPublished ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<IconEdit aria-hidden />}
              aria-label={t('detail.editPublishedTitle')}
              onClick={() => onEditPublished(publication)}
            />
          ) : null}
          {publication.status === 'published' && onDeletePublished ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<IconDelete aria-hidden />}
              aria-label={t('detail.deletePublishedTitle')}
              onClick={() => onDeletePublished(publication)}
            />
          ) : null}
        </span>
      ) : null}
      {publication?.errorCode && (
        <p className="w-full text-caption text-error-700">
          {t(`detail.errorReason.${reasonKey(publication.errorCode)}`)}
        </p>
      )}
      {publication?.status === 'failed' && retryResult?.outcome === 'skipped' && (
        <p className="w-full text-caption text-text-secondary">
          {t('detail.retrySkipped', {
            reason: t(`detail.retryReason.${reasonKey(retryResult.reason)}`),
          })}
        </p>
      )}
    </li>
  )
}

function reasonKey(code: string | undefined) {
  if (
    code === 'FACEBOOK_TOKEN_EXPIRED' ||
    code === 'FACEBOOK_TOKEN_MISSING' ||
    code === 'FACEBOOK_RECONNECT_REQUIRED'
  )
    return 'reconnect'
  if (code === 'FACEBOOK_PERMISSION_MISSING' || code === 'FACEBOOK_PUBLISH_PERMISSION_MISSING')
    return 'permission'
  if (code === 'PAGE_DISCONNECTED') return 'disconnected'
  if (code === 'FACEBOOK_RATE_LIMITED') return 'rateLimit'
  if (code === 'FACEBOOK_OUTCOME_UNKNOWN' || code === 'WORKER_INTERRUPTED') return 'unknown'
  if (
    code === 'CONTENT_REVIEW_REQUIRED' ||
    code === 'INVALID_MEDIA' ||
    code === 'FACEBOOK_REQUEST_FAILED'
  )
    return 'content'
  if (code === 'PUBLICATION_NOT_RETRYABLE') return 'notRetryable'
  if (code === 'NOT_SELECTED') return 'notSelected'
  return 'other'
}

function canRetryPublication(publication: PlanningPublication): boolean {
  return (
    publication.status === 'failed' &&
    ![
      'FACEBOOK_PERMISSION_MISSING',
      'FACEBOOK_PUBLISH_PERMISSION_MISSING',
      'FACEBOOK_TOKEN_EXPIRED',
      'FACEBOOK_TOKEN_MISSING',
      'FACEBOOK_REQUEST_FAILED',
      'INVALID_MEDIA',
    ].includes(publication.errorCode ?? '')
  )
}

function MetaItem({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <dt className="flex shrink-0 items-center gap-2 text-body-sm text-text-secondary">
        <span aria-hidden className="flex size-5 items-center justify-center text-text-tertiary">
          {icon}
        </span>
        <span>{label}</span>
      </dt>
      <dd
        className="min-w-0 text-end text-body-sm font-medium tabular-nums text-text-primary"
        title={String(children)}
      >
        {children}
      </dd>
    </div>
  )
}

const POST_TYPE_TRANSLATION_KEY = {
  facebook_feed: 'facebookFeed',
  facebook_reel: 'facebookReel',
  facebook_story: 'facebookStory',
  tiktok_video: 'tiktokVideo',
  tiktok_photo: 'tiktokPhoto',
} as const satisfies Record<PlanningPostType, string>
