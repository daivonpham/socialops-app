import { useState } from 'react'
import { IconImage, IconVideo } from '@/shared/ui'
import type { PlanningContent } from '../api'

const MEDIA_URL_MAX_AGE_MS = 50 * 60 * 1000
const stableMediaUrls = new Map<string, { url: string; expiresAt: number }>()

function stableMediaUrl(identity: string, latestUrl: string): string {
  const cached = stableMediaUrls.get(identity)
  if (cached && cached.expiresAt > Date.now()) return cached.url
  if (stableMediaUrls.size >= 500) {
    stableMediaUrls.delete(stableMediaUrls.keys().next().value!)
  }
  stableMediaUrls.set(identity, { url: latestUrl, expiresAt: Date.now() + MEDIA_URL_MAX_AGE_MS })
  return latestUrl
}

export function PlanningMediaThumbnail({
  content,
  className,
}: {
  content: PlanningContent
  className: string
}) {
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  // A published post shows the picture Facebook holds; our file is the fallback when its link
  // has expired, such as after the Page was disconnected.
  const pictureUrl = content.pictureUrl
  const showPicture = Boolean(pictureUrl && !failedUrls.includes(pictureUrl))
  const latestUrl = content.media?.[0]?.url ?? content.thumbnailUrl
  const mediaIdentity = content.media?.[0]?.id ?? content.id
  const fileUrl = latestUrl ? stableMediaUrl(mediaIdentity, latestUrl) : undefined
  const url = showPicture ? pictureUrl : fileUrl
  const isVideo =
    !showPicture && (content.media?.[0]?.type === 'video' || content.mediaType === 'video')

  const handleError = () => {
    if (!url) return
    if (!showPicture) stableMediaUrls.delete(mediaIdentity)
    setFailedUrls((current) => [...current, url])
  }

  if (url && !failedUrls.includes(url)) {
    if (isVideo) {
      return (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className={`${className} object-cover`}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget
            if (video.duration > 0) video.currentTime = Math.min(0.1, video.duration / 2)
          }}
          onError={handleError}
        />
      )
    }

    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className={`${className} object-cover`}
        onError={handleError}
      />
    )
  }

  return (
    <span
      className={`${className} flex items-center justify-center bg-bg-surface-muted text-text-tertiary`}
    >
      {isVideo ? <IconVideo aria-hidden /> : <IconImage aria-hidden />}
    </span>
  )
}
