import { useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { formatDateTime, type AppLocale } from '@/shared/i18n'
import { isApiErrorCode } from '@/shared/api/errors'
import { useActiveBrand } from '@/shared/scope'
import {
  Alert,
  Button,
  ConfirmDialog,
  DatePicker,
  Dropdown,
  EmptyState,
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconDelete,
  IconPlus,
  IconSend,
  IconSendLine,
  SectionSkeleton,
  useToast,
} from '@/shared/ui'
import {
  useCreatePlanningContent,
  useEditPublishedPlanningCaptions,
  usePlanningAccounts,
  usePlanningContent,
  useUpdatePlanningContent,
  type PlanningContent,
  type PlanningPlatform,
  type PlanningPostType,
  type PlanningPublication,
  type PlanningPublishIntent,
} from '../api'
import { uploadPlanningMedia } from '../api/service'
import {
  PlanningPostEditor,
  type MediaUploadState,
} from '../components/composer/PlanningPostEditor'
import { getPlanningCreatePath, getPlanningPath } from '../config/planning.routes'
import { canPublishOnPlatform } from '../config/planning-capabilities'
import { PlanningPostPreview } from '../components/preview/PlanningPostPreview'
import { PreviewPlaybackProvider } from '../components/preview/previewPlayback'
import { moveVideoFrames } from '../components/composer/videoFrames'
import {
  allowedIntent,
  canSubmitComposer,
  canWithdrawApproval,
  composerCaptionFor,
  createComposerDraft,
  createComposerDraftFromAiSuggestion,
  createComposerDraftFromContent,
  getPlanningContentIntent,
  isComposerCaptionMissing,
  isScheduleIntent,
  toCreatePlanningContentInput,
  toUpdatePlanningContentInput,
  usesCaptionPerAccount,
  type ComposerAiSuggestion,
  type ComposerMedia,
  type PlanningAccount,
  type PlanningComposerDraft,
  type PreviewViewport,
} from '../model'

/** "Use" on an AI suggestion: what the AI chat put in the navigation state. */
type AiSuggestionState = ComposerAiSuggestion & { generationId: string }

function readAiSuggestion(state: unknown): AiSuggestionState | null {
  const value = (state as { aiSuggestion?: unknown } | null)?.aiSuggestion
  if (typeof value !== 'object' || value === null) return null
  const item = value as Partial<AiSuggestionState>
  return typeof item.generationId === 'string' &&
    Array.isArray(item.socialAccountIds) &&
    typeof item.captions === 'object' &&
    item.captions !== null &&
    Array.isArray(item.images)
    ? (item as AiSuggestionState)
    : null
}
import { useApiErrorMessage, useLeaveGuard } from '@/shared/hooks'
import { useAuth } from '@/shared/auth'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { PLANNING_ACCESS } from '../config/planning-access'

export default function CreatePlanningPostPage() {
  const { t } = useTranslation('planning')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { brandId } = useActiveBrand()
  const { platform: platformParam, contentId } = useParams<{
    platform: string
    contentId?: string
  }>()
  const platform: PlanningPlatform = platformParam === 'tiktok' ? 'tiktok' : 'facebook'
  const isValidPlatform = platformParam === 'facebook' || platformParam === 'tiktok'
  const isEditing = Boolean(contentId)
  const requestedDate = isEditing ? null : getRequestedDate(searchParams.get('date'))
  const requestedPostType = isEditing
    ? null
    : getRequestedPostType(searchParams.get('postType'), platform)
  const aiSuggestion =
    isEditing || platform !== 'facebook' ? null : readAiSuggestion(location.state)
  const accountsQuery = usePlanningAccounts(brandId)
  const contentQuery = usePlanningContent(brandId, contentId ?? null)
  const planningPath = getPlanningPath(platform)

  if (!isValidPlatform || !brandId) return <Navigate to="/" replace />

  if (!canPublishOnPlatform(platform)) {
    return (
      <div className="grid gap-4">
        <Alert variant="soft" tone="warning" title={t('composer.platformUnavailable')} />
        <Button onClick={() => navigate(planningPath)}>{t('composer.back')}</Button>
      </div>
    )
  }

  if (accountsQuery.isPending || (isEditing && contentQuery.isPending)) {
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={8} />
      </div>
    )
  }

  if (accountsQuery.isError || (isEditing && (contentQuery.isError || !contentQuery.data))) {
    return (
      <div className="grid gap-5">
        <Button
          variant="ghost"
          size="sm"
          icon={<IconChevronLeft aria-hidden />}
          onClick={() => navigate(planningPath)}
        >
          {t('composer.back')}
        </Button>
        <Alert
          variant="soft"
          tone="error"
          title={isEditing ? t('composer.editLoadError') : t('composer.accounts.loadError')}
        />
      </div>
    )
  }

  const content = contentQuery.data
  if (content && content.platform !== platform) return <Navigate to={planningPath} replace />
  if (content?.status === 'cancelled')
    return <CancelledPostNotice platform={platform} planningPath={planningPath} />
  const accounts = (accountsQuery.data ?? []).filter((account) => account.platform === platform)

  if (
    content?.publications?.some((publication) =>
      ['published', 'edit_queued', 'editing', 'edit_unknown'].includes(publication.status),
    )
  ) {
    return (
      <PublishedPlanningEditor
        key={content.id}
        brandId={brandId}
        content={content}
        accounts={accounts}
        planningPath={planningPath}
        requestedAccountId={searchParams.get('accountId')}
      />
    )
  }

  return (
    <PlanningComposerWorkspace
      key={
        content?.id ??
        aiSuggestion?.generationId ??
        `create-${platform}-${requestedPostType ?? 'default'}-${requestedDate ?? 'now'}`
      }
      brandId={brandId}
      platform={platform}
      content={content}
      accounts={accounts}
      planningPath={planningPath}
      requestedDate={requestedDate}
      requestedPostType={requestedPostType}
      aiSuggestion={aiSuggestion}
      onCancelled={() => void contentQuery.refetch()}
    />
  )
}

/** The post was deleted elsewhere: nothing left to save, only start over or go back. */
function CancelledPostNotice({
  platform,
  planningPath,
}: {
  platform: PlanningPlatform
  planningPath: string
}) {
  const { t } = useTranslation('planning')
  const navigate = useNavigate()
  return (
    <div className="grid min-h-full place-items-center py-16">
      <EmptyState
        icon={
          <span className="inline-flex size-12 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface text-icon-lg text-text-secondary">
            <IconDelete aria-hidden />
          </span>
        }
        title={t('composer.cancelled.title')}
        description={t('composer.cancelled.description')}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate(planningPath)}>{t('composer.back')}</Button>
            <Button
              variant="primary"
              icon={<IconPlus aria-hidden />}
              onClick={() => navigate(getPlanningCreatePath(platform))}
            >
              {t('composer.cancelled.create')}
            </Button>
          </div>
        }
      />
    </div>
  )
}

function PublishedPlanningEditor({
  brandId,
  content,
  accounts,
  planningPath,
  requestedAccountId,
}: {
  brandId: string
  content: PlanningContent
  accounts: PlanningAccount[]
  planningPath: string
  requestedAccountId: string | null
}) {
  const { t } = useTranslation('planning')
  const errorMessage = useApiErrorMessage('planning')
  const navigate = useNavigate()
  const toast = useToast()
  const posted =
    content.publications?.filter((publication) =>
      ['published', 'edit_queued', 'editing', 'edit_unknown'].includes(publication.status),
    ) ?? []
  const publishedAccounts: PlanningAccount[] = posted.map(
    (publication) =>
      accounts.find((account) => account.id === publication.socialAccountId) ?? {
        ...publication.target,
        platform: content.platform,
      },
  )
  const firstAccountId = posted[0]?.socialAccountId ?? ''
  const [selectedAccountId, setSelectedAccountId] = useState(
    posted.some((publication) => publication.socialAccountId === requestedAccountId)
      ? requestedAccountId!
      : firstAccountId,
  )
  // The caption each Page is showing or is about to show on Facebook.
  const currentCaption = (publication: PlanningPublication) =>
    (publication.pendingCaption ?? publication.captionOverride ?? content.caption).trim()
  const savedCaptionMode = posted.length > 1 ? (content.captionMode ?? 'shared') : 'shared'
  const [draft, setDraft] = useState<PlanningComposerDraft>(() => ({
    ...createComposerDraftFromContent(content),
    targetIds: posted.map((publication) => publication.socialAccountId),
    captionMode: savedCaptionMode,
    captionOverrides:
      savedCaptionMode === 'per_target'
        ? Object.fromEntries(
            posted.map((publication) => [publication.socialAccountId, currentCaption(publication)]),
          )
        : {},
    caption: posted.length === 1 && posted[0] ? currentCaption(posted[0]) : content.caption,
  }))
  const [viewport, setViewport] = useState<PreviewViewport>('mobile')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const editCaptions = useEditPublishedPlanningCaptions(brandId)
  const supported =
    content.platform === 'facebook' &&
    ['facebook_feed', 'facebook_reel'].includes(content.type ?? '')
  const captionMode = usesCaptionPerAccount(draft) ? 'per_target' : 'shared'
  const captions = posted.map((publication) => ({
    publicationId: publication.id,
    caption: composerCaptionFor(draft, publication.socialAccountId).trim(),
  }))
  const changed =
    captionMode !== savedCaptionMode ||
    posted.some((publication, index) => captions[index]?.caption !== currentCaption(publication))
  const canSave = supported && changed && captions.every((item) => item.caption)
  const leaveGuard = useLeaveGuard(changed && !saving)

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await editCaptions.mutateAsync({
        brandId,
        contentId: content.id,
        captionMode,
        caption: draft.caption.trim(),
        captions: captionMode === 'per_target' ? captions : [],
      })
      toast.success({ title: t('detail.editPublishedSuccess') })
      leaveGuard.allowLeave()
      navigate(planningPath)
    } catch (error) {
      setSaveError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid min-h-full content-start gap-5">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<IconChevronLeft aria-hidden />}
          aria-label={t('composer.back')}
          onClick={() => navigate(planningPath)}
        />
        <h1 className="text-heading-2 text-text-primary">{t('detail.editPublishedTitle')}</h1>
      </header>
      {saveError ? (
        <Alert
          variant="soft"
          tone="error"
          title={errorMessage(saveError, t('detail.editPublishedError'))}
        />
      ) : null}
      {posted.some((publication) => ['edit_queued', 'editing'].includes(publication.status)) ? (
        <Alert variant="soft" tone="info" title={t('detail.editPublishedPending')} />
      ) : null}
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <div className="grid min-w-0 content-start gap-3">
          <PlanningPostEditor
            draft={draft}
            accounts={publishedAccounts}
            setDraft={setDraft}
            publishedMode
          />
          {supported ? (
            <div className="flex justify-end border-t border-border-subtle pt-3">
              <Button
                variant="primary"
                loading={saving}
                disabled={!canSave || saving}
                onClick={() => void onSave()}
              >
                {t('detail.savePublishedCaption')}
              </Button>
            </div>
          ) : null}
        </div>
        <aside className="min-w-0 xl:sticky xl:top-0 xl:h-[calc(100vh-7rem)]">
          <PlanningPostPreview
            draft={draft}
            accounts={publishedAccounts}
            previewAccountId={selectedAccountId}
            viewport={viewport}
            onPreviewAccountChange={setSelectedAccountId}
            onViewportChange={setViewport}
          />
        </aside>
      </div>
      <ConfirmDialog
        open={leaveGuard.blocked}
        title={t('composer.leaveTitle')}
        description={t('composer.leaveDescription')}
        confirmLabel={t('composer.leave')}
        cancelLabel={t('composer.stay')}
        onConfirm={leaveGuard.leave}
        onClose={leaveGuard.stay}
      />
    </div>
  )
}

function PlanningComposerWorkspace({
  brandId,
  platform,
  content,
  accounts,
  planningPath,
  requestedDate,
  requestedPostType,
  aiSuggestion,
  onCancelled,
}: {
  brandId: string
  platform: PlanningPlatform
  content?: PlanningContent
  accounts: PlanningAccount[]
  planningPath: string
  requestedDate: string | null
  requestedPostType: PlanningPostType | null
  /** Filled from an AI suggestion; saving the post marks the suggestion used. */
  aiSuggestion: AiSuggestionState | null
  /** Saving found the post deleted elsewhere: reload it so the page shows that instead. */
  onCancelled?: () => void
}) {
  const { t } = useTranslation('planning')
  const errorMessage = useApiErrorMessage('planning')
  const navigate = useNavigate()
  const shouldSchedule =
    !content && Boolean(requestedDate && requestedDate !== toDateKey(new Date()))
  const [initialDraft] = useState(() => {
    const initialDraft = content
      ? createComposerDraftFromContent(content)
      : aiSuggestion
        ? createComposerDraftFromAiSuggestion(
            aiSuggestion,
            accounts.map((account) => account.id),
          )
        : {
            ...createComposerDraft(platform),
            ...(requestedPostType ? { postType: requestedPostType } : {}),
          }
    if (!shouldSchedule || !requestedDate) return initialDraft
    return {
      ...initialDraft,
      publishMode: 'schedule' as const,
      scheduledAt: `${requestedDate}T09:00`,
    }
  })
  const [draft, setDraft] = useState(initialDraft)
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('mobile')
  const [submitPhase, setSubmitPhase] = useState<'uploading' | 'saving' | null>(null)
  // Caption errors stay hidden until the user first tries to post.
  const [captionErrorsShown, setCaptionErrorsShown] = useState(false)
  const [mediaUploads, setMediaUploads] = useState<Record<string, MediaUploadState>>({})
  const submitting = useRef(false)
  const [submitError, setSubmitError] = useState<unknown>(null)
  const createKey = useRef(crypto.randomUUID())
  const [previewAccountId, setPreviewAccountId] = useState('')
  const { granted } = usePermissions()
  const canPublishDirect = hasPermission(granted, PLANNING_ACCESS.publishDirect[0])
  const { user } = useAuth()
  // Saving someone else's pending post as a plain draft would withdraw their request.
  const canSaveDraft =
    !content || content.approvalStatus !== 'pending' || canWithdrawApproval(content, user?.id)
  const [initialIntent] = useState<PlanningPublishIntent>(() =>
    content
      ? getPlanningContentIntent(content, canPublishDirect)
      : allowedIntent(shouldSchedule ? 'schedule' : 'publish_now', canPublishDirect),
  )
  const [publishIntent, setPublishIntent] = useState<PlanningPublishIntent>(initialIntent)
  const createContent = useCreatePlanningContent(brandId)
  const updateContent = useUpdatePlanningContent(brandId)
  const setPreviewAccount = useCallback((accountId: string) => setPreviewAccountId(accountId), [])
  // Only a post with something in it is worth a warning: Pages, type or date alone are quick to
  // pick again. A new post asks whenever it has content, an AI one included; an edit, when changed.
  const dirty = useMemo(
    () =>
      hasPostContent(draft) && (!content || draftSignature(draft) !== draftSignature(initialDraft)),
    [content, draft, initialDraft],
  )
  const leaveGuard = useLeaveGuard(dirty && submitPhase === null)

  const setItemUpload = (id: string, upload: MediaUploadState) =>
    setMediaUploads((current) => ({ ...current, [id]: upload }))
  // Picked files are stored right away, so they are kept even before the post is saved; a file
  // no post ends up using is cleaned up by the API after a few days.
  const uploadsInFlight = useRef(new Map<string, Promise<void>>())
  /** The stored copy of each picked file, by the id it had in the composer. */
  const storedMedia = useRef(new Map<string, ComposerMedia>())
  const startUploads = (items: ComposerMedia[]) => {
    for (const item of items) {
      const file = item.file
      if (!file || uploadsInFlight.current.has(item.id)) continue
      setItemUpload(item.id, { status: 'uploading', percent: 0 })
      const job = uploadPlanningMedia(brandId, file, (bytes) =>
        setItemUpload(item.id, {
          status: 'uploading',
          percent: Math.floor((bytes * 100) / (file.size || 1)),
        }),
      )
        .then((uploaded) => {
          const stored: ComposerMedia = { ...uploaded, size: file.size }
          storedMedia.current.set(item.id, stored)
          moveVideoFrames(item.id, stored.id)
          setDraft((current) => ({
            ...current,
            media: current.media.map((media) => (media.id === item.id ? stored : media)),
          }))
          // The marker moves to the stored file's id, which the composer now shows.
          setMediaUploads((current) => {
            const rest = { ...current }
            delete rest[item.id]
            return { ...rest, [stored.id]: { status: 'uploaded' } }
          })
        })
        .catch(() => setItemUpload(item.id, { status: 'failed' }))
        .finally(() => uploadsInFlight.current.delete(item.id))
      uploadsInFlight.current.set(item.id, job)
    }
  }
  const retryUploads = () =>
    startUploads(draft.media.filter((item) => mediaUploads[item.id]?.status === 'failed'))

  const submit = async (intent: PlanningPublishIntent) => {
    if (submitting.current) return
    const draftNow = draft
    submitting.current = true
    setSubmitError(null)
    try {
      // Files still on their way are waited for; files that are stored are sent as stored.
      if (uploadsInFlight.current.size) {
        setSubmitPhase('uploading')
        await Promise.all(uploadsInFlight.current.values())
      }
      const draft = {
        ...draftNow,
        media: draftNow.media.map((item) => storedMedia.current.get(item.id) ?? item),
      }
      const files = draft.media.filter((item) => item.file)
      if (files.length) {
        setSubmitPhase('uploading')
        setMediaUploads((current) => ({
          ...current,
          ...Object.fromEntries(
            files.map((item) => [item.id, { status: 'uploading', percent: 0 } as const]),
          ),
        }))
      } else setSubmitPhase('saving')
      const results = await Promise.allSettled(
        draft.media.map(async (item) => {
          const file = item.file
          if (!file) return item
          try {
            const uploaded = await uploadPlanningMedia(brandId, file, (bytes) => {
              setItemUpload(item.id, {
                status: 'uploading',
                percent: Math.floor((bytes * 100) / (file.size || 1)),
              })
            })
            setItemUpload(item.id, { status: 'uploaded' })
            return { ...uploaded, size: file.size }
          } catch (error) {
            setItemUpload(item.id, { status: 'failed' })
            throw error
          }
        }),
      )
      const media = results.map((result, index) =>
        result.status === 'fulfilled' ? result.value : draft.media[index],
      )
      setDraft((current) => ({ ...current, media }))
      if (results.some((result) => result.status === 'rejected'))
        throw new Error('Media upload failed')
      // A Reel cover picked on this screen is uploaded like the media; other types send none.
      let thumbnail = draft.thumbnail
      if (draft.postType === 'facebook_reel' && thumbnail?.file) {
        const uploaded = await uploadPlanningMedia(brandId, thumbnail.file)
        thumbnail = { ...thumbnail, id: uploaded.id, name: uploaded.name, file: undefined }
        const stored = thumbnail
        setDraft((current) => ({ ...current, thumbnail: stored }))
      }
      const submittedDraft = { ...draft, media, thumbnail }
      setSubmitPhase('saving')
      if (content) {
        await updateContent.mutateAsync(
          toUpdatePlanningContentInput(brandId, content, submittedDraft, intent),
        )
      } else {
        await createContent.mutateAsync({
          ...toCreatePlanningContentInput(brandId, submittedDraft, intent),
          ...(aiSuggestion ? { aiGenerationId: aiSuggestion.generationId } : {}),
          idempotencyKey: createKey.current,
        })
      }
      leaveGuard.allowLeave()
      navigate(planningPath)
    } catch (error) {
      if (isApiErrorCode(error, 'CONTENT_CANCELLED')) onCancelled?.()
      setSubmitError(error)
    } finally {
      submitting.current = false
      setSubmitPhase(null)
      // Only failed files keep a marker, so the user sees which ones to replace or retry.
      setMediaUploads((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([, upload]) => upload.status === 'failed'),
        ),
      )
    }
  }

  // A missing caption does not lock the button: it shows its error once the user tries to post.
  const canSubmit = canSubmitComposer(draft, { ignoreCaption: true })
  const validateSubmit = () => {
    if (publishIntent === 'draft' || !isComposerCaptionMissing(draft)) return true
    setCaptionErrorsShown(true)
    return false
  }
  const saveContent = content ? updateContent : createContent

  return (
    <div className="grid min-h-full content-start gap-5">
      <header>
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<IconChevronLeft aria-hidden />}
            aria-label={t('composer.back')}
            onClick={() => navigate(planningPath)}
          />
          <h1 className="min-w-0 text-heading-2 text-text-primary">
            {t(content ? 'composer.editTitle' : 'composer.title', {
              platform: t(`platform.${platform}`),
            })}
          </h1>
        </div>
      </header>

      {saveContent.isError || submitError ? (
        <Alert
          variant="soft"
          tone="error"
          title={errorMessage(
            submitError ?? saveContent.error,
            content ? t('composer.updateError') : t('composer.submitError'),
          )}
        />
      ) : null}

      {/* The file card plays the preview's video. */}
      <PreviewPlaybackProvider>
        {/* Form, send bar and preview share one grid. From 1280px the preview stands beside
            the form and the bar sits under the form; narrower, the bar goes last and stays at
            the bottom of the screen while the form and preview scroll past. */}
        <div className="grid min-h-0 grid-cols-1 gap-x-5 gap-y-3 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)] xl:grid-rows-[auto_1fr]">
          <div className="min-w-0 xl:col-start-1 xl:row-start-1">
            <PlanningPostEditor
              draft={draft}
              accounts={accounts}
              setDraft={setDraft}
              showCaptionErrors={captionErrorsShown}
              mediaUploads={mediaUploads}
              onRetryUpload={retryUploads}
              onMediaAdded={startUploads}
            />
          </div>
          {/* Pinned past the page's bottom padding, so nothing shows beneath it. */}
          <div className="order-last -mb-4 min-w-0 bg-bg-surface pb-4 max-xl:sticky max-xl:-bottom-4 max-xl:z-[5] md:-mb-5 md:pb-5 md:max-xl:-bottom-5 xl:order-none xl:col-start-1 xl:row-start-2 xl:mb-0 xl:self-start xl:bg-transparent xl:pb-0">
            <PublishingActionBar
              draft={draft}
              accounts={accounts}
              intent={publishIntent}
              isEditing={Boolean(content)}
              initialIntent={initialIntent}
              canPublishDirect={canPublishDirect}
              canSaveDraft={canSaveDraft}
              loading={saveContent.isPending || submitPhase !== null}
              submitPhase={submitPhase}
              canSubmit={publishIntent === 'draft' || canSubmit}
              validate={validateSubmit}
              onIntentChange={(intent) => {
                setPublishIntent(intent)
                setDraft((current) => ({
                  ...current,
                  publishMode: isScheduleIntent(intent) ? 'schedule' : 'publish_now',
                }))
              }}
              onDraftChange={setDraft}
              onSubmit={() => submit(publishIntent)}
            />
          </div>
          <aside className="mt-2 min-w-0 xl:sticky xl:top-0 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:mt-0 xl:h-[calc(100vh-7rem)]">
            <PlanningPostPreview
              draft={draft}
              accounts={accounts}
              previewAccountId={previewAccountId}
              viewport={previewViewport}
              onPreviewAccountChange={setPreviewAccount}
              onViewportChange={setPreviewViewport}
            />
          </aside>
        </div>
      </PreviewPlaybackProvider>
      <ConfirmDialog
        open={leaveGuard.blocked}
        title={t('composer.leaveTitle')}
        description={t('composer.leaveDescription')}
        confirmLabel={t('composer.leave')}
        cancelLabel={t('composer.stay')}
        onConfirm={leaveGuard.leave}
        onClose={leaveGuard.stay}
      />
    </div>
  )
}

/** What the user can change in a draft; a picked file counts by its name, size and date. */
/** A caption (shared or for one Page), a link, a first comment, a file or a cover. */
function hasPostContent(draft: PlanningComposerDraft): boolean {
  return (
    draft.caption.trim() !== '' ||
    Object.values(draft.captionOverrides).some((caption) => caption.trim() !== '') ||
    draft.link.trim() !== '' ||
    draft.firstComment.trim() !== '' ||
    Object.values(draft.firstCommentOverrides).some((comment) => comment.trim() !== '') ||
    draft.media.length > 0 ||
    draft.thumbnail !== null
  )
}

function draftSignature(draft: PlanningComposerDraft): string {
  return JSON.stringify({
    ...draft,
    media: draft.media.map(({ id, url, file }) =>
      file ? [file.name, file.size, file.lastModified] : [id, url],
    ),
    thumbnail: draft.thumbnail ? [draft.thumbnail.id, draft.thumbnail.time] : null,
  })
}

function getRequestedDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) || toDateKey(date) !== value ? null : value
}

function getRequestedPostType(
  value: string | null,
  platform: PlanningPlatform,
): PlanningPostType | null {
  const allowedTypes: Record<PlanningPlatform, PlanningPostType[]> = {
    facebook: ['facebook_feed', 'facebook_story', 'facebook_reel'],
    tiktok: ['tiktok_video', 'tiktok_photo'],
  }
  return allowedTypes[platform].includes(value as PlanningPostType)
    ? (value as PlanningPostType)
    : null
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

type PublishActionLabel =
  | 'saveDraft'
  | 'submitApprovalNow'
  | 'submitApprovalSchedule'
  | 'submitApprovalScheduleByAccount'
  | 'schedule'
  | 'scheduleByAccount'
  | 'publish'

/** Composer actions; `direct` ones skip approval and need `publishing.publish_direct`. */
const PUBLISH_ACTIONS: Array<{
  key: string
  intent: PlanningPublishIntent
  label: PublishActionLabel
  byAccount?: boolean
  direct?: boolean
}> = [
  { key: 'draft', intent: 'draft', label: 'saveDraft' },
  { key: 'approval_publish_now', intent: 'approval_publish_now', label: 'submitApprovalNow' },
  { key: 'approval_schedule', intent: 'approval_schedule', label: 'submitApprovalSchedule' },
  {
    key: 'approval_schedule_by_account',
    intent: 'approval_schedule',
    label: 'submitApprovalScheduleByAccount',
    byAccount: true,
  },
  { key: 'schedule', intent: 'schedule', label: 'schedule', direct: true },
  {
    key: 'schedule_by_account',
    intent: 'schedule',
    label: 'scheduleByAccount',
    byAccount: true,
    direct: true,
  },
  { key: 'publish_now', intent: 'publish_now', label: 'publish', direct: true },
]

function PublishingActionBar({
  draft,
  accounts,
  intent,
  isEditing,
  initialIntent,
  canPublishDirect,
  canSaveDraft,
  loading,
  submitPhase,
  canSubmit,
  validate,
  onIntentChange,
  onDraftChange,
  onSubmit,
}: {
  draft: PlanningComposerDraft
  accounts: PlanningAccount[]
  intent: PlanningPublishIntent
  isEditing: boolean
  initialIntent: PlanningPublishIntent
  canPublishDirect: boolean
  canSaveDraft: boolean
  loading: boolean
  submitPhase: 'uploading' | 'saving' | null
  canSubmit: boolean
  /** Shows what still blocks the post; `false` stops the submit. */
  validate: () => boolean
  onIntentChange: (intent: PlanningPublishIntent) => void
  onDraftChange: Dispatch<SetStateAction<PlanningComposerDraft>>
  onSubmit: () => void
}) {
  const { t, i18n } = useTranslation('planning')
  const [confirming, setConfirming] = useState(false)
  const selectedAccounts = accounts.filter((account) => draft.targetIds.includes(account.id))
  const byAccount = isScheduleIntent(intent) && draft.scheduleMode === 'by_account'
  const selectedActionKey = byAccount ? `${intent}_by_account` : intent
  // Members without `publish_direct` only submit for approval; it goes out once approved.
  const actions = PUBLISH_ACTIONS.filter(
    (action) => (canPublishDirect || !action.direct) && (canSaveDraft || action.intent !== 'draft'),
  )
  const selectedAction = PUBLISH_ACTIONS.find((action) => action.key === selectedActionKey)
  // Editing keeps "Save changes" until the user picks a different action (e.g. schedule a draft).
  const actionLabel =
    isEditing && intent === initialIntent
      ? t('composer.actions.saveChanges')
      : t(`composer.actions.${selectedAction?.label ?? 'saveDraft'}`)
  const buttonLabel =
    submitPhase === 'uploading'
      ? t('composer.media.uploading')
      : submitPhase === 'saving'
        ? t(intent === 'publish_now' ? 'composer.actions.publishing' : 'composer.actions.saving')
        : actionLabel
  const usesSharedSchedule = isScheduleIntent(intent) && draft.scheduleMode === 'same_time'
  const usesAccountSchedule = byAccount
  const hasNoScheduledAccounts = usesAccountSchedule && selectedAccounts.length === 0

  // Anything that goes to Facebook or to an approver is confirmed first; a draft just saves.
  const confirmText = (): { title: string; description: string } => {
    const pages = selectedAccounts.map((account) => account.name).join(', ')
    const count = selectedAccounts.length
    const time = formatDateTime(draft.scheduledAt, i18n.resolvedLanguage as AppLocale)
    if (intent === 'publish_now')
      return {
        title: t('composer.confirm.publishTitle'),
        description: t('composer.confirm.publish', { pages }),
      }
    if (intent === 'schedule')
      return {
        title: t('composer.confirm.scheduleTitle'),
        description: byAccount
          ? t('composer.confirm.scheduleByAccount', { count })
          : t('composer.confirm.schedule', { pages, time }),
      }
    return {
      title: t('composer.confirm.approvalTitle'),
      description:
        intent === 'approval_publish_now'
          ? t('composer.confirm.approvalNow', { pages })
          : byAccount
            ? t('composer.confirm.approvalByAccount', { count })
            : t('composer.confirm.approvalSchedule', { pages, time }),
    }
  }
  const onPrimaryClick = () => {
    if (!validate()) return
    if (intent === 'draft') onSubmit()
    else setConfirming(true)
  }
  const confirm = confirming ? confirmText() : null

  const selectAction = (key: string) => {
    const action = PUBLISH_ACTIONS.find((item) => item.key === key)
    if (!action) return
    if (isScheduleIntent(action.intent))
      onDraftChange((current) => ({
        ...current,
        scheduleMode: action.byAccount ? 'by_account' : 'same_time',
      }))
    onIntentChange(action.intent)
  }

  return (
    // Under the preview on narrower screens it is pinned to the bottom: a solid background keeps
    // what scrolls behind it out of the way.
    <div className="grid gap-3 border-t border-border-subtle bg-bg-surface pt-3 max-xl:pb-3">
      {usesAccountSchedule && selectedAccounts.length > 0 ? (
        <div className="grid gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
          {selectedAccounts.map((account) => (
            <div
              key={account.id}
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,1fr)] sm:items-center"
            >
              <SocialAccountLabel
                name={account.name}
                avatarUrl={account.avatarUrl}
                className="min-w-0 text-body-sm text-text-primary"
              />
              <DatePicker
                showTime
                aria-label={t('composer.publishing.accountDateTime', { account: account.name })}
                placeholder={t('composer.publishing.dateTimePlaceholder')}
                value={draft.accountSchedules[account.id] ?? ''}
                className="w-full"
                onChange={(value) =>
                  onDraftChange((current) => ({
                    ...current,
                    accountSchedules: {
                      ...current.accountSchedules,
                      [account.id]: value,
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={
          usesSharedSchedule || hasNoScheduledAccounts
            ? 'grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'
            : 'flex items-center justify-end'
        }
      >
        {usesSharedSchedule ? (
          <DatePicker
            showTime
            aria-label={t('composer.publishing.dateTime')}
            placeholder={t('composer.publishing.dateTimePlaceholder')}
            value={draft.scheduledAt}
            className="w-full min-w-0"
            onChange={(value) => onDraftChange((current) => ({ ...current, scheduledAt: value }))}
          />
        ) : null}
        {hasNoScheduledAccounts ? (
          <p className="min-w-0 text-body-sm text-text-tertiary">
            {t('composer.publishing.selectAccountsToSchedule')}
          </p>
        ) : null}
        {/* A phone gets the whole row to tap. */}
        <div className="flex w-full items-center sm:w-auto">
          <Button
            variant="primary"
            layered={false}
            icon={<IconSend aria-hidden />}
            loading={loading}
            disabled={!canSubmit}
            className="min-w-0 flex-1 rounded-e-none border-[2px] border-e-bg-surface sm:flex-none"
            onClick={onPrimaryClick}
          >
            {buttonLabel}
          </Button>
          {
            <Dropdown
              placement="topRight"
              selectedKey={selectedActionKey}
              items={actions.map((action) => ({
                key: action.key,
                label: (
                  <PublishOption
                    title={t(`composer.actions.${action.label}`)}
                    description={t(`composer.actions.${action.label}Hint`)}
                  />
                ),
              }))}
              onSelect={selectAction}
            >
              <Button
                variant="primary"
                layered={false}
                icon={<IconChevronDown aria-hidden />}
                aria-label={t('composer.actions.chooseAction')}
                className="-ms-px rounded-s-none px-2"
              />
            </Dropdown>
          }
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        tone="primary"
        icon={
          isScheduleIntent(intent) ? (
            <IconCalendar aria-hidden className="text-brand-700" />
          ) : (
            <IconSendLine aria-hidden className="text-brand-700" />
          )
        }
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={
          isEditing && intent === initialIntent
            ? t('composer.actions.saveChanges')
            : intent === 'publish_now'
              ? t('composer.actions.publish')
              : intent === 'schedule'
                ? t('composer.actions.schedule')
                : t('composer.confirm.sendForApproval')
        }
        onConfirm={() => {
          setConfirming(false)
          onSubmit()
        }}
        onClose={() => setConfirming(false)}
      />
    </div>
  )
}

function PublishOption({ title, description }: { title: string; description: string }) {
  return (
    <span className="grid min-w-56 gap-0.5 py-1">
      <span className="text-body-sm text-text-primary">{title}</span>
      <span className="text-caption text-text-tertiary">{description}</span>
    </span>
  )
}
