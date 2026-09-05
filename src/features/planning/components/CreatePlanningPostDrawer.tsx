import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  IconFacebook,
  IconTikTok,
  Input,
  Select,
  Textarea,
} from '@/shared/ui'
import { useCreatePlanningContent, type PlanningPlatform } from '../api'
import type { PlanningAccount } from '../model'

export function CreatePlanningPostDrawer({
  brandId,
  platform,
  accounts,
  onClose,
}: {
  brandId: string
  platform: PlanningPlatform | null
  accounts: PlanningAccount[]
  onClose: () => void
}) {
  const { t } = useTranslation('planning')
  const createContent = useCreatePlanningContent(brandId)
  const resetCreateContent = createContent.reset
  const [caption, setCaption] = useState('')
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [createMode, setCreateMode] = useState<'draft' | 'scheduled'>('draft')
  const [scheduledAt, setScheduledAt] = useState('')
  const platformAccounts = accounts.filter((account) => account.platform === platform)
  const canSubmit =
    Boolean(platform) &&
    caption.trim().length > 0 &&
    targetIds.length > 0 &&
    (createMode === 'draft' || Boolean(scheduledAt))

  useEffect(() => {
    setCaption('')
    setTargetIds([])
    setCreateMode('draft')
    setScheduledAt('')
    resetCreateContent()
  }, [platform, resetCreateContent])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!platform || !canSubmit) return
    createContent.mutate(
      {
        brandId,
        platform,
        targetIds,
        caption: caption.trim(),
        status: createMode,
        scheduledAt: createMode === 'scheduled' ? new Date(scheduledAt).toISOString() : undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Drawer
      open={Boolean(platform)}
      onClose={onClose}
      placement="right"
      width="normal"
      title={platform ? t('create.title', { platform: t(`platform.${platform}`) }) : undefined}
    >
      {platform ? (
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <div className="app-scrollbar grid flex-1 content-start gap-5 overflow-y-auto p-5">
            <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface-subtle p-4">
              <span className="flex text-icon-lg">
                {platform === 'facebook' ? (
                  <IconFacebook className="text-platform-facebook" />
                ) : (
                  <IconTikTok className="text-text-primary" />
                )}
              </span>
              <div>
                <p className="text-label-md text-text-primary">{t(`platform.${platform}`)}</p>
                <p className="text-caption text-text-tertiary">{t('create.singlePlatformHint')}</p>
              </div>
            </div>

            <Textarea
              label={t('create.caption')}
              value={caption}
              rows={5}
              maxLength={2200}
              onChange={(event) => setCaption(event.target.value)}
              placeholder={t('create.captionPlaceholder')}
            />

            <fieldset>
              <legend className="text-label-md text-text-secondary">{t('create.accounts')}</legend>
              <div className="mt-2 overflow-hidden rounded-xl border border-border-subtle">
                {platformAccounts.map((account) => (
                  <label
                    key={account.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-border-subtle p-3 last:border-b-0 hover:bg-bg-surface-subtle"
                  >
                    <Checkbox
                      checked={targetIds.includes(account.id)}
                      onChange={(event) =>
                        setTargetIds((current) =>
                          event.target.checked
                            ? [...current, account.id]
                            : current.filter((id) => id !== account.id),
                        )
                      }
                    />
                    <SocialAccountLabel
                      name={account.name}
                      avatarUrl={account.avatarUrl}
                      className="flex-1 text-body-sm text-text-primary"
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <Select
              label={t('create.publishMode')}
              value={createMode}
              onChange={(event) => setCreateMode(event.target.value as 'draft' | 'scheduled')}
              options={[
                { value: 'draft', label: t('status.draft') },
                { value: 'scheduled', label: t('status.scheduled') },
              ]}
            />

            {createMode === 'scheduled' ? (
              <Input
                type="datetime-local"
                label={t('create.scheduledAt')}
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            ) : null}

            {createContent.isError ? <Alert tone="error" title={t('create.error')} /> : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-subtle p-4">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              htmlType="submit"
              variant="primary"
              loading={createContent.isPending}
              disabled={!canSubmit}
            >
              {createMode === 'scheduled' ? t('create.schedule') : t('create.saveDraft')}
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  )
}
