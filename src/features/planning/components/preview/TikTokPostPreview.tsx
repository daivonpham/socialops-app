import { useState, type ReactNode } from 'react'
import {
  FaBookmark,
  FaCommentDots,
  FaHeart,
  FaHouse,
  FaInbox,
  FaLock,
  FaMagnifyingGlass,
  FaMusic,
  FaPlus,
  FaShare,
  FaUser,
  FaUserGroup,
} from 'react-icons/fa6'
import { Avatar, VideoPreview } from '@/shared/ui'
import type { PlanningAccount } from '../../model'
import type { ComposerMedia, PreviewViewport } from '../../model/composer'
import { usePreviewPlayback } from './previewPlayback'

/** Counts and labels a published video shows; the composer leaves them at TikTok's zeros. */
export type TikTokPreviewFacts = {
  likes?: string
  comments?: string
  bookmarks?: string
  shares?: string
}

export type TikTokPreviewLabels = {
  /** "Your brand": TikTok labels the post "Promotional content". */
  brandOrganic?: boolean
  /** "Branded content": TikTok labels the post "Paid partnership". */
  brandContent?: boolean
  /** "Creator labeled as AI-generated". */
  isAigc?: boolean
  /** Only the creator can see the post. */
  privateOnly?: boolean
}

/**
 * The post as TikTok shows it. Phone: the For You feed, full screen, with the action rail on the
 * right and the bottom bar. Desktop: TikTok web, the video in the middle and the actions beside it.
 * Photo posts swipe sideways with dots, like TikTok's photo mode. TikTok's own interface text stays
 * in English, as the Facebook preview keeps Facebook's.
 */
export function TikTokPostPreview({
  account,
  caption,
  title,
  media,
  viewport,
  fluid = false,
  labels = {},
  facts,
  sound,
  fit = 'contain',
  handle: username,
  coverTimeMs,
}: {
  account?: PlanningAccount
  caption: string
  /** Photo posts have a title above the description. */
  title?: string
  media: ComposerMedia[]
  viewport: PreviewViewport
  fluid?: boolean
  labels?: TikTokPreviewLabels
  facts?: TikTokPreviewFacts
  /** The sound line; "original sound" by default. */
  sound?: string
  /**
   * How a picture fills the screen: photo posts sit whole on black (`contain`); a video's cover
   * fills it like the video would (`cover`).
   */
  fit?: 'contain' | 'cover'
  /** The account's @username; TikTok shows it, not the display name. */
  handle?: string
  /** The video's cover frame: shown while the video is paused. */
  coverTimeMs?: number
}) {
  const handle = username ?? account?.name ?? 'tiktok_account'
  const name = account?.name ?? 'TikTok'
  const counts = { likes: '0', comments: '0', bookmarks: '0', shares: '0', ...facts }
  const soundLine = sound ?? `original sound - ${handle}`

  const screen = (
    <Screen media={media} fit={fit} coverTimeMs={coverTimeMs}>
      {viewport === 'mobile' ? <MobileTopBar /> : null}
      <Overlay
        handle={handle}
        title={title}
        caption={caption}
        labels={labels}
        sound={soundLine}
        compact={viewport === 'mobile'}
      />
      {viewport === 'mobile' ? (
        <div className="absolute bottom-16 right-2 grid justify-items-center gap-4 text-center">
          <ActionRail account={account} name={name} counts={counts} inverse />
        </div>
      ) : null}
    </Screen>
  )

  if (viewport === 'mobile')
    return (
      <div
        className={`relative w-full shrink-0 overflow-hidden rounded-[28px] border-[6px] border-neutral-900 bg-neutral-950 shadow-lg transition-[max-width] duration-base ${fluid ? 'max-w-full' : 'max-w-[18rem]'}`}
      >
        <div className="relative aspect-[9/19.5]">
          <div className="absolute inset-x-0 top-0 bottom-12">{screen}</div>
          <MobileBottomNav />
        </div>
      </div>
    )

  return (
    <div
      className={`flex w-full shrink-0 items-end justify-center gap-4 rounded-xl bg-bg-surface p-4 shadow-md transition-[max-width] duration-base ${fluid ? 'max-w-full' : 'max-w-[30rem]'}`}
    >
      <div className="relative aspect-[9/16] w-full max-w-[20rem] overflow-hidden rounded-2xl bg-neutral-950">
        {screen}
      </div>
      <div className="grid shrink-0 justify-items-center gap-4 pb-2 text-center">
        <ActionRail account={account} name={name} counts={counts} />
      </div>
    </div>
  )
}

/** The media behind the overlay: the video, a swipeable photo set, or an empty frame. */
function Screen({
  media,
  fit,
  coverTimeMs,
  children,
}: {
  media: ComposerMedia[]
  fit: 'contain' | 'cover'
  coverTimeMs?: number
  children: ReactNode
}) {
  const playback = usePreviewPlayback()
  const video = media.find((item) => item.type === 'video')
  const photos = media.filter((item) => item.type === 'image')
  const [index, setIndex] = useState(0)
  const current = Math.min(index, Math.max(photos.length - 1, 0))

  return (
    <div className="absolute inset-0 overflow-hidden bg-neutral-950 text-text-inverse">
      {video ? (
        <VideoPreview
          key={video.id}
          ref={playback?.bind}
          src={video.url}
          className="h-full w-full object-cover"
          progressPosition="bottom"
          onPlayingChange={playback?.report}
          {...(coverTimeMs === undefined ? {} : { posterTime: coverTimeMs / 1000 })}
        />
      ) : photos.length ? (
        <>
          <div
            className="flex h-full transition-transform duration-base"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.name}
                draggable={false}
                className={`h-full w-full shrink-0 ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
            ))}
          </div>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                disabled={current === 0}
                onClick={() => setIndex(current - 1)}
                className="absolute inset-y-0 left-0 w-1/4 disabled:cursor-default"
              />
              <button
                type="button"
                aria-label="Next photo"
                disabled={current === photos.length - 1}
                onClick={() => setIndex(current + 1)}
                className="absolute inset-y-0 right-12 w-1/4 disabled:cursor-default"
              />
              <span className="pointer-events-none absolute right-3 top-14 rounded-pill bg-neutral-900/60 px-2 py-[2px] text-caption tabular-nums">
                {current + 1}/{photos.length}
              </span>
              <span className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
                {photos.map((photo, dot) => (
                  <span
                    key={photo.id}
                    className={`size-[6px] rounded-full ${dot === current ? 'bg-neutral-0' : 'bg-neutral-0/40'}`}
                  />
                ))}
              </span>
            </>
          ) : null}
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-body-sm text-neutral-400">
          Video or photo preview
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-neutral-950/30" />
      {children}
    </div>
  )
}

function MobileTopBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-4 text-text-inverse">
      <span className="rounded-sm border border-neutral-0/80 px-1 text-[9px] font-bold leading-tight">
        LIVE
      </span>
      <span className="flex items-center gap-4 text-label-sm">
        <span className="text-neutral-300">Explore</span>
        <span className="text-neutral-300">Following</span>
        <span className="relative font-bold">
          For You
          <span className="absolute -bottom-[6px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-pill bg-neutral-0" />
        </span>
      </span>
      <FaMagnifyingGlass aria-hidden className="text-body-md" />
    </div>
  )
}

/** Username, labels, caption with hashtags and the sound line, bottom left. */
function Overlay({
  handle,
  title,
  caption,
  labels,
  sound,
  compact,
}: {
  handle: string
  title?: string
  caption: string
  labels: TikTokPreviewLabels
  sound: string
  compact: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const text = caption || 'Your caption will appear here.'
  return (
    <div
      className={`absolute bottom-0 left-0 grid gap-1 p-3 text-text-inverse ${compact ? 'right-14 pb-4' : 'right-0 pb-5'}`}
    >
      {labels.privateOnly ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-sm bg-neutral-900/60 px-2 py-[2px] text-caption">
          <FaLock aria-hidden className="text-[10px]" />
          Only you can see this post
        </span>
      ) : null}
      <strong className="text-label-md">@{handle}</strong>
      {title ? <span className="text-body-sm font-semibold">{title}</span> : null}
      <p className={`text-body-sm leading-snug ${expanded ? '' : 'line-clamp-2'}`}>
        <Caption text={text} />
      </p>
      {text.length > 80 ? (
        <button
          type="button"
          className="w-fit text-label-sm font-semibold"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'less' : 'more'}
        </button>
      ) : null}
      {labels.brandContent || labels.brandOrganic || labels.isAigc ? (
        <span className="flex flex-wrap gap-1">
          {labels.brandContent ? <Label>Paid partnership</Label> : null}
          {labels.brandOrganic && !labels.brandContent ? <Label>Promotional content</Label> : null}
          {labels.isAigc ? <Label>Creator labeled as AI-generated</Label> : null}
        </span>
      ) : null}
      <span className="flex min-w-0 items-center gap-2 text-caption">
        <FaMusic aria-hidden className="shrink-0" />
        <span className="min-w-0 overflow-hidden whitespace-nowrap">
          <span className="inline-flex animate-[tiktok-marquee_8s_linear_infinite] motion-reduce:animate-none">
            {/* Twice, so moving it by half loops without a jump, like TikTok's scrolling line. */}
            <span className="pe-8">{sound}</span>
            <span aria-hidden className="pe-8">
              {sound}
            </span>
          </span>
        </span>
      </span>
    </div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm bg-neutral-900/50 px-2 py-[2px] text-caption text-neutral-100">
      {children}
    </span>
  )
}

/** Hashtags and mentions bold, as TikTok links them. */
function Caption({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, index) =>
        /^[#@][\p{L}\p{N}_.]+/u.test(part) ? (
          <strong key={index} className="font-semibold">
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

function ActionRail({
  account,
  name,
  counts,
  inverse = false,
}: {
  account?: PlanningAccount
  name: string
  counts: Required<TikTokPreviewFacts>
  inverse?: boolean
}) {
  return (
    <>
      <span className="relative mb-2">
        <span className={`block rounded-full ${inverse ? 'border-2 border-neutral-0' : ''}`}>
          <Avatar name={name} src={account?.avatarUrl} size="md" />
        </span>
        <span className="absolute -bottom-2 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-platform-tiktokPink text-[10px] text-neutral-0">
          <FaPlus aria-hidden />
        </span>
      </span>
      <Action icon={<FaHeart />} label={counts.likes} inverse={inverse} />
      <Action icon={<FaCommentDots />} label={counts.comments} inverse={inverse} />
      <Action icon={<FaBookmark />} label={counts.bookmarks} inverse={inverse} />
      <Action icon={<FaShare />} label={counts.shares} inverse={inverse} />
      {inverse ? (
        <span className="mt-1 flex size-10 animate-[spin_6s_linear_infinite] items-center justify-center rounded-full bg-neutral-800 ring-[6px] ring-neutral-900">
          <Avatar name={name} src={account?.avatarUrl} size="xs" />
        </span>
      ) : null}
    </>
  )
}

function Action({ icon, label, inverse }: { icon: ReactNode; label: string; inverse: boolean }) {
  return (
    <span className={`grid justify-items-center gap-1 ${inverse ? 'text-text-inverse' : ''}`}>
      <span
        aria-hidden
        className={
          inverse
            ? 'text-[26px] drop-shadow'
            : 'flex size-12 items-center justify-center rounded-full bg-bg-surface-muted text-[20px] text-text-primary'
        }
      >
        {icon}
      </span>
      <span
        className={`text-caption font-semibold tabular-nums ${inverse ? '' : 'text-text-secondary'}`}
      >
        {label}
      </span>
    </span>
  )
}

function MobileBottomNav() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-around bg-neutral-950 text-[9px] text-neutral-400">
      <NavItem icon={<FaHouse />} label="Home" active />
      <NavItem icon={<FaUserGroup />} label="Friends" />
      {/* TikTok's post button: white key with a cyan and a pink edge. */}
      <span className="relative flex h-7 w-10 items-center justify-center">
        <span className="absolute inset-y-0 left-0 w-9 rounded-md bg-platform-tiktokCyan" />
        <span className="absolute inset-y-0 right-0 w-9 rounded-md bg-platform-tiktokPink" />
        <span className="relative flex h-7 w-8 items-center justify-center rounded-md bg-neutral-0 text-neutral-950">
          <FaPlus aria-hidden />
        </span>
      </span>
      <NavItem icon={<FaInbox />} label="Inbox" />
      <NavItem icon={<FaUser />} label="Profile" />
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode
  label: string
  active?: boolean
}) {
  return (
    <span className={`grid justify-items-center gap-[2px] ${active ? 'text-neutral-0' : ''}`}>
      <span aria-hidden className="text-body-md">
        {icon}
      </span>
      {label}
    </span>
  )
}
