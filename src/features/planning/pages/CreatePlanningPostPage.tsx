import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
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
  usePlanningContents,
  type PlanningContent,
  type PlanningPlatform,
  type PlanningPublishIntent,
} from '../api'
import { PlanningPostEditor } from '../components/composer/PlanningPostEditor'
import { getPlanningPath } from '../config/planning.routes'
import { PlanningPostPreview } from '../components/preview/PlanningPostPreview'
import {
  canSubmitComposer,
  createComposerDraft,
  toCreatePlanningContentInput,
  type PlanningAccount,
  type PlanningComposerDraft,
  type PreviewViewport,
} from '../model'

export default function CreatePlanningPostPage() {
  const { t } = useTranslation('planning')
  const navigate = useNavigate()
  const { brandId } = useActiveBrand()
  const { platform: platformParam } = useParams<{ platform: string }>()
  const platform: PlanningPlatform = platformParam === 'tiktok' ? 'tiktok' : 'facebook'
  const isValidPlatform = platformParam === 'facebook' || platformParam === 'tiktok'
  const [draft, setDraft] = useState(() => createComposerDraft(platform))
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('mobile')
  const [previewAccountId, setPreviewAccountId] = useState('')
  const [publishIntent, setPublishIntent] = useState<PlanningPublishIntent>('publish_now')
  const createContent = useCreatePlanningContent(brandId)
  const catalogQuery = usePlanningContents(brandId, {
    platform: 'all',
    accountId: 'all',
    status: 'all',
  })
  const accounts = collectAccounts(catalogQuery.data?.items ?? []).filter(
    (account) => account.platform === platform,
  )
  const planningPath = getPlanningPath(platform)
  const setPreviewAccount = useCallback((accountId: string) => setPreviewAccountId(accountId), [])

  if (!isValidPlatform) return <Navigate to="/" replace />

  const submit = (intent: 'draft' | 'approval' | 'publish_now' | 'schedule') => {
    if (!brandId) return
    createContent.mutate(toCreatePlanningContentInput(brandId, draft, intent), {
      onSuccess: () => navigate(planningPath),
    })
  }

  if (catalogQuery.isPending) {
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={8} />
      </div>
    )
  }

  const canSubmit = canSubmitComposer(draft)

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
            {t('composer.title', { platform: t(`platform.${platform}`) })}
          </h1>
        </div>
      </header>

      {createContent.isError ? <Alert tone="error" title={t('composer.submitError')} /> : null}
      {catalogQuery.isError ? (
        <Alert tone="error" title={t('composer.accounts.loadError')} />
      ) : null}

      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <div className="grid min-w-0 content-start gap-3">
          <PlanningPostEditor draft={draft} accounts={accounts} setDraft={setDraft} />
          <PublishingActionBar
            draft={draft}
            accounts={accounts}
            intent={publishIntent}
            loading={createContent.isPending}
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

function PublishingActionBar({
  draft,
  accounts,
  intent,
  loading,
  canSubmit,
  onIntentChange,
  onDraftChange,
  onSubmit,
}: {
  draft: PlanningComposerDraft
  accounts: PlanningAccount[]
  intent: PlanningPublishIntent
  loading: boolean
  canSubmit: boolean
  onIntentChange: (intent: PlanningPublishIntent) => void
  onDraftChange: Dispatch<SetStateAction<PlanningComposerDraft>>
  onSubmit: () => void
}) {
  const { t } = useTranslation('planning')
  const selectedAccounts = accounts.filter((account) => draft.targetIds.includes(account.id))
  const actionLabel = {
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
            className="rounded-e-none"
            onClick={onSubmit}
          >
            {actionLabel}
          </Button>
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
