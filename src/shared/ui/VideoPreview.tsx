import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconPlaySolid } from './primitives/icons'

export type VideoPreviewProps = {
  src: string
  className?: string
  progressPosition?: 'top' | 'bottom'
  onPlayingChange?: (playing: boolean) => void
  /** Second shown while the video is paused, such as a chosen cover frame. */
  posterTime?: number
}

export type VideoPreviewHandle = {
  togglePlayback: () => void
  toggleMuted: () => boolean
}

export const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(function VideoPreview(
  { src, className, progressPosition = 'bottom', onPlayingChange, posterTime },
  ref,
) {
  const { t } = useTranslation('common')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [src])

  // A paused video moves to the chosen frame, once its length is known.
  useEffect(() => {
    const video = videoRef.current
    if (!video || posterTime === undefined || !video.paused) return
    const seek = () => {
      video.currentTime = posterTime
    }
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      seek()
      return
    }
    video.addEventListener('loadedmetadata', seek, { once: true })
    return () => video.removeEventListener('loadedmetadata', seek)
  }, [posterTime, src])

  const togglePlayback = () => {
    if (!videoRef.current) return
    if (!videoRef.current.paused) {
      videoRef.current.pause()
      return
    }
    const attempt = videoRef.current.play()
    void attempt.catch(() => setPlaying(false))
  }

  // Created once: the controls only touch the element and state setters, and a new handle on
  // every render (the progress re-renders often) would detach and reattach callback refs.
  useImperativeHandle(
    ref,
    () => ({
      togglePlayback,
      toggleMuted: () => {
        const nextMuted = !videoRef.current?.muted
        if (videoRef.current) videoRef.current.muted = nextMuted
        setMuted(nextMuted)
        return nextMuted
      },
    }),
    [],
  )

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        className={className ?? 'h-full w-full object-contain'}
        muted={muted}
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) =>
          setDuration(
            Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
          )
        }
        onDurationChange={(event) =>
          setDuration(
            Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
          )
        }
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => {
          setPlaying(true)
          onPlayingChange?.(true)
        }}
        onPause={() => {
          setPlaying(false)
          onPlayingChange?.(false)
        }}
        onEnded={() => {
          setPlaying(false)
          onPlayingChange?.(false)
        }}
      />
      <button
        type="button"
        className="absolute inset-0 z-base flex items-center justify-center focus-visible:focus-ring"
        aria-label={t(playing ? 'videoPreview.pause' : 'videoPreview.play')}
        onClick={togglePlayback}
      >
        {!playing ? (
          <span className="flex size-12 items-center justify-center rounded-pill bg-neutral-950/45 text-text-inverse shadow-md backdrop-blur-sm">
            <IconPlaySolid aria-hidden className="size-5 translate-x-[2px]" />
          </span>
        ) : null}
      </button>
      <div
        className={`absolute inset-x-0 z-sticky h-5 ${progressPosition === 'top' ? 'top-2' : 'bottom-0'}`}
      >
        <div
          className={`pointer-events-none absolute inset-x-2 h-1 overflow-hidden rounded-pill bg-bg-surface/70 shadow-sm ${progressPosition === 'top' ? 'top-1' : 'bottom-1'}`}
        >
          <div className="h-full rounded-pill bg-bg-surface" style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={Math.min(currentTime, duration || 1)}
          disabled={duration === 0}
          aria-label={t('videoPreview.seek')}
          aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
          className="absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-default"
          onChange={(event) => {
            const nextTime = Number(event.target.value)
            if (!videoRef.current || !Number.isFinite(nextTime)) return
            videoRef.current.currentTime = nextTime
            setCurrentTime(nextTime)
          }}
        />
      </div>
    </div>
  )
})

function formatTime(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds))
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`
}
