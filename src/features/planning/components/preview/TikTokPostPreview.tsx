import type { ReactNode } from 'react'
import { Avatar, IconComment, IconHeart, IconShare } from '@/shared/ui'
import type { PlanningAccount } from '../../model'
import type { ComposerMedia, PreviewViewport } from '../../model/composer'
import { CaptionClamp } from '../CaptionClamp'

export function TikTokPostPreview({
  account,
  caption,
  media,
  viewport,
  fluid = false,
}: {
  account?: PlanningAccount
  caption: string
  media: ComposerMedia[]
  viewport: PreviewViewport
  fluid?: boolean
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
        <div className="flex h-full items-center justify-center text-body-sm text-neutral-400">
          Video or photo preview
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/20" />

      <div className="absolute left-0 right-0 top-0 flex justify-center gap-5 p-4 text-label-md">
        <span className="text-neutral-400">Following</span>
        <strong>For You</strong>
      </div>

      <div className="absolute bottom-5 left-4 right-16">
        <strong className="text-label-md">@{account?.name ?? 'tiktok_account'}</strong>
        <div className="mt-2 text-body-sm">
          <CaptionClamp caption={caption || 'Your caption will appear here.'} inverse />
        </div>
        <p className="mt-2 text-caption">♫ Original sound</p>
      </div>

      <div className="absolute bottom-5 right-3 grid justify-items-center gap-4 text-center text-caption">
        <Avatar name={account?.name ?? 'TikTok'} src={account?.avatarUrl} size="md" />
        <PreviewAction icon={<IconHeart />} label="0" />
        <PreviewAction icon={<IconComment />} label="0" />
        <PreviewAction icon={<IconShare />} label="0" />
      </div>
    </div>
  )
}

function PreviewAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span>
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-pill bg-neutral-900/70 text-icon-sm"
      >
        {icon}
      </span>
      <span className="mt-1 block">{label}</span>
    </span>
  )
}
