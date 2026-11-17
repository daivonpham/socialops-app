import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useTranslation } from 'react-i18next'
import { FaComment, FaImages, FaLink } from 'react-icons/fa6'
import { SocialAccountLabel } from '@/features/social-accounts'
import {
  Button,
  Checkbox,
  FileUploadCard,
  IconChevronDown,
  IconComment,
  IconImage,
  IconMobile,
  IconPenLine,
  IconPost,
  IconReel,
  IconSettings,
  IconVideo,
  Input,
  MediaDropzone,
  Popover,
  Select,
  Tabs,
  Textarea,
} from '@/shared/ui'
import {
  hasComposerFirstComment,
  isComposerCaptionMissing,
  setComposerCaptionMode,
  supportsCaptionPerAccount,
  usesCaptionPerAccount,
  type ComposerMedia,
  type PlanningAccount,
  type PlanningComposerDraft,
} from '../../model'
import { PlanningAccountMultiSelect } from './PlanningAccountMultiSelect'
import { ReelCoverField } from './ReelCoverPicker'
import { clearVideoFrames, forgetVideoFrames, prepareVideoFrames } from './videoFrames'
import { usePreviewPlayback } from '../preview/previewPlayback'

const TIKTOK_BOOLEAN_SETTINGS = [
  ['allowComments', 'composer.settings.allowComments'],
  ['allowDuet', 'composer.settings.allowDuet'],
  ['allowStitch', 'composer.settings.allowStitch'],
  ['commercialContent', 'composer.settings.commercialContent'],
  ['aiGeneratedContent', 'composer.settings.aiGeneratedContent'],
] as const

export type MediaUploadState =
  { status: 'uploading'; percent: number } | { status: 'uploaded' } | { status: 'failed' }

export function PlanningPostEditor({
  draft,
  accounts,
  setDraft,
  publishedMode = false,
  showCaptionErrors = false,
  mediaUploads = {},
  onRetryUpload,
  onMediaAdded,
}: {
  draft: PlanningComposerDraft
  accounts: PlanningAccount[]
  setDraft: Dispatch<SetStateAction<PlanningComposerDraft>>
  publishedMode?: boolean
  /** Set once the user tried to post: only then a missing caption is flagged. */
  showCaptionErrors?: boolean
  mediaUploads?: Record<string, MediaUploadState>
  /** Sends the files that failed again. */
  onRetryUpload?: () => void
  /** Picked files, to be stored right away. */
  onMediaAdded?: (media: ComposerMedia[]) => void
}) {
  const { t } = useTranslation('planning')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrls = useRef(new Set<string>())
  // Each post type keeps its own media: switching tabs starts clean, switching back restores it.
  const mediaByPostType = useRef<
    Partial<Record<PlanningComposerDraft['postType'], PlanningComposerDraft['media']>>
  >({})
  const [captionFocused, setCaptionFocused] = useState(false)
  const [mediaPopoverOpen, setMediaPopoverOpen] = useState(false)
  const selectedAccounts = accounts.filter((account) => draft.targetIds.includes(account.id))
  const perAccountCaption = usesCaptionPerAccount(draft)
  const published = publishedMode
  const sharedCaptionMissing =
    showCaptionErrors && !perAccountCaption && isComposerCaptionMissing(draft)
  // A first comment can be added on Facebook feed posts and Reels, before the post goes out.
  const commentable =
    !published && draft.platform === 'facebook' && draft.postType !== 'facebook_story'
  const hasFirstComment = hasComposerFirstComment(draft)
  // Closed until asked for, unless the post already has one.
  const [commentOpen, setCommentOpen] = useState(hasFirstComment)
  const showComment = commentable && commentOpen
  const playback = usePreviewPlayback()
  // A Reel's video sits beside its cover, in one row.
  const reelCover =
    draft.postType === 'facebook_reel' && draft.media[0]?.type === 'video' ? draft.media[0] : null

  useEffect(() => {
    const urls = previewUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      clearVideoFrames()
    }
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
        size: file.size,
      }))
    if (!media.length) return
    media.forEach((item) => {
      previewUrls.current.add(item.url)
      // The cover picker's strip of frames is read now, from the file, while it uploads.
      if (item.type === 'video') prepareVideoFrames(item.id, item.url)
    })
    if (singleMedia) {
      draft.media.forEach((item) => {
        forgetVideoFrames(item.id)
        if (!item.file) return
        URL.revokeObjectURL(item.url)
        previewUrls.current.delete(item.url)
      })
    }
    setDraft((current) => ({
      ...current,
      media: singleMedia ? media : [...current.media, ...media].slice(0, 10),
    }))
    onMediaAdded?.(media)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-xs">
      <div className="grid gap-5 p-5">
        <FieldGroup label={t('composer.postType.title')}>
          <Tabs
            value={draft.postType}
            ariaLabel={t('composer.postType.title')}
            onChange={(postType) => {
              if (postType === draft.postType) return
              mediaByPostType.current[draft.postType] = draft.media
              setDraft((current) => ({
                ...current,
                postType,
                media: mediaByPostType.current[postType] ?? [],
              }))
            }}
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
              className={`overflow-hidden rounded-xl border bg-bg-surface ${sharedCaptionMissing ? 'border-error-500' : captionFocused ? 'border-border-focus ring-2 ring-brand-100' : 'border-border'}`}
            >
              {perAccountCaption ? (
                <p className="px-4 py-3 text-body-sm text-text-tertiary">
                  {t('composer.customization.sharedCaptionHidden')}
                </p>
              ) : (
                <Textarea
                  value={draft.caption}
                  rows={7}
                  maxLength={2200}
                  placeholder={t('composer.content.captionPlaceholder')}
                  aria-invalid={sharedCaptionMissing || undefined}
                  className="border-0 shadow-none"
                  onFocus={() => setCaptionFocused(true)}
                  onBlur={() => setCaptionFocused(false)}
                  disabled={published && draft.postType === 'facebook_story'}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, caption: event.target.value }))
                  }
                />
              )}
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
                    {commentable ? (
                      <span className="relative inline-flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<FaComment aria-hidden className="text-icon-md" />}
                          aria-label={t('composer.firstComment.toggle')}
                          aria-expanded={commentOpen}
                          onClick={() => setCommentOpen((open) => !open)}
                        />
                        {hasFirstComment ? (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute end-1 top-1 size-2 rounded-full bg-success-500 ring-2 ring-bg-surface"
                          />
                        ) : null}
                      </span>
                    ) : null}
                  </>
                ) : null}
                <span className="flex-1" />
                {perAccountCaption ? null : (
                  <span className="px-2 text-caption tabular-nums text-text-tertiary">
                    {draft.caption.length.toLocaleString()}/2,200
                  </span>
                )}
              </div>
            </div>
          )}
          {sharedCaptionMissing ? (
            <span role="alert" className="text-caption text-error-700">
              {t('composer.customization.captionRequired')}
            </span>
          ) : null}
        </FieldGroup>

        {showComment && !perAccountCaption ? (
          <FieldGroup label={t('composer.firstComment.title')} icon={<IconComment aria-hidden />}>
            <Textarea
              value={draft.firstComment}
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={8000}
              aria-label={t('composer.firstComment.title')}
              placeholder={t('composer.firstComment.placeholder')}
              onChange={(event) =>
                setDraft((current) => ({ ...current, firstComment: event.target.value }))
              }
            />
          </FieldGroup>
        ) : null}

        {!published && draft.media.length > 0 ? (
          <>
            <Divider />
            <div className="flex flex-col gap-4 sm:flex-row">
              <div
                className={`grid min-w-0 flex-1 gap-3 ${draft.media.length > 1 ? 'md:grid-cols-2' : ''}`}
              >
                {draft.media.map((item) => {
                  const upload = mediaUploads[item.id]
                  return (
                    <FileUploadCard
                      key={item.id}
                      name={item.name}
                      preview={{ type: item.type, url: item.url }}
                      size={item.size ?? item.file?.size}
                      status={
                        upload?.status === 'uploaded' ? 'complete' : (upload?.status ?? undefined)
                      }
                      percent={upload?.status === 'uploading' ? upload.percent : undefined}
                      disabled={published}
                      // The play button runs the preview's video; the card itself never plays.
                      playback={
                        item.type === 'video' && playback?.available
                          ? { playing: playback.playing, onToggle: playback.toggle }
                          : undefined
                      }
                      onRetry={onRetryUpload}
                      onRemove={() => {
                        forgetVideoFrames(item.id)
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
                  )
                })}
              </div>
              {reelCover ? (
                <div className="flex shrink-0">
                  <ReelCoverField
                    // As tall as the file card beside it; on narrow screens it sits below instead.
                    className="size-[128px] sm:aspect-square sm:size-auto sm:h-full"
                    video={reelCover}
                    thumbnail={draft.thumbnail}
                    onChange={(thumbnail) => setDraft((current) => ({ ...current, thumbnail }))}
                  />
                </div>
              ) : null}
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

      {supportsCaptionPerAccount(draft) ? (
        // Opening the section switches every account to its own caption; closing it returns to
        // the shared caption. The per-account captions stay in the draft either way.
        <details open={perAccountCaption} className="group border-t border-border-subtle">
          <summary
            onClick={(event) => {
              event.preventDefault()
              setDraft((current) =>
                setComposerCaptionMode(
                  current,
                  usesCaptionPerAccount(current) ? 'shared' : 'per_target',
                ),
              )
            }}
            className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-label-md text-text-secondary outline-none hover:bg-bg-surface-subtle focus-visible:focus-ring"
          >
            <span>{t('composer.customization.title')}</span>
            <IconChevronDown
              aria-hidden
              className="ms-auto text-icon-sm transition-transform duration-fast group-open:rotate-180"
            />
          </summary>
          <div className="grid gap-4 border-t border-border-subtle p-5">
            {perAccountCaption
              ? selectedAccounts.map((account) => {
                  const caption = draft.captionOverrides[account.id] ?? ''
                  const missing = published
                    ? !caption.trim()
                    : showCaptionErrors && isComposerCaptionMissing(draft, account.id)
                  return (
                    <div
                      key={account.id}
                      className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
                    >
                      <div className="border-b border-border-subtle bg-bg-surface-subtle px-4 py-3">
                        <SocialAccountLabel name={account.name} avatarUrl={account.avatarUrl} />
                      </div>
                      <div className="grid gap-4 p-4">
                        <div className="grid gap-2">
                          <SectionLabel
                            icon={<IconPenLine aria-hidden />}
                            label={t('composer.content.caption')}
                          />
                          <Textarea
                            value={caption}
                            rows={4}
                            maxLength={2200}
                            aria-label={account.name}
                            placeholder={t('composer.customization.accountCaptionPlaceholder')}
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
                          <div className="flex items-center gap-2 text-caption">
                            {missing ? (
                              <span className="text-error-700">
                                {t('composer.customization.captionRequired')}
                              </span>
                            ) : null}
                            <span className="ms-auto tabular-nums text-text-tertiary">
                              {caption.length.toLocaleString()}/2,200
                            </span>
                          </div>
                        </div>
                        {showComment ? (
                          <div className="grid gap-2 border-t border-border-subtle pt-4">
                            <SectionLabel
                              icon={<IconComment aria-hidden />}
                              label={t('composer.firstComment.title')}
                            />
                            <Textarea
                              value={draft.firstCommentOverrides[account.id] ?? ''}
                              autoSize={{ minRows: 2, maxRows: 6 }}
                              maxLength={8000}
                              aria-label={t('composer.firstComment.accountLabel', {
                                name: account.name,
                              })}
                              placeholder={t('composer.firstComment.placeholder')}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  firstCommentOverrides: {
                                    ...current.firstCommentOverrides,
                                    [account.id]: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              : null}
          </div>
        </details>
      ) : null}
    </section>
  )
}

function FieldGroup({
  label,
  icon,
  children,
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <span className="flex items-center gap-2 text-label-md text-text-secondary">
        {icon ? <span className="flex text-icon-sm text-text-tertiary">{icon}</span> : null}
        {label}
      </span>
      {children}
    </div>
  )
}

function SectionLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2 text-label-sm text-text-secondary">
      <span className="flex text-icon-sm text-text-tertiary">{icon}</span>
      {label}
    </span>
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
