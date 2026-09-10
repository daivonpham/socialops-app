import type { ReactNode } from 'react'
import { FaRegComment } from 'react-icons/fa'
import { IoClose } from 'react-icons/io5'
import { TbShare3 } from 'react-icons/tb'
import { VscEllipsis } from 'react-icons/vsc'
import likeReactionUrl from '@/assets/reaction/like.svg'
import loveReactionUrl from '@/assets/reaction/tym.svg'
import { Avatar, IconGlobe, IconHeart, IconImage, IconLike, IconPlay } from '@/shared/ui'
import type { PlanningPostType } from '../../api'
import type { PlanningAccount } from '../../model'
import type { ComposerMedia, PreviewViewport } from '../../model/composer'

export function FacebookPostPreview({
  account,
  caption,
  media,
  viewport,
  postType,
  fluid = false,
}: {
  account?: PlanningAccount
  caption: string
  media: ComposerMedia[]
  viewport: PreviewViewport
  postType: PlanningPostType
  fluid?: boolean
}) {
  if (postType === 'facebook_reel' || postType === 'facebook_story') {
    return (
      <FacebookVerticalPreview
        account={account}
        caption={caption}
        media={media}
        viewport={viewport}
        story={postType === 'facebook_story'}
        fluid={fluid}
      />
    )
  }

  const imageMedia = media.filter((item) => item.type === 'image').slice(0, 4)
  const video = media.find((item) => item.type === 'video')

  return (
    <div
      className={`w-full shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface text-text-primary shadow-md transition-[max-width] duration-base ${fluid ? 'max-w-full' : viewport === 'mobile' ? 'max-w-[20rem]' : ''}`}
    >
      <FacebookIdentity account={account} compact={viewport === 'mobile'} />
      <p
        className={`whitespace-pre-wrap text-text-primary ${viewport === 'mobile' ? 'px-3 pb-3 text-body-sm' : 'px-5 pb-4 text-body-md'}`}
      >
        {renderCaption(caption || 'Your caption will appear here.')}
      </p>
      {video ? (
        <div className="relative flex aspect-[6/5] items-center justify-center overflow-hidden bg-neutral-200">
          <video src={video.url} className="h-full w-full object-contain" muted />
          <PlayButton />
        </div>
      ) : imageMedia.length > 0 ? (
        <div
          className={`aspect-[6/5] overflow-hidden bg-neutral-200 ${imageMedia.length === 1 ? 'flex justify-center' : imageMedia.length === 2 ? 'grid grid-cols-2 gap-px' : 'grid grid-cols-2 grid-rows-2 gap-px'}`}
        >
          {imageMedia.map((item) => (
            <img
              key={item.id}
              src={item.url}
              alt=""
              className={
                imageMedia.length === 1
                  ? 'h-full w-full object-contain'
                  : 'h-full w-full object-cover'
              }
            />
          ))}
        </div>
      ) : (
        <EmptyMedia className="aspect-[6/5]" />
      )}
      <div
        className={`flex items-center justify-between border-t border-border-subtle bg-bg-surface text-text-secondary ${viewport === 'mobile' ? 'gap-2 px-3 py-3' : 'gap-4 px-5 py-3'}`}
      >
        <div className={`flex items-center ${viewport === 'mobile' ? 'gap-4' : 'gap-6'}`}>
          <EngagementMetric icon={<IconLike />} value="12.8K" />
          <EngagementMetric icon={<FaRegComment />} value="846" />
          <EngagementMetric icon={<TbShare3 />} value="1.2K" />
        </div>
        <span
          className="flex shrink-0 items-center -space-x-1"
          aria-label="Like and love reactions"
        >
          <img
            src={likeReactionUrl}
            alt=""
            className="relative z-10 size-[18px] rounded-pill ring-2 ring-bg-surface"
          />
          <img
            src={loveReactionUrl}
            alt=""
            className="size-[18px] rounded-pill ring-2 ring-bg-surface"
          />
        </span>
      </div>
    </div>
  )
}

function FacebookVerticalPreview({
  account,
  caption,
  media,
  viewport,
  story,
  fluid,
}: {
  account?: PlanningAccount
  caption: string
  media: ComposerMedia[]
  viewport: PreviewViewport
  story: boolean
  fluid: boolean
}) {
  const primaryMedia = media[0]
  return (
    <div
      className={`relative aspect-[9/16] w-full shrink-0 overflow-hidden rounded-xl bg-neutral-950 text-text-inverse shadow-md transition-[max-width] duration-base ${fluid ? 'max-w-full' : viewport === 'mobile' ? 'max-w-[18rem]' : 'max-w-[24rem]'}`}
    >
      {primaryMedia?.type === 'video' ? (
        <video src={primaryMedia.url} className="h-full w-full object-cover" muted />
      ) : primaryMedia ? (
        <img src={primaryMedia.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <EmptyMedia className="h-full text-neutral-400" dark />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/50" />
      {story ? (
        <div className="absolute left-3 right-3 top-3 h-1 rounded-pill bg-bg-surface/80" />
      ) : null}
      <div className="absolute left-4 right-4 top-6 flex items-center gap-2">
        <Avatar name={account?.name ?? 'Facebook Page'} src={account?.avatarUrl} size="sm" />
        <strong className="text-label-sm">{account?.name ?? 'Facebook Page'}</strong>
        <span className="text-caption text-neutral-300">Just now</span>
        <VscEllipsis aria-hidden className="ms-auto" />
      </div>
      <p className="absolute bottom-6 left-4 right-14 max-h-24 overflow-hidden whitespace-pre-wrap text-body-sm">
        {caption || 'Your caption will appear here.'}
      </p>
      {!story ? (
        <div className="absolute bottom-5 right-3 grid gap-4 text-center text-label-md">
          <PreviewAction icon={<IconHeart />} />
          <PreviewAction icon={<FaRegComment />} />
          <PreviewAction icon={<TbShare3 />} />
        </div>
      ) : null}
    </div>
  )
}

function FacebookIdentity({
  account,
  compact = false,
}: {
  account?: PlanningAccount
  compact?: boolean
}) {
  return (
    <div className={`flex items-start ${compact ? 'gap-3 p-3' : 'gap-3 p-5 pb-4'}`}>
      <span className="flex shrink-0 rounded-pill ring-2 ring-platform-facebook ring-offset-2 ring-offset-bg-surface">
        <Avatar
          name={account?.name ?? 'Facebook Page'}
          src={account?.avatarUrl}
          size={compact ? 'sm' : 'md'}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold text-text-primary ${compact ? 'text-body-sm' : 'text-body-md'}`}
        >
          {account?.name ?? 'Facebook Page'}
        </p>
        <p className="mt-1 flex items-center gap-1 text-caption text-text-secondary">
          Just now <span>·</span> <IconGlobe aria-hidden />
        </p>
      </div>
      <span
        className={`flex shrink-0 items-center text-text-secondary ${compact ? 'gap-3' : 'gap-5'}`}
      >
        <VscEllipsis aria-hidden className={compact ? 'text-icon-sm' : 'text-icon-md'} />
        <IoClose aria-hidden className={compact ? 'text-icon-md' : 'text-icon-lg'} />
      </span>
    </div>
  )
}

function PlayButton() {
  return (
    <span className="absolute flex size-12 items-center justify-center rounded-pill bg-bg-surface/90 text-heading-3 text-text-primary shadow-md backdrop-blur-sm">
      <IconPlay aria-hidden />
    </span>
  )
}

function EngagementMetric({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-2 text-body-sm">
      <span aria-hidden className="text-icon-md">
        {icon}
      </span>
      <span>{value}</span>
    </span>
  )
}

function PreviewAction({ icon }: { icon: ReactNode }) {
  return (
    <span>
      <span aria-hidden className="flex justify-center text-icon-sm">
        {icon}
      </span>
      <small className="block text-caption">0</small>
    </span>
  )
}

function EmptyMedia({ className, dark = false }: { className: string; dark?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-body-sm ${dark ? 'bg-neutral-950 text-neutral-500' : 'bg-bg-surface-subtle text-text-tertiary'} ${className}`}
    >
      <span
        className={`flex size-11 items-center justify-center rounded-pill text-icon-md ${dark ? 'bg-neutral-900 text-neutral-400' : 'bg-bg-surface shadow-xs'}`}
      >
        <IconImage aria-hidden />
      </span>
      <span>Media preview</span>
    </div>
  )
}

function renderCaption(caption: string): ReactNode[] {
  return caption.split(/(#[\p{L}\p{N}_]+)/gu).map((part, index) =>
    part.startsWith('#') ? (
      <span key={`${part}-${index}`} className="font-medium text-info-400">
        {part}
      </span>
    ) : (
      part
    ),
  )
}
