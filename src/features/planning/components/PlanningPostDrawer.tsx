import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTikTokCreatorInfo } from '@/features/tiktok'
import { useActiveBrand } from '@/shared/scope'
import { CodedError } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'
import { formatDateTime, getLocalTimeZone } from '@/shared/i18n'
import { hasPermission, usePermissions } from '@/shared/permissions'
import {
  Avatar,
  Button,
  IconCalendar,
  IconClock,
  IconClose,
  IconEdit,
  IconDelete,
  IconDesktop,
  IconFacebook,
  IconComment,
  IconLink,
  IconMobile,
  IconProfile,
  IconRefresh,
  IconTikTok,
  IconWarning,
  Modal,
  StatusTag,
  Tabs,
} from '@/shared/ui'
import type {
  PlanningContent,
  PlanningPostType,
  PlanningPublication,
  PlanningRetryResult,
  PlanningTarget,
} from '../api'
import {
  approvalStatusLabelKey,
  approvalTransitions,
  createComposerDraftFromContent,
  PLANNING_APPROVAL_STATUS_TONE,
  PLANNING_STATUS_TONE,
  type PlanningAccount,
  type PreviewViewport,
} from '../model'
import { FacebookPostPreview } from './preview/FacebookPostPreview'
import { TikTokPostPreview } from './preview/TikTokPostPreview'
import { tiktokPreviewOptions } from './preview/PlanningPostPreview'
import { CaptionClamp } from './CaptionClamp'
import { PlanningStatusTag } from './PlanningStatusTag'
import { ApprovalButtons } from './ApprovalStatusSelect'
import { PLANNING_ACCESS } from '../config/planning-access'

export function PlanningPostModal({
  content,
  initialAction,
  onClose,
  onEdit,
  onCancelContent,
  onRetryPublication,
  onRetryFailed,
  onDeleteAll,
  retryResults,
  reconciling,
  onOpenPublishedEditor,
  onDeletePublished,
  onDiscardUnknown,
  onRetryEdit,
  onDismissEdit,
}: {
  content: PlanningContent | null
  initialAction?: 'edit' | 'delete'
  onClose: () => void
  onEdit: (content: PlanningContent) => void
  onCancelContent: (content: PlanningContent) => Promise<void>
  onRetryPublication: (publicationId: string) => void
  onRetryFailed: (contentId: string) => void
  onDeleteAll: (contentId: string) => Promise<void>
  retryResults: PlanningRetryResult[]
  reconciling: boolean
  onOpenPublishedEditor: (publication: PlanningPublication) => void
  onDeletePublished: (publicationId: string) => Promise<void>
  onDiscardUnknown: (publicationId: string) => Promise<void>
  onRetryEdit: (publication: PlanningPublication) => void
  onDismissEdit: (publicationId: string) => void
}) {
  const { t } = useTranslation('planning')
  const { granted } = usePermissions()
  // Editors write and submit drafts; publishing decisions (retry, cancel what is scheduled,
  // edit or delete what is published) need `publishing.publish_direct`.
  const canWrite = hasPermission(granted, PLANNING_ACCESS.publish[0])
  const canPublishDirect = hasPermission(granted, PLANNING_ACCESS.publishDirect[0])
  const canApprove = hasPermission(granted, PLANNING_ACCESS.approve[0])
  // Waiting on this person: approving is then the main action, not editing.
  const awaitingApproval =
    content !== null &&
    approvalTransitions(content, { canApprove, canSubmit: false }).includes('approved')
  const timeZone = getLocalTimeZone()
  const firstPublished = content?.publications?.find((item) => item.status === 'published') ?? null
  const supportsPublishedEdit =
    content?.platform === 'facebook' &&
    ['facebook_feed', 'facebook_reel'].includes(content.type ?? '')
  const [confirmCancel, setConfirmCancel] = useState(
    initialAction === 'delete' &&
      content !== null &&
      ['draft', 'scheduled', 'queued', 'failed', 'retry_wait'].includes(content.status) &&
      !content?.publications?.some((item) => item.status === 'published'),
  )
  const [deletePublication, setDeletePublication] = useState<PlanningPublication | null>(
    initialAction === 'delete' ? firstPublished : null,
  )
  const [discardPublication, setDiscardPublication] = useState<PlanningPublication | null>(null)
  const [retryTarget, setRetryTarget] = useState<string | 'all' | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deleting, setDeleting] = useState<'all' | 'publication' | 'unknown' | 'cancel' | null>(
    null,
  )
  const submitDelete = async (
    action: NonNullable<typeof deleting>,
    operation: () => Promise<void>,
    closeConfirmation: () => void,
  ) => {
    if (deleting) return
    setDeleting(action)
    try {
      await operation()
      closeConfirmation()
    } catch {
      // The parent shows the request error; keep the confirmation open for retry.
    } finally {
      setDeleting(null)
    }
  }
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    initialAction ? (firstPublished?.socialAccountId ?? null) : null,
  )
  const activePublication =
    content?.publications?.find((item) => item.socialAccountId === selectedAccountId) ??
    content?.publications?.[0]
  const hasMultipleAccounts = (content?.targets.length ?? 0) > 1
  const retryableCount = content?.publications?.filter(canRetryPublication).length ?? 0
  const canDeleteAll =
    hasMultipleAccounts &&
    content?.platform === 'facebook' &&
    Boolean(content.publications?.length) &&
    content.publications!.every((item) =>
      ['published', 'unknown', 'delete_unknown', 'failed', 'cancelled', 'deleted'].includes(
        item.status,
      ),
    ) &&
    // Without a post on Facebook there is nothing to delete there: cancelling covers it.
    content.publications!.some(isOnFacebook)
  const canEditPublished = supportsPublishedEdit && activePublication?.status === 'published'
  const canCancel =
    content &&
    (content.status === 'draft' ? canWrite : canPublishDirect) &&
    ['draft', 'scheduled', 'queued', 'failed', 'retry_wait'].includes(content.status) &&
    !content.publications?.some(isOnFacebook)
  const canEdit = canWrite && content && ['draft', 'scheduled', 'failed'].includes(content.status)

  return (
    <>
      <Modal
        open={Boolean(content)}
        onClose={() => {
          if (!deleting) onClose()
        }}
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
            // Phone: two actions to a row, each half wide, one left over taking the row; Close
            // goes, the corner's X does the same.
            <div className="flex flex-wrap items-center justify-end gap-2 max-sm:[&>*]:min-w-[calc(50%-4px)] max-sm:[&>*]:flex-1">
              <Button className="max-sm:hidden" disabled={Boolean(deleting)} onClick={onClose}>
                {t('common.close')}
              </Button>
              {canPublishDirect ? (
                <>
                  {hasMultipleAccounts && retryableCount > 0 ? (
                    <Button
                      icon={<IconRefresh aria-hidden />}
                      disabled={reconciling}
                      onClick={() => setRetryTarget('all')}
                    >
                      {t('detail.retryAllFailed', { count: retryableCount })}
                    </Button>
                  ) : null}
                  {canDeleteAll ? (
                    <Button
                      variant="destructive"
                      icon={<IconDelete aria-hidden />}
                      disabled={reconciling}
                      onClick={() => setConfirmDeleteAll(true)}
                    >
                      {t('detail.deleteAll')}
                    </Button>
                  ) : null}
                  {activePublication?.status === 'unknown' && !hasMultipleAccounts ? (
                    <>
                      <Button
                        icon={<IconRefresh aria-hidden />}
                        disabled={reconciling}
                        onClick={() => setRetryTarget(activePublication.id)}
                      >
                        {t('detail.retry')}
                      </Button>
                      <Button
                        variant="destructive"
                        icon={<IconDelete aria-hidden />}
                        disabled={reconciling}
                        onClick={() => setDiscardPublication(activePublication)}
                      >
                        {t(
                          activePublication.externalPostId
                            ? 'detail.discardUnknown'
                            : 'detail.cancelUnknown',
                        )}
                      </Button>
                    </>
                  ) : null}
                  {activePublication?.status === 'delete_unknown' && !hasMultipleAccounts ? (
                    <Button
                      variant="destructive"
                      icon={<IconDelete aria-hidden />}
                      onClick={() => setDiscardPublication(activePublication)}
                    >
                      {t(
                        activePublication.externalPostId
                          ? 'detail.discardUnknown'
                          : 'detail.cancelUnknown',
                      )}
                    </Button>
                  ) : null}
                  {activePublication?.status === 'edit_unknown' && !hasMultipleAccounts ? (
                    <>
                      <Button onClick={() => onDismissEdit(activePublication.id)}>
                        {t('detail.dismissEdit')}
                      </Button>
                      {activePublication.pendingCaption ? (
                        <Button
                          variant="primary"
                          icon={<IconRefresh aria-hidden />}
                          onClick={() => onRetryEdit(activePublication)}
                        >
                          {t('detail.retryEdit')}
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                  {activePublication &&
                  !hasMultipleAccounts &&
                  activePublication.status !== 'unknown' &&
                  canRetryPublication(activePublication) ? (
                    <Button
                      icon={<IconRefresh aria-hidden />}
                      onClick={() => void onRetryPublication(activePublication.id)}
                    >
                      {t('detail.retry')}
                    </Button>
                  ) : null}
                  {activePublication?.status === 'published' &&
                  !hasMultipleAccounts &&
                  content.platform === 'facebook' ? (
                    <Button
                      variant="destructive"
                      icon={<IconDelete aria-hidden />}
                      onClick={() => setDeletePublication(activePublication)}
                    >
                      {t('detail.deletePublishedConfirm')}
                    </Button>
                  ) : null}
                  {canEditPublished && activePublication ? (
                    <Button
                      variant="primary"
                      icon={<IconEdit aria-hidden />}
                      onClick={() => onOpenPublishedEditor(activePublication)}
                    >
                      {t('detail.editPublishedTitle')}
                    </Button>
                  ) : null}
                </>
              ) : null}
              {canCancel ? (
                <Button
                  variant="destructive"
                  icon={<IconDelete aria-hidden />}
                  onClick={() => setConfirmCancel(true)}
                >
                  {t('detail.cancelContent')}
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  variant={awaitingApproval ? 'secondary' : 'primary'}
                  icon={<IconEdit aria-hidden />}
                  onClick={() => onEdit(content)}
                >
                  {t('detail.edit')}
                </Button>
              ) : null}
              <ApprovalButtons content={content} canApprove={canApprove} />
            </div>
          ) : null
        }
      >
        {content ? (
          <PlanningPostModalContent
            key={content.id}
            content={content}
            timeZone={timeZone}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            canPublishDirect={canPublishDirect}
            onRetryPublication={(id) => {
              const publication = content.publications?.find((item) => item.id === id)
              if (publication?.status === 'unknown') setRetryTarget(id)
              else void onRetryPublication(id)
            }}
            retryResults={retryResults}
            reconciling={reconciling}
            onDeletePublished={setDeletePublication}
            onDiscardUnknown={setDiscardPublication}
            onRetryEdit={onRetryEdit}
            onDismissEdit={onDismissEdit}
          />
        ) : null}
      </Modal>
      <Modal
        open={confirmDeleteAll}
        onClose={() => {
          if (!deleting) setConfirmDeleteAll(false)
        }}
        title={t('detail.deleteAllTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button disabled={Boolean(deleting)} onClick={() => setConfirmDeleteAll(false)}>
              {t('common.close')}
            </Button>
            <Button
              variant="destructive"
              loading={deleting === 'all'}
              onClick={() => {
                if (content)
                  void submitDelete(
                    'all',
                    () => onDeleteAll(content.id),
                    () => setConfirmDeleteAll(false),
                  )
              }}
            >
              {t(deleting === 'all' ? 'detail.deleting' : 'detail.deleteAll')}
            </Button>
          </div>
        }
      >
        <DeleteWarning>{t('detail.deleteAllDescription')}</DeleteWarning>
      </Modal>
      <Modal
        open={retryTarget !== null}
        onClose={() => setRetryTarget(null)}
        title={t('detail.retryUnknownTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setRetryTarget(null)}>{t('common.close')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                const target = retryTarget
                setRetryTarget(null)
                if (target === 'all' && content) void onRetryFailed(content.id)
                else if (target) void onRetryPublication(target)
              }}
            >
              {t('detail.retryUnknownConfirm')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-secondary">{t('detail.retryUnknownDescription')}</p>
      </Modal>
      <Modal
        open={Boolean(discardPublication)}
        onClose={() => {
          if (!deleting) setDiscardPublication(null)
        }}
        title={t(
          discardPublication?.externalPostId
            ? 'detail.discardUnknownTitle'
            : 'detail.cancelUnknownTitle',
        )}
        footer={
          <div className="flex justify-end gap-2">
            <Button disabled={Boolean(deleting)} onClick={() => setDiscardPublication(null)}>
              {t('common.close')}
            </Button>
            <Button
              variant="destructive"
              loading={deleting === 'unknown'}
              onClick={() => {
                const id = discardPublication?.id
                if (id)
                  void submitDelete(
                    'unknown',
                    () => onDiscardUnknown(id),
                    () => setDiscardPublication(null),
                  )
              }}
            >
              {deleting === 'unknown'
                ? t('detail.deleting')
                : t(
                    discardPublication?.externalPostId
                      ? 'detail.discardUnknown'
                      : 'detail.cancelUnknown',
                  )}
            </Button>
          </div>
        }
      >
        <DeleteWarning>
          {t(
            discardPublication?.externalPostId
              ? 'detail.discardUnknownFacebookDescription'
              : 'detail.cancelUnknownDescription',
          )}
        </DeleteWarning>
      </Modal>
      <Modal
        open={Boolean(deletePublication)}
        onClose={() => {
          if (!deleting) setDeletePublication(null)
        }}
        title={t('detail.deletePublishedTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button disabled={Boolean(deleting)} onClick={() => setDeletePublication(null)}>
              {t('common.close')}
            </Button>
            <Button
              variant="destructive"
              loading={deleting === 'publication'}
              onClick={() => {
                if (!deletePublication) return
                const id = deletePublication.id
                void submitDelete(
                  'publication',
                  () => onDeletePublished(id),
                  () => setDeletePublication(null),
                )
              }}
            >
              {t(deleting === 'publication' ? 'detail.deleting' : 'detail.deletePublishedConfirm')}
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-label-md text-text-primary">{deletePublication?.target.name}</p>
        <DeleteWarning>{t('detail.deletePublishedDescription')}</DeleteWarning>
      </Modal>
      <Modal
        open={confirmCancel && Boolean(content)}
        onClose={() => {
          if (!deleting) setConfirmCancel(false)
        }}
        title={t('detail.cancelTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button disabled={Boolean(deleting)} onClick={() => setConfirmCancel(false)}>
              {t('common.close')}
            </Button>
            <Button
              variant="destructive"
              loading={deleting === 'cancel'}
              onClick={() => {
                if (!content) return
                void submitDelete(
                  'cancel',
                  () => onCancelContent(content),
                  () => setConfirmCancel(false),
                )
              }}
            >
              {t(deleting === 'cancel' ? 'detail.deleting' : 'detail.cancelConfirm')}
            </Button>
          </div>
        }
      >
        <DeleteWarning>{t('detail.cancelDescription')}</DeleteWarning>
      </Modal>
    </>
  )
}

function DeleteWarning({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-error-100 bg-error-50 p-3 text-body-sm text-error-700"
    >
      <IconWarning aria-hidden className="mt-0.5 shrink-0 text-icon-md" />
      <p>{children}</p>
    </div>
  )
}

function PlanningPostModalContent({
  content,
  timeZone,
  selectedAccountId,
  onSelectAccount,
  canPublishDirect,
  onRetryPublication,
  retryResults,
  reconciling,
  onDeletePublished,
  onDiscardUnknown,
  onRetryEdit,
  onDismissEdit,
}: {
  content: PlanningContent
  timeZone: string
  selectedAccountId: string | null
  onSelectAccount: (id: string) => void
  canPublishDirect: boolean
  onRetryPublication: (publicationId: string) => void
  retryResults: PlanningRetryResult[]
  reconciling: boolean
  onDeletePublished: (publication: PlanningPublication) => void
  onDiscardUnknown: (publication: PlanningPublication) => void
  onRetryEdit: (publication: PlanningPublication) => void
  onDismissEdit: (publicationId: string) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<PreviewViewport>('mobile')
  const draft = createComposerDraftFromContent(content)
  const accounts: PlanningAccount[] = content.targets.map((target) => ({
    ...target,
    platform: content.platform,
  }))
  const previewAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]
  // TikTok shows the @username; it comes with the creator info.
  const { brandId: activeBrandId } = useActiveBrand()
  const creator = useTikTokCreatorInfo(
    activeBrandId,
    content.platform === 'tiktok' ? (previewAccount?.id ?? null) : null,
  )
  const previewPublication = content.publications?.find(
    (item) => item.socialAccountId === previewAccount?.id,
  )
  const previewCaption =
    previewPublication?.pendingCaption ?? previewPublication?.captionOverride ?? draft.caption
  const hasIndividualSchedules =
    new Set(content.publications?.map((publication) => publication.scheduledAt ?? null)).size > 1

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0 })
  }, [content.id])

  return (
    <div
      ref={scrollContainerRef}
      className="app-scrollbar max-h-[74vh] overflow-y-auto overscroll-y-contain py-2 pe-1"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[26rem_minmax(0,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface lg:sticky lg:top-2">
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
              <PlanningStatusTag content={content} showTime />
            </StatusRow>
            <StatusRow label={t('detail.approvalStatus')}>
              <StatusTag tone={PLANNING_APPROVAL_STATUS_TONE[content.approvalStatus]}>
                {t(approvalStatusLabelKey(content))}
              </StatusTag>
            </StatusRow>
            {content.approvalRequestedBy ? (
              <StatusRow label={t('detail.approvalRequestedBy')}>
                <ActorStamp
                  name={content.approvalRequestedBy}
                  at={content.approvalRequestedAt}
                  locale={i18n.resolvedLanguage}
                />
              </StatusRow>
            ) : null}
            {content.approvalReviewedBy &&
            (content.approvalStatus === 'approved' || content.approvalStatus === 'rejected') ? (
              <StatusRow
                label={t(
                  content.approvalStatus === 'approved' ? 'detail.approvedBy' : 'detail.rejectedBy',
                )}
              >
                <ActorStamp
                  name={content.approvalReviewedBy}
                  at={content.approvalReviewedAt}
                  locale={i18n.resolvedLanguage}
                />
              </StatusRow>
            ) : null}
          </div>

          <div className="border-t border-border-subtle p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-label-md text-text-primary">{t('detail.accounts')}</h3>
              <div className="flex items-center gap-2">
                {reconciling ? (
                  <span className="text-caption text-text-secondary">
                    {t('detail.reconciling')}
                  </span>
                ) : null}
                <span className="text-caption tabular-nums text-text-tertiary">
                  {t('calendar.targetCount', { count: content.targets.length })}
                </span>
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
                      onSelect={() => onSelectAccount(publication.socialAccountId)}
                      multipleAccounts={content.targets.length > 1}
                      retryResult={retryResults.find(
                        (item) => item.publicationId === publication.id,
                      )}
                      reconciling={reconciling}
                      showSchedule={hasIndividualSchedules}
                      onRetryPublication={canPublishDirect ? onRetryPublication : undefined}
                      onDeletePublished={canPublishDirect ? onDeletePublished : undefined}
                      onDiscardUnknown={canPublishDirect ? onDiscardUnknown : undefined}
                      onRetryEdit={canPublishDirect ? onRetryEdit : undefined}
                      onDismissEdit={canPublishDirect ? onDismissEdit : undefined}
                    />
                  ))
                : content.targets.map((target) => (
                    <AccountRow
                      key={target.id}
                      target={target}
                      selected={previewAccount?.id === target.id}
                      onSelect={() => onSelectAccount(target.id)}
                      multipleAccounts={content.targets.length > 1}
                    />
                  ))}
            </ul>
          </div>

          <dl className="grid gap-4 border-t border-border-subtle p-5">
            {(!hasIndividualSchedules && content.scheduledAt) ||
            (content.targets.length === 1 && previewPublication?.publishedAt) ? (
              <MetaItem
                icon={<IconCalendar />}
                label={t(
                  content.targets.length === 1 && previewPublication?.publishedAt
                    ? 'detail.accountPublishedAt'
                    : 'detail.scheduledAt',
                )}
              >
                <span className="block">
                  {content.scheduledAt || previewPublication?.publishedAt
                    ? formatDateTime(
                        (content.targets.length === 1 && previewPublication?.publishedAt) ||
                          content.scheduledAt!,
                        i18n.resolvedLanguage,
                      )
                    : '—'}
                </span>
                <span className="mt-0.5 block text-caption font-normal text-text-tertiary">
                  {timeZone}
                </span>
              </MetaItem>
            ) : null}
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

          {content.firstComment && content.captionMode !== 'per_target' ? (
            <div className="grid gap-1 border-t border-border-subtle p-4">
              <span className="flex items-center gap-2 text-caption text-text-secondary">
                <IconComment aria-hidden className="shrink-0" />
                {t('detail.firstComment')}
              </span>
              <p className="whitespace-pre-wrap break-words text-body-sm text-text-primary">
                {content.firstComment}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="flex h-[min(70vh,44rem)] min-w-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface lg:sticky lg:top-2">
          <div className="relative flex min-h-0 min-w-0 flex-1">
            <div className="absolute end-2 top-3 z-sticky">
              <Tabs
                variant="transparent"
                value={viewport}
                ariaLabel={t('composer.preview.viewport')}
                onChange={setViewport}
                options={[
                  {
                    value: 'mobile',
                    label: (
                      <span className="flex size-8 items-center justify-center text-icon-md leading-none">
                        <IconMobile aria-hidden />
                      </span>
                    ),
                  },
                  {
                    value: 'desktop',
                    label: (
                      <span className="flex size-8 items-center justify-center text-icon-md leading-none">
                        <IconDesktop aria-hidden />
                      </span>
                    ),
                  },
                ]}
              />
            </div>
            <div className="app-scrollbar flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-x-hidden overflow-y-auto bg-bg-surface-subtle p-8 sm:p-8">
              {content.platform === 'facebook' ? (
                <FacebookPostPreview
                  account={previewAccount}
                  caption={previewCaption}
                  media={draft.media}
                  viewport={viewport}
                  postType={draft.postType}
                />
              ) : (
                <TikTokPostPreview
                  account={previewAccount}
                  caption={previewCaption}
                  media={draft.media}
                  viewport={viewport}
                  {...tiktokPreviewOptions(draft)}
                  handle={creator.data?.creatorUsername}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Who did something and when, e.g. who approved a post. */
function ActorStamp({ name, at, locale }: { name: string; at?: string; locale?: string }) {
  return (
    <span className="min-w-0 truncate text-end text-body-sm text-text-primary">
      {name}
      {at ? (
        <span className="text-text-tertiary">
          <span aria-hidden> · </span>
          {formatDateTime(at, locale)}
        </span>
      ) : null}
    </span>
  )
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
  reconciling = false,
  showSchedule,
  multipleAccounts = false,
  onRetryPublication,
  onDeletePublished,
  onDiscardUnknown,
  onRetryEdit,
  onDismissEdit,
}: {
  target: PlanningTarget
  publication?: PlanningPublication
  selected?: boolean
  onSelect?: () => void
  retryResult?: PlanningRetryResult
  reconciling?: boolean
  showSchedule?: boolean
  multipleAccounts?: boolean
  onRetryPublication?: (publicationId: string) => void
  onDeletePublished?: (publication: PlanningPublication) => void
  onDiscardUnknown?: (publication: PlanningPublication) => void
  onRetryEdit?: (publication: PlanningPublication) => void
  onDismissEdit?: (publicationId: string) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const errorMessage = useApiErrorMessage('planning')
  const tiktokPhase =
    publication?.providerPhase && TIKTOK_PHASES.includes(publication.providerPhase)
      ? publication.providerPhase
      : null
  return (
    <li className="min-w-0 space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          disabled={!multipleAccounts}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg border p-3 text-start focus-visible:focus-ring ${multipleAccounts && selected ? 'border-border-focus' : multipleAccounts ? 'border-transparent hover:border-border-strong' : 'border-transparent'}`}
        >
          <Avatar name={target.name} src={target.avatarUrl} size="md" />
          <span className="flex min-w-0 flex-col items-start gap-1.5">
            <span
              className="w-full truncate text-body-sm font-semibold text-text-primary"
              title={target.name}
            >
              {target.name}
            </span>
            {publication && multipleAccounts ? (
              <span
                className={`inline-flex max-w-full items-center rounded-pill border px-3 py-1 text-caption font-medium ${accountStatusClass(publication.status)}`}
              >
                <span className="truncate">
                  {['cancelled', 'deleted'].includes(publication.status)
                    ? t('statusGroup.deleted')
                    : t(`status.${publication.status}`)}
                </span>
              </span>
            ) : null}
          </span>
        </button>
        {publication ? (
          <div className="flex shrink-0 items-center gap-1">
            {publication.status === 'published' &&
            multipleAccounts &&
            onDeletePublished &&
            !publication.providerPhase ? (
              <Button
                size="sm"
                variant="ghost"
                icon={<IconDelete />}
                aria-label={t('detail.deletePublishedConfirm')}
                onClick={() => onDeletePublished(publication)}
              />
            ) : null}
            {canRetryPublication(publication) && onRetryPublication ? (
              <Button
                variant="ghost"
                size="sm"
                icon={<IconRefresh aria-hidden />}
                aria-label={t('detail.retry')}
                disabled={reconciling && publication.status === 'unknown'}
                onClick={() => void onRetryPublication(publication.id)}
              />
            ) : null}
            {publication.status === 'edit_unknown' &&
            multipleAccounts &&
            publication.pendingCaption &&
            onRetryEdit ? (
              <Button
                variant="ghost"
                size="sm"
                icon={<IconRefresh aria-hidden />}
                aria-label={t('detail.retryEdit')}
                title={t('detail.retryEdit')}
                onClick={() => onRetryEdit(publication)}
              />
            ) : null}
            {publication.status === 'edit_unknown' && multipleAccounts && onDismissEdit ? (
              <Button
                variant="ghost"
                size="sm"
                icon={<IconClose aria-hidden />}
                aria-label={t('detail.dismissEdit')}
                title={t('detail.dismissEdit')}
                onClick={() => onDismissEdit(publication.id)}
              />
            ) : null}
            {['unknown', 'delete_unknown'].includes(publication.status) && onDiscardUnknown ? (
              <Button
                variant="ghost"
                size="sm"
                icon={<IconDelete aria-hidden />}
                aria-label={t(
                  publication.externalPostId ? 'detail.discardUnknown' : 'detail.cancelUnknown',
                )}
                disabled={reconciling}
                onClick={() => onDiscardUnknown(publication)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {publication &&
      ((multipleAccounts && (publication.pendingCaption || publication.captionOverride)) ||
        (multipleAccounts && publication.firstComment) ||
        (showSchedule && publication.scheduledAt) ||
        (multipleAccounts && publication.publishedAt) ||
        publication.externalPostUrl) ? (
        <dl className="grid gap-2 rounded-lg bg-bg-surface-subtle p-3 text-caption">
          {multipleAccounts && (publication.pendingCaption || publication.captionOverride) ? (
            <div className="grid min-w-0 gap-1">
              <dt className="font-medium text-text-secondary">{t('detail.accountCaption')}</dt>
              <dd className="min-w-0 text-body-sm font-medium text-text-primary">
                <CaptionClamp
                  caption={publication.pendingCaption || publication.captionOverride!}
                />
                {publication.pendingCaption ? (
                  <span className="mt-1 block text-caption font-normal text-text-secondary">
                    {t(`status.${publication.status}`)}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
          {multipleAccounts && publication.firstComment ? (
            <div className="grid min-w-0 gap-1">
              <dt className="flex items-center gap-2 font-medium text-text-secondary">
                <IconComment aria-hidden className="shrink-0" />
                {t('detail.firstComment')}
              </dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words text-body-sm text-text-primary">
                {publication.firstComment}
              </dd>
            </div>
          ) : null}
          {showSchedule && publication.scheduledAt ? (
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <dt className="text-text-secondary">{t('detail.accountScheduledAt')}</dt>
              <dd className="font-medium tabular-nums text-text-primary">
                {formatDateTime(publication.scheduledAt, i18n.resolvedLanguage)}
              </dd>
            </div>
          ) : null}
          {multipleAccounts && publication.publishedAt ? (
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <dt className="text-text-secondary">{t('detail.accountPublishedAt')}</dt>
              <dd className="font-medium tabular-nums text-text-primary">
                {formatDateTime(publication.publishedAt, i18n.resolvedLanguage)}
              </dd>
            </div>
          ) : null}
          {publication.externalPostUrl ? (
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <dt className="text-text-secondary">{t('detail.accountPostLink')}</dt>
              <dd>
                <a
                  href={publication.externalPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-action-text hover:underline"
                >
                  {t('detail.openPublishedPost')}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {tiktokPhase && !publication?.errorCode ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface-subtle p-3 text-caption text-text-secondary"
        >
          <IconTikTok aria-hidden className="shrink-0 text-icon-md text-platform-tiktok" />
          <p>{t(`detail.tiktokPhase.${tiktokPhase as 'processing'}`)}</p>
        </div>
      ) : null}
      {publication?.errorCode && !['cancelled', 'deleted'].includes(publication.status) && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-error-100 bg-error-50 p-3 text-caption text-error-700"
        >
          <IconWarning aria-hidden className="shrink-0 text-icon-md" />
          <p>
            {publication.status === 'edit_unknown'
              ? t('detail.editUnknownReason')
              : publication.errorCode.startsWith('TIKTOK_')
                ? errorMessage(new CodedError(publication.errorCode), t('detail.errorReason.other'))
                : t(`detail.errorReason.${reasonKey(publication.errorCode)}`)}
          </p>
        </div>
      )}
      {publication?.firstCommentStatus === 'failed' && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-warning-100 bg-warning-50 p-3 text-caption text-warning-700"
        >
          <IconWarning aria-hidden className="shrink-0 text-icon-md" />
          <p>
            {t(
              publication.firstCommentError === 'FACEBOOK_COMMENT_PERMISSION_MISSING'
                ? 'detail.firstCommentFailed.permission'
                : 'detail.firstCommentFailed.other',
            )}
          </p>
        </div>
      )}
      {publication?.status === 'failed' && retryResult?.outcome === 'skipped' && (
        <p className="text-caption text-text-secondary">
          {t('detail.retrySkipped', {
            reason: t(`detail.retryReason.${reasonKey(retryResult.reason)}`),
          })}
        </p>
      )}
    </li>
  )
}

function accountStatusClass(status: PlanningPublication['status']): string {
  const tone = PLANNING_STATUS_TONE[status]
  if (tone === 'warning') return 'border-warning-100 bg-warning-50 text-warning-700'
  if (tone === 'error') return 'border-error-100 bg-error-50 text-error-700'
  if (tone === 'success') return 'border-success-100 bg-success-50 text-success-700'
  if (tone === 'brand') return 'border-brand-100 bg-brand-50 text-brand-700'
  if (tone === 'info') return 'border-info-100 bg-info-50 text-info-700'
  return 'border-border-subtle bg-bg-surface-subtle text-text-secondary'
}

/** Steps TikTok goes through after SocialOps hands the post over; each has its own note. */
const TIKTOK_PHASES = ['started', 'processing', 'moderation', 'inbox', 'published_without_id']

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

/**
 * A failed Page never reached Facebook, so it can be published again. An expired or missing
 * token included: the API checks the Page's current connection and explains if it still needs
 * reconnecting. A refused permission or rejected content must be fixed first.
 */
function canRetryPublication(publication: PlanningPublication): boolean {
  if (publication.status === 'unknown') return true
  return (
    publication.status === 'failed' &&
    !publication.externalPostId &&
    ![
      'FACEBOOK_PERMISSION_MISSING',
      'FACEBOOK_PUBLISH_PERMISSION_MISSING',
      'FACEBOOK_REQUEST_FAILED',
      'INVALID_MEDIA',
    ].includes(publication.errorCode ?? '')
  )
}

/** The post may exist on Facebook for this Page, so removing it means deleting it there. */
function isOnFacebook(publication: PlanningPublication): boolean {
  return (
    ['published', 'delete_unknown'].includes(publication.status) ||
    (publication.status === 'unknown' && Boolean(publication.externalPostId))
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
