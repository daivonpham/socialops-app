import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { useActiveBrand } from '@/shared/scope'
import {
  Alert,
  Button,
  DatePicker,
  Dropdown,
  IconChevronDown,
  IconChevronLeft,
  IconSend,
  Progress,
  SectionSkeleton,
  useToast,
} from '@/shared/ui'
import {
  useCreatePlanningContent,
  useEditPublishedPlanningCaption,
  usePlanningAccounts,
  usePlanningContent,
  useUpdatePlanningContent,
  type PlanningContent,
  type PlanningPlatform,
  type PlanningPostType,
  type PlanningPublishIntent,
} from '../api'
import { uploadPlanningMedia } from '../api/service'
import { PlanningPostEditor } from '../components/composer/PlanningPostEditor'
import { getPlanningPath } from '../config/planning.routes'
import { canPublishOnPlatform } from '../config/planning-capabilities'
import { PlanningPostPreview } from '../components/preview/PlanningPostPreview'
import {
  canSubmitComposer,
  createComposerDraft,
  createComposerDraftFromContent,
  getPlanningContentIntent,
  toCreatePlanningContentInput,
  toUpdatePlanningContentInput,
  type PlanningAccount,
  type PlanningComposerDraft,
  type PreviewViewport,
} from '../model'

export default function CreatePlanningPostPage() {
  const { t } = useTranslation('planning')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
        `create-${platform}-${requestedPostType ?? 'default'}-${requestedDate ?? 'now'}`
      }
      brandId={brandId}
      platform={platform}
      content={content}
      accounts={accounts}
      planningPath={planningPath}
      requestedDate={requestedDate}
      requestedPostType={requestedPostType}
    />
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
  const navigate = useNavigate()
  const toast = useToast()
  const posted =
    content.publications?.filter((publication) =>
      ['published', 'edit_queued', 'editing', 'edit_unknown'].includes(publication.status),
    ) ?? []
  // An uncertain edit can be saved again; writing a caption to Facebook is idempotent.
  const published = posted.filter((publication) =>
    ['published', 'edit_unknown'].includes(publication.status),
  )
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
  const [draft, setDraft] = useState(() => {
    const initial = createComposerDraftFromContent(content)
    return {
      ...initial,
      targetIds: posted.map((publication) => publication.socialAccountId),
      captionOverrides: {
        ...initial.captionOverrides,
        ...Object.fromEntries(
          posted.flatMap((publication) =>
            publication.pendingCaption
              ? [[publication.socialAccountId, publication.pendingCaption]]
              : [],
          ),
        ),
      },
      caption:
        posted.length === 1
          ? (posted[0]?.pendingCaption ?? posted[0]?.captionOverride ?? content.caption)
          : content.caption,
    }
  })
  const [viewport, setViewport] = useState<PreviewViewport>('mobile')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const editCaption = useEditPublishedPlanningCaption(brandId)
  const supported =
    content.platform === 'facebook' &&
    ['facebook_feed', 'facebook_reel'].includes(content.type ?? '')
  const changes = published
    .map((publication) => ({
      publicationId: publication.id,
      caption: (posted.length === 1
        ? draft.caption
        : draft.captionOverrides[publication.socialAccountId] || draft.caption
      ).trim(),
      original: (publication.captionOverride ?? content.caption).trim(),
    }))
    .filter((item) => item.caption !== item.original)
  const canSave = supported && changes.length > 0 && changes.every((item) => item.caption)

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setSaveError(false)
    try {
      const results = await Promise.allSettled(
        changes.map((change) =>
          editCaption.mutateAsync({
            brandId,
            publicationId: change.publicationId,
            caption: change.caption,
          }),
        ),
      )
      if (results.some((result) => result.status === 'rejected')) {
        setSaveError(true)
        return
      }
      toast.success({ title: t('detail.editPublishedSuccess') })
      navigate(planningPath)
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid min-h-full gap-5">
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
        <Alert variant="soft" tone="error" title={t('detail.editPublishedError')} />
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
}: {
  brandId: string
  platform: PlanningPlatform
  content?: PlanningContent
  accounts: PlanningAccount[]
  planningPath: string
  requestedDate: string | null
  requestedPostType: PlanningPostType | null
}) {
  const { t } = useTranslation('planning')
  const navigate = useNavigate()
  const shouldSchedule =
    !content && Boolean(requestedDate && requestedDate !== toDateKey(new Date()))
  const [draft, setDraft] = useState(() => {
    const initialDraft = content
      ? createComposerDraftFromContent(content)
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
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('mobile')
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const submitting = useRef(false)
  const [uploadFailed, setUploadFailed] = useState(false)
  const createKey = useRef(crypto.randomUUID())
  const [previewAccountId, setPreviewAccountId] = useState('')
  const [initialIntent] = useState<PlanningPublishIntent>(() =>
    content ? getPlanningContentIntent(content) : shouldSchedule ? 'schedule' : 'publish_now',
  )
  const [publishIntent, setPublishIntent] = useState<PlanningPublishIntent>(initialIntent)
  const createContent = useCreatePlanningContent(brandId)
  const updateContent = useUpdatePlanningContent(brandId)
  const setPreviewAccount = useCallback((accountId: string) => setPreviewAccountId(accountId), [])

  const submit = async (intent: 'draft' | 'approval' | 'publish_now' | 'schedule') => {
    if (submitting.current) return
    submitting.current = true
    setUploading(true)
    setUploadFailed(false)
    try {
      const files = draft.media.filter((item) => item.file)
      const totalBytes = files.reduce((sum, item) => sum + item.file!.size, 0)
      const loaded = new Map<string, number>()
      if (totalBytes) setUploadPercent(0)
      const results = await Promise.allSettled(
        draft.media.map(async (item) =>
          item.file
            ? uploadPlanningMedia(brandId, item.file, (bytes) => {
                loaded.set(item.id, bytes)
                setUploadPercent(
                  Math.floor(
                    ([...loaded.values()].reduce((sum, value) => sum + value, 0) * 100) /
                      totalBytes,
                  ),
                )
              })
            : item,
        ),
      )
      const media = results.map((result, index) =>
        result.status === 'fulfilled' ? result.value : draft.media[index],
      )
      setDraft((current) => ({ ...current, media }))
      if (results.some((result) => result.status === 'rejected'))
        throw new Error('Media upload failed')
      const submittedDraft = { ...draft, media }
      if (content) {
        await updateContent.mutateAsync(
          toUpdatePlanningContentInput(brandId, content, submittedDraft, intent),
        )
      } else {
        await createContent.mutateAsync({
          ...toCreatePlanningContentInput(brandId, submittedDraft, intent),
          idempotencyKey: createKey.current,
        })
      }
      navigate(planningPath)
    } catch {
      setUploadFailed(true)
    } finally {
      submitting.current = false
      setUploading(false)
      setUploadPercent(null)
    }
  }

  const canSubmit = canSubmitComposer(draft)
  const saveContent = content ? updateContent : createContent

  return (
    <div className="grid min-h-full gap-5">
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

      {saveContent.isError || uploadFailed ? (
        <Alert
          variant="soft"
          tone="error"
          title={content ? t('composer.updateError') : t('composer.submitError')}
        />
      ) : null}

      {uploadPercent !== null ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-border-subtle bg-bg-surface p-4"
        >
          <p className="mb-2 text-body-sm text-text-secondary">
            {t('composer.media.uploadProgress', { percent: uploadPercent })}
          </p>
          <Progress
            percent={uploadPercent}
            ariaLabel={t('composer.media.uploadProgress', { percent: uploadPercent })}
          />
        </div>
      ) : null}

      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <div className="grid min-w-0 content-start gap-3">
          <PlanningPostEditor draft={draft} accounts={accounts} setDraft={setDraft} />
          <PublishingActionBar
            draft={draft}
            accounts={accounts}
            intent={publishIntent}
            isEditing={Boolean(content)}
            initialIntent={initialIntent}
            loading={saveContent.isPending || uploading}
            canSubmit={publishIntent === 'draft' || canSubmit}
            onIntentChange={(intent) => {
              setPublishIntent(intent)
              setDraft((current) => ({
                ...current,
                publishMode: intent === 'schedule' ? 'schedule' : 'publish_now',
              }))
            }}
            onDraftChange={setDraft}
            onSubmit={() => submit(publishIntent)}
          />
        </div>
        <aside className="min-w-0 xl:sticky xl:top-0 xl:h-[calc(100vh-7rem)]">
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
    </div>
  )
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

function PublishingActionBar({
  draft,
  accounts,
  intent,
  isEditing,
  initialIntent,
  loading,
  canSubmit,
  onIntentChange,
  onDraftChange,
  onSubmit,
}: {
  draft: PlanningComposerDraft
  accounts: PlanningAccount[]
  intent: PlanningPublishIntent
  isEditing: boolean
  initialIntent: PlanningPublishIntent
  loading: boolean
  canSubmit: boolean
  onIntentChange: (intent: PlanningPublishIntent) => void
  onDraftChange: Dispatch<SetStateAction<PlanningComposerDraft>>
  onSubmit: () => void
}) {
  const { t } = useTranslation('planning')
  const selectedAccounts = accounts.filter((account) => draft.targetIds.includes(account.id))
  // Editing keeps "Save changes" until the user picks a different action (e.g. schedule a draft).
  const actionLabel =
    isEditing && intent === initialIntent
      ? t('composer.actions.saveChanges')
      : {
          draft: t('composer.actions.saveDraft'),
          approval: t('composer.actions.submitApproval'),
          schedule:
            draft.scheduleMode === 'by_account'
              ? t('composer.actions.scheduleByAccount')
              : t('composer.actions.schedule'),
          publish_now: t('composer.actions.publish'),
        }[intent]
  const selectedActionKey =
    intent === 'schedule' && draft.scheduleMode === 'by_account' ? 'schedule_by_account' : intent
  const usesSharedSchedule = intent === 'schedule' && draft.scheduleMode === 'same_time'
  const usesAccountSchedule = intent === 'schedule' && draft.scheduleMode === 'by_account'
  const hasNoScheduledAccounts = usesAccountSchedule && selectedAccounts.length === 0

  const selectAction = (key: string) => {
    if (key === 'schedule' || key === 'schedule_by_account') {
      onDraftChange((current) => ({
        ...current,
        scheduleMode: key === 'schedule_by_account' ? 'by_account' : 'same_time',
      }))
      onIntentChange('schedule')
      return
    }

    onIntentChange(key as PlanningPublishIntent)
  }

  return (
    <div className="grid gap-3 border-t border-border-subtle pt-3">
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
            ? 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'
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
        <div className="flex items-center">
          <Button
            variant="primary"
            layered={false}
            icon={<IconSend aria-hidden />}
            loading={loading}
            disabled={!canSubmit}
            className="rounded-e-none border-[2px] border-e-bg-surface"
            onClick={onSubmit}
          >
            {actionLabel}
          </Button>
          {
            <Dropdown
              placement="topRight"
              selectedKey={selectedActionKey}
              items={[
                {
                  key: 'draft',
                  label: (
                    <PublishOption
                      title={t('composer.actions.saveDraft')}
                      description={t('composer.actions.saveDraftHint')}
                    />
                  ),
                },
                {
                  key: 'approval',
                  label: (
                    <PublishOption
                      title={t('composer.actions.submitApproval')}
                      description={t('composer.actions.submitApprovalHint')}
                    />
                  ),
                },
                {
                  key: 'schedule',
                  label: (
                    <PublishOption
                      title={t('composer.actions.schedule')}
                      description={t('composer.actions.scheduleHint')}
                    />
                  ),
                },
                {
                  key: 'schedule_by_account',
                  label: (
                    <PublishOption
                      title={t('composer.actions.scheduleByAccount')}
                      description={t('composer.actions.scheduleByAccountHint')}
                    />
                  ),
                },
                {
                  key: 'publish_now',
                  label: (
                    <PublishOption
                      title={t('composer.actions.publish')}
                      description={t('composer.actions.publishHint')}
                    />
                  ),
                },
              ]}
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
