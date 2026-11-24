import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { TIKTOK_PRIVACY_LEVELS, useTikTokCreatorInfos } from '@/features/tiktok'
import { useApiErrorMessage } from '@/shared/hooks'
import { useActiveBrand } from '@/shared/scope'
import {
  Alert,
  Avatar,
  Checkbox,
  IconInfo,
  Input,
  Select,
  Spin,
  Switch,
  Tabs,
  Tooltip,
} from '@/shared/ui'
import type { PlanningAccount } from '../../model'
import { TikTokTermsConsent } from '../TikTokTermsConsent'
import { TIKTOK_LIMITS, readTikTokSettings, type PlanningComposerDraft } from '../../model/composer'

/** A video's length in seconds, read from the file once it loads. */
function useVideoDuration(url?: string): number | null {
  const [duration, setDuration] = useState<{ url: string; seconds: number } | null>(null)
  useEffect(() => {
    if (!url) return
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => setDuration({ url, seconds: video.duration })
    video.src = url
    return () => {
      video.onloadedmetadata = null
      video.removeAttribute('src')
    }
  }, [url])
  return duration && duration.url === url ? duration.seconds : null
}

/**
 * The TikTok options of a post, built to TikTok's Content Sharing Guidelines: the creator's
 * nickname is shown, the audience has no default and comes from what every account allows,
 * interactions start unticked and lock when an account turned them off, commercial content asks
 * which kind, and the music and branded content terms sit above the post button.
 */
export function TikTokPostSettings({
  draft,
  setDraft,
  accounts,
  disabled = false,
  onBlockedChange,
}: {
  draft: PlanningComposerDraft
  setDraft: Dispatch<SetStateAction<PlanningComposerDraft>>
  /** The accounts the post goes to. */
  accounts: PlanningAccount[]
  disabled?: boolean
  /**
   * Whether TikTok's guidelines forbid posting right now: an account's creator info is still
   * loading or failed (it cannot post), or the video is longer than an account may post.
   */
  onBlockedChange?: (blocked: boolean) => void
}) {
  const { t } = useTranslation('planning')
  const errorMessage = useApiErrorMessage('planning')
  const { brandId } = useActiveBrand()
  const infos = useTikTokCreatorInfos(
    brandId,
    accounts.map((account) => account.id),
  )
  const settings = readTikTokSettings(draft.platformSettings)
  const photo = draft.postType === 'tiktok_photo'
  const video = draft.media.find((item) => item.type === 'video')
  const duration = useVideoDuration(video?.url)
  const loaded = infos.flatMap((query) => (query.data ? [query.data] : []))
  const loading = infos.some((query) => query.isPending)

  const set = (patch: Record<string, string | boolean>) =>
    setDraft((current) => ({
      ...current,
      platformSettings: { ...current.platformSettings, ...patch },
    }))

  // Only what every selected account allows can be offered.
  const privacyOptions = TIKTOK_PRIVACY_LEVELS.filter((level) =>
    loaded.length ? loaded.every((info) => info.privacyLevelOptions.includes(level)) : false,
  )
  const publicPending = loaded.some((info) => info.publicPostingPending)
  const commentLocked = loaded.some((info) => info.commentDisabled)
  const duetLocked = loaded.some((info) => info.duetDisabled)
  const stitchLocked = loaded.some((info) => info.stitchDisabled)
  const maxDuration = loaded.length
    ? Math.min(...loaded.map((info) => info.maxVideoPostDurationSec || Infinity))
    : Infinity
  const tooLong = duration !== null && Number.isFinite(maxDuration) && duration > maxDuration
  const draftsAllowed = loaded.length > 0 && loaded.every((info) => info.canUploadDrafts)
  const direct = settings.mode === 'direct'
  const blocked =
    accounts.length > 0 && (loading || infos.some((query) => query.isError) || (!photo && tooLong))
  useEffect(() => onBlockedChange?.(blocked), [blocked, onBlockedChange])
  // Leaving TikTok (or the screen) lifts the block.
  useEffect(() => () => onBlockedChange?.(false), [onBlockedChange])

  // A choice no longer offered (accounts changed) is dropped rather than sent.
  useEffect(() => {
    if (!loaded.length) return
    const patch: Record<string, string | boolean> = {}
    if (settings.privacyLevel && !privacyOptions.includes(settings.privacyLevel))
      patch.privacyLevel = ''
    if (commentLocked && settings.allowComment) patch.allowComment = false
    if (duetLocked && settings.allowDuet) patch.allowDuet = false
    if (stitchLocked && settings.allowStitch) patch.allowStitch = false
    if (!draftsAllowed && settings.mode === 'inbox') patch.mode = 'direct'
    if (Object.keys(patch).length) set(patch)
  }, [loaded.length, privacyOptions.join(), commentLocked, duetLocked, stitchLocked, draftsAllowed])

  if (!accounts.length)
    return <p className="text-body-sm text-text-tertiary">{t('composer.tiktok.chooseAccount')}</p>

  return (
    <div className="grid gap-5">
      <ul className="grid gap-2" aria-label={t('composer.tiktok.creators')}>
        {accounts.map((account, index) => {
          const query = infos[index]
          const info = query?.data
          return (
            <li
              key={account.id}
              className="flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-2"
            >
              <Avatar
                name={info?.creatorNickname ?? account.name}
                src={info?.creatorAvatarUrl ?? account.avatarUrl}
                size="sm"
              />
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-label-md text-text-primary">
                  {info?.creatorNickname ?? account.name}
                </span>
                {info?.creatorUsername ? (
                  <span className="truncate text-caption text-text-tertiary">
                    @{info.creatorUsername}
                  </span>
                ) : null}
              </span>
              {query?.isPending ? <Spin size="sm" indicator="ring" /> : null}
              {query?.isError ? (
                <span className="text-caption text-error-700">
                  {errorMessage(query.error, t('composer.tiktok.cannotPost'))}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
      {infos.some((query) => query.isError) ? (
        <Alert variant="soft" tone="error" title={t('composer.tiktok.cannotPostTitle')} />
      ) : null}
      {tooLong ? (
        <Alert
          variant="soft"
          tone="error"
          title={t('composer.tiktok.tooLong', {
            max: Math.floor(maxDuration / 60) || 1,
            seconds: maxDuration,
          })}
        />
      ) : null}

      <Field label={t('composer.tiktok.mode')}>
        <Tabs
          value={settings.mode}
          ariaLabel={t('composer.tiktok.mode')}
          onChange={(mode) => set({ mode })}
          options={[
            { value: 'direct', label: t('composer.tiktok.modeDirect'), disabled },
            {
              value: 'inbox',
              label: t('composer.tiktok.modeInbox'),
              disabled: disabled || !draftsAllowed,
            },
          ]}
        />
        <span className="text-caption text-text-tertiary">
          {direct ? t('composer.tiktok.modeDirectHint') : t('composer.tiktok.modeInboxHint')}
          {!draftsAllowed && loaded.length ? ` ${t('composer.tiktok.inboxUnavailable')}` : ''}
        </span>
      </Field>

      {photo ? (
        <Field label={t('composer.tiktok.photoTitle')}>
          <Input
            value={settings.photoTitle}
            maxLength={TIKTOK_LIMITS.photoTitle}
            disabled={disabled}
            placeholder={t('composer.tiktok.photoTitlePlaceholder')}
            onChange={(event) => set({ photoTitle: event.target.value })}
          />
          <span className="text-end text-caption tabular-nums text-text-tertiary">
            {settings.photoTitle.length}/{TIKTOK_LIMITS.photoTitle}
          </span>
        </Field>
      ) : null}

      {direct ? (
        <>
          <Field label={t('composer.tiktok.privacy')}>
            {loading && !loaded.length ? (
              <Spin size="sm" indicator="ring" />
            ) : (
              <Select
                value={settings.privacyLevel || undefined}
                placeholder={t('composer.tiktok.privacyPlaceholder')}
                disabled={disabled || !privacyOptions.length}
                showSearch={false}
                aria-label={t('composer.tiktok.privacy')}
                onChange={(event) => set({ privacyLevel: event.target.value })}
                options={privacyOptions.map((level) => {
                  const blocked = level === 'SELF_ONLY' && settings.brandContent
                  return {
                    value: level,
                    disabled: blocked,
                    label: blocked ? (
                      <Tooltip title={t('composer.tiktok.brandedNotPrivate')}>
                        <span>{t(`composer.tiktok.privacyLevels.${level}`)}</span>
                      </Tooltip>
                    ) : (
                      t(`composer.tiktok.privacyLevels.${level}`)
                    ),
                  }
                })}
              />
            )}
            {publicPending ? (
              <span className="text-caption text-text-tertiary">
                {t('composer.tiktok.publicPending')}
              </span>
            ) : null}
          </Field>

          <Field label={t('composer.tiktok.interactions')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <LockableCheckbox
                checked={settings.allowComment}
                locked={commentLocked}
                disabled={disabled}
                label={t('composer.tiktok.allowComment')}
                lockedHint={t('composer.tiktok.lockedHint')}
                onChange={(allowComment) => set({ allowComment })}
              />
              {photo ? null : (
                <>
                  <LockableCheckbox
                    checked={settings.allowDuet}
                    locked={duetLocked}
                    disabled={disabled}
                    label={t('composer.tiktok.allowDuet')}
                    lockedHint={t('composer.tiktok.lockedHint')}
                    onChange={(allowDuet) => set({ allowDuet })}
                  />
                  <LockableCheckbox
                    checked={settings.allowStitch}
                    locked={stitchLocked}
                    disabled={disabled}
                    label={t('composer.tiktok.allowStitch')}
                    lockedHint={t('composer.tiktok.lockedHint')}
                    onChange={(allowStitch) => set({ allowStitch })}
                  />
                </>
              )}
            </div>
          </Field>

          <div className="grid gap-3 rounded-lg border border-border-subtle p-4">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span className="grid gap-1">
                <span className="text-label-md text-text-primary">
                  {t('composer.tiktok.commercial')}
                </span>
                <span className="text-caption text-text-tertiary">
                  {t('composer.tiktok.commercialHint')}
                </span>
              </span>
              <Switch
                checked={settings.commercialContent}
                disabled={disabled}
                aria-label={t('composer.tiktok.commercial')}
                onChange={(commercialContent) =>
                  set(
                    commercialContent
                      ? { commercialContent }
                      : { commercialContent, brandOrganic: false, brandContent: false },
                  )
                }
              />
            </label>
            {settings.commercialContent ? (
              <div className="grid gap-3 border-t border-border-subtle pt-3">
                <CheckboxRow
                  checked={settings.brandOrganic}
                  disabled={disabled}
                  label={t('composer.tiktok.yourBrand')}
                  hint={t('composer.tiktok.yourBrandHint')}
                  onChange={(brandOrganic) => set({ brandOrganic })}
                />
                <CheckboxRow
                  checked={settings.brandContent}
                  disabled={disabled}
                  label={t('composer.tiktok.brandedContent')}
                  hint={t('composer.tiktok.brandedContentHint')}
                  onChange={(brandContent) =>
                    // Branded content cannot be private: leave "only me" for the user to change.
                    set(
                      brandContent && settings.privacyLevel === 'SELF_ONLY'
                        ? { brandContent, privacyLevel: '' }
                        : { brandContent },
                    )
                  }
                />
                {!settings.brandOrganic && !settings.brandContent ? (
                  <span role="alert" className="text-caption text-error-700">
                    {t('composer.tiktok.commercialRequired')}
                  </span>
                ) : (
                  <span className="text-caption text-text-secondary">
                    {settings.brandContent
                      ? t('composer.tiktok.labelPaid')
                      : t('composer.tiktok.labelPromotional')}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {photo ? (
            <CheckboxRow
              checked={settings.autoAddMusic}
              disabled={disabled}
              label={t('composer.tiktok.autoAddMusic')}
              hint={t('composer.tiktok.autoAddMusicHint')}
              onChange={(autoAddMusic) => set({ autoAddMusic })}
            />
          ) : null}
        </>
      ) : null}

      {photo && draft.media.length > 1 ? (
        <Field label={t('composer.tiktok.photoCover')}>
          <Select
            value={String(Math.min(settings.photoCoverIndex, draft.media.length - 1))}
            disabled={disabled}
            showSearch={false}
            onChange={(event) => set({ photoCoverIndex: event.target.value })}
            options={draft.media.map((item, index) => ({
              value: String(index),
              label: t('composer.tiktok.photoNumber', { number: index + 1, name: item.name }),
            }))}
          />
        </Field>
      ) : null}

      {/* The inbox flow takes only the file: the cover is chosen in the TikTok app. */}
      {direct && !photo && video && duration ? (
        <Field label={t('composer.tiktok.coverFrame')}>
          <input
            type="range"
            min="0"
            max={Math.floor(duration * 1000)}
            step="100"
            disabled={disabled}
            value={String(settings.coverTimestampMs ?? 0)}
            aria-label={t('composer.tiktok.coverFrame')}
            className="w-full accent-action-primary"
            onChange={(event) => set({ coverTimestampMs: event.target.value })}
          />
          <span className="text-caption text-text-tertiary">
            {t('composer.tiktok.coverFrameHint', {
              time: ((settings.coverTimestampMs ?? 0) / 1000).toFixed(1),
            })}
          </span>
        </Field>
      ) : null}

      {/* Video drafts carry no settings; photo drafts still take the AI label. */}
      {direct || photo ? (
        <CheckboxRow
          checked={settings.aiGenerated}
          disabled={disabled}
          label={t('composer.tiktok.aiGenerated')}
          hint={t('composer.tiktok.aiGeneratedHint')}
          onChange={(aiGenerated) => set({ aiGenerated })}
        />
      ) : null}

      <div className="grid gap-2 rounded-lg bg-bg-surface-subtle px-4 py-3 text-caption text-text-secondary">
        <span className="flex items-start gap-2">
          <IconInfo aria-hidden className="mt-[2px] shrink-0 text-text-tertiary" />
          {direct ? t('composer.tiktok.processing') : t('composer.tiktok.inboxProcessing')}
        </span>
        <span>
          <TikTokTermsConsent branded={settings.brandContent} />
        </span>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <span className="text-label-md text-text-secondary">{label}</span>
      {children}
    </div>
  )
}

function CheckboxRow({
  checked,
  disabled,
  label,
  hint,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  label: string
  hint?: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="grid gap-[2px]">
        <span className="text-body-sm text-text-primary">{label}</span>
        {hint ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
      </span>
    </label>
  )
}

/** An interaction the creator turned off in TikTok: greyed out and explained on hover. */
function LockableCheckbox({
  checked,
  locked,
  disabled,
  label,
  lockedHint,
  onChange,
}: {
  checked: boolean
  locked: boolean
  disabled: boolean
  label: string
  lockedHint: string
  onChange: (checked: boolean) => void
}) {
  const box = (
    <label
      className={`flex items-center gap-3 text-body-sm ${locked ? 'cursor-not-allowed text-text-disabled' : 'cursor-pointer text-text-primary'}`}
    >
      <Checkbox
        checked={checked && !locked}
        disabled={disabled || locked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
  return locked ? <Tooltip title={lockedHint}>{box}</Tooltip> : box
}
