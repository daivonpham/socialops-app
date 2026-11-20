import { useEffect } from 'react'
import { useTikTokCreatorInfo } from '@/features/tiktok'
import { useActiveBrand } from '@/shared/scope'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { IconDesktop, IconMobile, Select, Tabs, Tooltip } from '@/shared/ui'
import type { PlanningAccount } from '../../model'
import {
  composerCaptionFor,
  readTikTokSettings,
  type PlanningComposerDraft,
  type PreviewViewport,
} from '../../model/composer'
import { FacebookPostPreview } from './FacebookPostPreview'
import { TikTokPostPreview } from './TikTokPostPreview'

export function PlanningPostPreview({
  draft,
  accounts,
  previewAccountId,
  viewport,
  onPreviewAccountChange,
  onViewportChange,
}: {
  draft: PlanningComposerDraft
  accounts: PlanningAccount[]
  previewAccountId: string
  viewport: PreviewViewport
  onPreviewAccountChange: (accountId: string) => void
  onViewportChange: (viewport: PreviewViewport) => void
}) {
  const { t } = useTranslation('planning')
  const selectedAccounts = accounts.filter((account) => draft.targetIds.includes(account.id))
  const account =
    selectedAccounts.find((item) => item.id === previewAccountId) ?? selectedAccounts[0]

  useEffect(() => {
    if (account && account.id !== previewAccountId) onPreviewAccountChange(account.id)
  }, [account, onPreviewAccountChange, previewAccountId])

  const caption = account ? composerCaptionFor(draft, account.id) : draft.caption
  // Read from the cache the TikTok settings fill; TikTok shows the @username.
  const { brandId } = useActiveBrand()
  const creator = useTikTokCreatorInfo(
    brandId,
    draft.platform === 'tiktok' ? (account?.id ?? null) : null,
  )

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-xs">
      <div className="flex shrink-0 flex-col items-center gap-3 border-b border-border-subtle px-4 py-2 sm:flex-row sm:justify-between">
        <h2 className="text-heading-3 text-text-primary">{t('composer.preview.title')}</h2>
        <div className="flex items-center justify-center self-center leading-none">
          <Tabs
            value={viewport}
            ariaLabel={t('composer.preview.viewport')}
            onChange={onViewportChange}
            options={[
              {
                value: 'mobile',
                label: (
                  <Tooltip title={t('composer.preview.mobile')}>
                    <span
                      className="flex size-8 items-center justify-center text-icon-md leading-none"
                      aria-label={t('composer.preview.mobile')}
                    >
                      <IconMobile
                        aria-hidden
                        className="flex items-center justify-center leading-none"
                      />
                    </span>
                  </Tooltip>
                ),
              },
              {
                value: 'desktop',
                label: (
                  <Tooltip title={t('composer.preview.desktop')}>
                    <span
                      className="flex size-8 items-center justify-center text-icon-md leading-none"
                      aria-label={t('composer.preview.desktop')}
                    >
                      <IconDesktop
                        aria-hidden
                        className="flex items-center justify-center leading-none"
                      />
                    </span>
                  </Tooltip>
                ),
              },
            ]}
          />
        </div>
      </div>

      {selectedAccounts.length > 1 ? (
        <div className="border-b border-border-subtle p-4">
          <Select
            label={t('composer.preview.account')}
            value={account?.id}
            className="w-full"
            onChange={(event) => onPreviewAccountChange(event.target.value)}
            options={selectedAccounts.map((item) => ({
              value: item.id,
              label: <SocialAccountLabel name={item.name} avatarUrl={item.avatarUrl} />,
              searchText: item.name,
            }))}
          />
        </div>
      ) : null}

      <div className="app-scrollbar flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-x-hidden overflow-y-auto bg-bg-surface-subtle p-4 sm:p-6">
        {draft.platform === 'facebook' ? (
          <FacebookPostPreview
            account={account}
            caption={caption}
            media={draft.media}
            viewport={viewport}
            postType={draft.postType}
          />
        ) : (
          <TikTokPostPreview
            account={account}
            caption={caption}
            media={draft.media}
            viewport={viewport}
            {...tiktokPreviewOptions(draft)}
            handle={creator.data?.creatorUsername}
          />
        )}
      </div>
    </section>
  )
}

/** The photo title and the labels TikTok will show, from the post's TikTok settings. */
export function tiktokPreviewOptions(draft: PlanningComposerDraft) {
  const settings = readTikTokSettings(draft.platformSettings)
  return {
    title: draft.postType === 'tiktok_photo' ? settings.photoTitle : undefined,
    labels: {
      brandOrganic: settings.brandOrganic,
      brandContent: settings.brandContent,
      isAigc: settings.aiGenerated,
      privateOnly: settings.mode === 'direct' && settings.privacyLevel === 'SELF_ONLY',
    },
  }
}
