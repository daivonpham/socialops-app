import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useTranslation } from 'react-i18next'
import { FaImages, FaLink } from 'react-icons/fa6'
import { SocialAccountLabel } from '@/features/social-accounts'
import {
  Button,
  Checkbox,
  IconChevronDown,
  IconClose,
  IconImage,
  IconMobile,
  IconPost,
  IconReel,
  IconSettings,
  IconVideo,
  Image,
  Input,
  MediaDropzone,
  Popover,
  Select,
  Tabs,
  Textarea,
} from '@/shared/ui'
import type { PlanningAccount, PlanningComposerDraft } from '../../model'
import { PlanningAccountMultiSelect } from './PlanningAccountMultiSelect'

const TIKTOK_BOOLEAN_SETTINGS = [
  ['allowComments', 'composer.settings.allowComments'],
  ['allowDuet', 'composer.settings.allowDuet'],
  ['allowStitch', 'composer.settings.allowStitch'],
  ['commercialContent', 'composer.settings.commercialContent'],
  ['aiGeneratedContent', 'composer.settings.aiGeneratedContent'],
] as const

export function PlanningPostEditor({
  draft,
  accounts,
  setDraft,
  publishedMode = false,
}: {
  draft: PlanningComposerDraft
  accounts: PlanningAccount[]
  setDraft: Dispatch<SetStateAction<PlanningComposerDraft>>
  publishedMode?: boolean
}) {
  const { t } = useTranslation('planning')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrls = useRef(new Set<string>())
  const customizationDetailsRef = useRef<HTMLDetailsElement>(null)
  const [captionFocused, setCaptionFocused] = useState(false)
  const [mediaPopoverOpen, setMediaPopoverOpen] = useState(false)
  const selectedAccounts = accounts.filter((account) => draft.targetIds.includes(account.id))
  const hasCaptionOverrides = Object.values(draft.captionOverrides).some(Boolean)
  const published = publishedMode

  useEffect(() => {
    if ((hasCaptionOverrides || published) && customizationDetailsRef.current) {
      customizationDetailsRef.current.open = true
    }
  }, [hasCaptionOverrides, published, selectedAccounts.length])

  useEffect(() => {
    const urls = previewUrls.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const setSetting = (key: string, value: boolean | string) =>
    setDraft((current) => ({
      ...current,
      platformSettings: { ...current.platformSettings, [key]: value },
    }))

  const addMedia = (files: FileList | File[] | null) => {
    if (!files) return
    const allowedTypes =
      draft.postType === 'facebook_story'
        ? ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
        : draft.postType === 'facebook_reel' || draft.postType === 'tiktok_video'
          ? ['video/mp4']
          : ['image/jpeg', 'image/png', 'image/webp']
    const singleMedia = draft.postType === 'facebook_story' || allowedTypes[0] === 'video/mp4'
    const slots = singleMedia ? 1 : 10 - draft.media.length
    const media = [...files]
      .filter((file) => allowedTypes.includes(file.type))
      .slice(0, Math.max(slots, 0))
      .map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.startsWith('video/') ? ('video' as const) : ('image' as const),
        url: URL.createObjectURL(file),
        file,
      }))
    if (!media.length) return
    media.forEach((item) => previewUrls.current.add(item.url))
    if (singleMedia) {
      draft.media.forEach((item) => {
        if (!item.file) return
        URL.revokeObjectURL(item.url)
        previewUrls.current.delete(item.url)
      })
    }
    setDraft((current) => ({
      ...current,
      media: singleMedia ? media : [...current.media, ...media].slice(0, 10),
    }))
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-xs">
      <div className="grid gap-5 p-5">
        <FieldGroup label={t('composer.postType.title')}>
          <Tabs
            value={draft.postType}
            ariaLabel={t('composer.postType.title')}
            onChange={(postType) => setDraft((current) => ({ ...current, postType }))}
            options={
              draft.platform === 'facebook'
                ? [
                    {
                      value: 'facebook_feed',
                      disabled: published,
                      label: (
                        <TabLabel icon={<IconPost />} label={t('composer.postType.facebookFeed')} />
                      ),
                    },
                    {
                      value: 'facebook_reel',
                      disabled: published,
                      label: (
                        <TabLabel icon={<IconReel />} label={t('composer.postType.facebookReel')} />
                      ),
                    },
                    {
                      value: 'facebook_story',
                      disabled: published,
                      label: (
                        <TabLabel
                          icon={<IconMobile />}
                          label={t('composer.postType.facebookStory')}
                        />
                      ),
                    },
                  ]
                : [
                    {
                      value: 'tiktok_video',
                      disabled: published,
                      label: (
                        <TabLabel icon={<IconVideo />} label={t('composer.postType.tiktokVideo')} />
                      ),
                    },
                    {
                      value: 'tiktok_photo',
                      disabled: published,
                      label: (
                        <TabLabel icon={<IconImage />} label={t('composer.postType.tiktokPhoto')} />
                      ),
                    },
                  ]
            }
          />
        </FieldGroup>

        <Divider />

        <FieldGroup label={t('composer.accounts.postTo')}>
          {published ? (
            <div
              className="flex min-h-10 flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface-subtle px-3 py-2"
              aria-disabled="true"
            >
              {selectedAccounts.map((account) => (
                <SocialAccountLabel
                  key={account.id}
                  name={account.name}
                  avatarUrl={account.avatarUrl}
                />
              ))}
            </div>
          ) : (
            <PlanningAccountMultiSelect
              accounts={accounts}
              selectedIds={draft.targetIds}
              onChange={(targetIds) => setDraft((current) => ({ ...current, targetIds }))}
            />
          )}
        </FieldGroup>

        <Divider />

        <FieldGroup
          label={
            draft.postType === 'facebook_story'
              ? t('composer.media.title')
              : t('composer.content.caption')
          }
        >
          {draft.postType === 'facebook_story' && !published ? (
            <MediaDropzone
              actionLabel={t('composer.media.clickToUpload')}
              description={t('composer.media.dragAndDrop')}
              hint={t('composer.media.storyHint')}
              accept="image/jpeg,image/png,image/webp,video/mp4"
              onFilesSelected={addMedia}
            />
          ) : (
            <div
              className={`overflow-hidden rounded-xl border bg-bg-surface ${captionFocused ? 'border-border-focus ring-2 ring-brand-100' : 'border-border'}`}
            >
              {
                <Textarea
                  value={draft.caption}
                  rows={7}
                  maxLength={2200}
                  placeholder={t('composer.content.captionPlaceholder')}
                  className="border-0 shadow-none"
                  onFocus={() => setCaptionFocused(true)}
                  onBlur={() => setCaptionFocused(false)}
                  disabled={published && draft.postType === 'facebook_story'}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, caption: event.target.value }))
                  }
                />
              }
              <div className="flex items-center gap-1 border-t border-border-subtle px-2 py-1.5">
                {!published ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      multiple={
                        draft.postType === 'facebook_feed' || draft.postType === 'tiktok_photo'
                      }
                      accept={
                        draft.postType.includes('video') || draft.postType.includes('reel')
                          ? 'video/*'
                          : 'image/*'
                      }
                      onChange={(event) => {
                        addMedia(event.target.files)
                        if (event.target.files?.length) setMediaPopoverOpen(false)
                        event.target.value = ''
                      }}
                    />
                    <Popover
                      placement="bottomLeft"
                      open={mediaPopoverOpen}
                      onOpenChange={setMediaPopoverOpen}
                      content={
                        <div className="grid w-56 gap-2 p-3">
                          <p className="text-label-sm text-text-primary">
                            {t('composer.media.add')}
                          </p>
                          <p className="text-caption text-text-tertiary">
                            {t('composer.media.hint')}
                          </p>
                          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                            {t('composer.media.chooseFiles')}
                          </Button>
                        </div>
                      }
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<FaImages aria-hidden className="text-icon-md" />}
                        aria-label={t('composer.media.add')}
                      />
                    </Popover>
                    {draft.platform === 'facebook' && draft.postType === 'facebook_feed' ? (
                      <Popover
                        placement="bottomLeft"
                        content={
                          <div className="w-72 p-3">
                            <Input
                              label={t('composer.content.link')}
                              value={draft.link}
                              placeholder="https://"
                              onChange={(event) =>
                                setDraft((current) => ({ ...current, link: event.target.value }))
                              }
                            />
                          </div>
                        }
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<FaLink aria-hidden className="text-icon-md" />}
                          aria-label={t('composer.content.link')}
                        />
                      </Popover>
                    ) : null}
                  </>
                ) : null}
                <span className="flex-1" />
                {
                  <span className="px-2 text-caption tabular-nums text-text-tertiary">
                    {draft.caption.length.toLocaleString()}/2,200
                  </span>
                }
              </div>
            </div>
          )}
        </FieldGroup>

        {!published && draft.media.length > 0 ? (
          <>
            <Divider />
            <div className="flex flex-wrap gap-3">
              {draft.media.map((item) => (
                <div
                  key={item.id}
                  className="relative size-24 overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-subtle"
                >
                  {item.type === 'image' ? (
                    <Image
                      src={item.url}
                      alt={item.name}
                      className="size-full object-cover"
                      wrapperClassName="block size-full"
                      preview={{ mask: false }}
                    />
                  ) : (
                    <video src={item.url} className="h-full w-full object-cover" muted />
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={published}
                    icon={
                      <span className="flex items-center justify-center leading-none">
                        <IconClose aria-hidden className="block text-icon-sm" />
                      </span>
                    }
                    aria-label={t('composer.media.remove', { name: item.name })}
                    className="absolute right-1 top-1 flex size-media-action min-w-0 items-center justify-center rounded-pill border-0 bg-neutral-800 p-0 text-text-inverse shadow-sm hover:bg-neutral-900 hover:text-text-inverse"
                    onClick={() => {
                      if (item.file) {
                        URL.revokeObjectURL(item.url)
                        previewUrls.current.delete(item.url)
                      }
                      setDraft((current) => ({
                        ...current,
                        media: current.media.filter((media) => media.id !== item.id),
                      }))
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {draft.platform === 'tiktok' ? (
        <details className="group border-t border-border-subtle">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-label-md text-text-secondary outline-none hover:bg-bg-surface-subtle focus-visible:focus-ring">
            <IconSettings aria-hidden className="text-icon-md" />
            <span>{t('composer.advanced.title')}</span>
            <IconChevronDown
              aria-hidden
              className="ms-auto text-icon-sm transition-transform duration-fast group-open:rotate-180"
            />
          </summary>
          <div className="grid gap-4 border-t border-border-subtle p-5">
            <Select
              label={t('composer.settings.visibility')}
              value={String(draft.platformSettings.visibility)}
              onChange={(event) => setSetting('visibility', event.target.value)}
              options={[
                { value: 'public', label: t('composer.settings.public') },
                { value: 'friends', label: t('composer.settings.friends') },
                { value: 'private', label: t('composer.settings.private') },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {TIKTOK_BOOLEAN_SETTINGS.map(([key, labelKey]) => (
                <SettingCheckbox
                  key={key}
                  checked={Boolean(draft.platformSettings[key])}
                  label={t(labelKey)}
                  onChange={(checked) => setSetting(key, checked)}
                />
              ))}
            </div>
            {draft.postType === 'tiktok_video' ? (
              <label className="grid gap-2 text-label-md text-text-secondary">
                <span>{t('composer.settings.coverFrame')}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={String(draft.platformSettings.coverFrame)}
                  className="w-full accent-action-primary"
                  onChange={(event) => setSetting('coverFrame', event.target.value)}
                />
                <span className="text-caption text-text-tertiary">
                  {t('composer.settings.coverFrameHint')}
                </span>
              </label>
            ) : null}
          </div>
        </details>
      ) : null}

      {selectedAccounts.length > 1 && draft.postType !== 'facebook_story' ? (
        <details ref={customizationDetailsRef} className="group border-t border-border-subtle">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-label-md text-text-secondary outline-none hover:bg-bg-surface-subtle focus-visible:focus-ring">
            <span>{t('composer.customization.title')}</span>
            <IconChevronDown
              aria-hidden
              className="ms-auto text-icon-sm transition-transform duration-fast group-open:rotate-180"
            />
          </summary>
          <div className="grid gap-3 border-t border-border-subtle p-5">
            {selectedAccounts.map((account) => (
              <div key={account.id} className="grid gap-2">
                <SocialAccountLabel name={account.name} avatarUrl={account.avatarUrl} />
                <Textarea
                  value={draft.captionOverrides[account.id] ?? ''}
                  rows={2}
                  placeholder={t('composer.customization.inheritCaption')}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      captionOverrides: {
                        ...current.captionOverrides,
                        [account.id]: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  )
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <span className="text-label-md text-text-secondary">{label}</span>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border-subtle" />
}

function TabLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="flex text-icon-sm">
        {icon}
      </span>
      {label}
    </span>
  )
}

function SettingCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-body-sm text-text-primary">
      <Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}
