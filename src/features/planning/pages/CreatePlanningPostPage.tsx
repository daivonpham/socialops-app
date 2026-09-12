import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
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
  SectionSkeleton,
} from '@/shared/ui'
import {
  useCreatePlanningContent,
  usePlanningContent,
  usePlanningContents,
  useUpdatePlanningContent,
  type PlanningContent,
  type PlanningPlatform,
  type PlanningPostType,
  type PlanningPublishIntent,
} from '../api'
import { PlanningPostEditor } from '../components/composer/PlanningPostEditor'
import { getPlanningPath } from '../config/planning.routes'
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
  const catalogQuery = usePlanningContents(brandId, {
    platform: 'all',
    accountId: 'all',
    status: 'all',
  })
  const contentQuery = usePlanningContent(brandId, contentId ?? null)
  const planningPath = getPlanningPath(platform)

  if (!isValidPlatform || !brandId) return <Navigate to="/" replace />

  if (catalogQuery.isPending || (isEditing && contentQuery.isPending)) {
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={8} />
      </div>
    )
  }

  if (catalogQuery.isError || (isEditing && (contentQuery.isError || !contentQuery.data))) {
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
          tone="error"
          title={isEditing ? t('composer.editLoadError') : t('composer.accounts.loadError')}
        />
      </div>
    )
  }

  const content = contentQuery.data
  if (content && content.platform !== platform) return <Navigate to={planningPath} replace />
  const accounts = collectAccounts(catalogQuery.data?.items ?? []).filter(
    (account) => account.platform === platform,
  )

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
  const [previewAccountId, setPreviewAccountId] = useState('')
  const [publishIntent, setPublishIntent] = useState<PlanningPublishIntent>(() =>
    content ? getPlanningContentIntent(content) : shouldSchedule ? 'schedule' : 'publish_now',
  )
  const createContent = useCreatePlanningContent(brandId)
  const updateContent = useUpdatePlanningContent(brandId)
  const setPreviewAccount = useCallback((accountId: string) => setPreviewAccountId(accountId), [])

  const submit = (intent: 'draft' | 'approval' | 'publish_now' | 'schedule') => {
    const options = {
      onSuccess: () => navigate(planningPath),
    }
    if (content) {
      updateContent.mutate(toUpdatePlanningContentInput(brandId, content, draft, intent), options)
      return
    }
    createContent.mutate(toCreatePlanningContentInput(brandId, draft, intent), options)
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

      {saveContent.isError ? (
        <Alert
          tone="error"
          title={content ? t('composer.updateError') : t('composer.submitError')}
        />
      ) : null}

      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <div className="grid min-w-0 content-start gap-3">
          <PlanningPostEditor draft={draft} accounts={accounts} setDraft={setDraft} />
          <PublishingActionBar
            draft={draft}
            accounts={accounts}
            intent={publishIntent}
            isEditing={Boolean(content)}
            loading={saveContent.isPending}
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
  loading: boolean
  canSubmit: boolean
  onIntentChange: (intent: PlanningPublishIntent) => void
  onDraftChange: Dispatch<SetStateAction<PlanningComposerDraft>>
  onSubmit: () => void
}) {
  const { t } = useTranslation('planning')
  const selectedAccounts = accounts.filter((account) => draft.targetIds.includes(account.id))
  const actionLabel = isEditing
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
            icon={<IconSend aria-hidden />}
            loading={loading}
            disabled={!canSubmit}
            className={isEditing ? undefined : 'rounded-e-none'}
            onClick={onSubmit}
          >
            {actionLabel}
          </Button>
          {isEditing ? null : (
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
                icon={<IconChevronDown aria-hidden />}
                aria-label={t('composer.actions.chooseAction')}
                className="-ms-px rounded-s-none px-2"
              />
            </Dropdown>
          )}
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

function collectAccounts(contents: PlanningContent[]): PlanningAccount[] {
  const accounts = new Map<string, PlanningAccount>()
  for (const content of contents) {
    for (const target of content.targets) {
      accounts.set(`${content.platform}:${target.id}`, { ...target, platform: content.platform })
    }
  }
  return [...accounts.values()]
}
