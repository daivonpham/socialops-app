import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, IconImage, IconPencil, IconUpload, Modal, useToast } from '@/shared/ui'
import type { ComposerMedia, ComposerThumbnail } from '../../model'
import { localVideoUrl, readyVideoFrames, videoFrames } from './videoFrames'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** Covers larger than this on their long side are scaled down; Meta shows them far smaller. */
const MAX_COVER_SIDE = 1920

/** `mm:ss`, as Facebook shows the position in its own cover picker. */
function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

/** A video length as players show it: "0:15", "12:04". */
function length(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

function waitFor(video: HTMLVideoElement, event: 'loadeddata' | 'seeked'): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener(event, done)
      video.removeEventListener('error', fail)
      resolve()
    }
    const fail = () => {
      video.removeEventListener(event, done)
      video.removeEventListener('error', fail)
      reject(new Error('Video could not be read'))
    }
    video.addEventListener(event, done)
    video.addEventListener('error', fail)
  })
}

async function seek(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.01 && !video.seeking) return
  const seeked = waitFor(video, 'seeked')
  video.currentTime = time
  await seeked
}

/** The frame the video shows now, as a JPEG file. Throws when the video's origin forbids it. */
async function captureFrame(video: HTMLVideoElement): Promise<File> {
  if (video.seeking) await waitFor(video, 'seeked')
  const scale = Math.min(1, MAX_COVER_SIDE / Math.max(video.videoWidth, video.videoHeight, 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9),
  )
  if (!blob) throw new Error('Frame could not be captured')
  return new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
}

/** A video element for reading frames; our stored videos allow it through the bucket's CORS. */
function frameReader(url: string): HTMLVideoElement {
  const video = document.createElement('video')
  if (!url.startsWith('blob:')) video.crossOrigin = 'anonymous'
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url
  return video
}

/** The first picture file of a paste or drop; a pasted screenshot gets a name. */
function pickedImage(files: FileList | File[] | null | undefined): File | null {
  const file = Array.from(files ?? []).find((item) => IMAGE_TYPES.includes(item.type))
  if (!file) return null
  if (file.name && file.name !== 'image.png') return file
  const extension = file.type.split('/')[1] ?? 'png'
  return new File([file], `cover-${Date.now()}.${extension}`, { type: file.type })
}

/**
 * Makes a frame of a newly added video the Reel's cover, as Facebook does by default. Only for a
 * video picked on this screen: a stored one keeps whatever Facebook chose.
 */
export function useDefaultReelCover(
  video: ComposerMedia | undefined,
  thumbnail: ComposerThumbnail | null,
  onChange: (thumbnail: ComposerThumbnail | null) => void,
) {
  const needsCover =
    Boolean(video?.file) &&
    (!thumbnail || (thumbnail.source === 'frame' && thumbnail.videoId !== video?.id))
  const latest = useRef(onChange)
  latest.current = onChange
  useEffect(() => {
    if (!needsCover || !video) return
    let cancelled = false
    const reader = frameReader(video.url)
    void (async () => {
      try {
        await waitFor(reader, 'loadeddata')
        await seek(reader, 0)
        const file = await captureFrame(reader)
        if (cancelled) return
        latest.current({
          id: crypto.randomUUID(),
          type: 'image',
          name: file.name,
          url: URL.createObjectURL(file),
          file,
          source: 'frame',
          time: 0,
          videoId: video.id,
        })
      } catch {
        // Without a frame, Facebook picks the cover itself.
      }
    })()
    return () => {
      cancelled = true
      reader.removeAttribute('src')
      reader.load()
    }
  }, [needsCover, video])
}

/** The cover tile beside a Reel's video; opens the picker. */
export function ReelCoverField({
  video,
  thumbnail,
  onChange,
  className = 'size-[128px]',
}: {
  video: ComposerMedia
  thumbnail: ComposerThumbnail | null
  onChange: (thumbnail: ComposerThumbnail | null) => void
  /** Size of the square; by default 128px, or e.g. the height of what sits beside it. */
  className?: string
}) {
  const { t } = useTranslation('planning')
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  useDefaultReelCover(video, thumbnail, onChange)
  // Read the strip ahead, so the picker opens with it.
  useEffect(() => {
    void videoFrames(video.id, video.url)
  }, [video.id, video.url])
  const replace = (next: ComposerThumbnail | null) => {
    if (thumbnail?.file && thumbnail.url !== next?.url) URL.revokeObjectURL(thumbnail.url)
    onChange(next)
  }
  const caption = !thumbnail
    ? t('composer.cover.auto')
    : thumbnail.source === 'upload'
      ? t('composer.cover.uploaded')
      : t('composer.cover.frameAt', { time: clock(thumbnail.time ?? 0) })

  return (
    <div className="flex">
      <button
        type="button"
        aria-label={`${t('composer.cover.edit')} · ${caption}`}
        title={caption}
        className={`group relative shrink-0 overflow-hidden rounded-xl border bg-neutral-950 focus-visible:focus-ring ${dragging ? 'border-action-primary ring-2 ring-action-primary' : 'border-border-subtle'} ${className}`}
        onClick={() => setOpen(true)}
        // A picture dropped on the tile becomes the cover, as in the dialog. The editor below
        // takes dropped media too, so the drop stops here.
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          event.stopPropagation()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          // Moving over the picture or labels inside the tile is not leaving it.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setDragging(false)
          const file = pickedImage(event.dataTransfer.files)
          if (!file) {
            toast.error({ title: t('composer.cover.invalidFile') })
            return
          }
          replace({
            id: crypto.randomUUID(),
            type: 'image',
            name: file.name,
            url: URL.createObjectURL(file),
            file,
            source: 'upload',
          })
        }}
      >
        {thumbnail ? (
          <img src={thumbnail.url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : null}
        {/* Also read for the length shown in the corner when a picture is the cover. */}
        <video
          src={`${localVideoUrl(video.id) ?? video.url}#t=0.1`}
          className={thumbnail ? 'hidden' : 'absolute inset-0 size-full object-cover'}
          muted
          preload="metadata"
          onLoadedMetadata={(event) => {
            const seconds = event.currentTarget.duration
            setDuration(Number.isFinite(seconds) ? seconds : null)
          }}
        />
        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-md bg-neutral-950/70 px-2 py-1 text-caption font-medium text-text-inverse">
          <IconImage aria-hidden />
          {t('composer.cover.title')}
        </span>
        {duration !== null ? (
          <span className="absolute bottom-2 end-2 rounded-md bg-neutral-950/70 px-2 py-1 text-caption tabular-nums text-text-inverse">
            {length(duration)}
          </span>
        ) : null}
        <span
          className={`absolute inset-0 flex items-center justify-center gap-1 bg-neutral-950/50 text-label-md text-text-inverse transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${dragging ? 'opacity-100' : 'opacity-0'}`}
        >
          {dragging ? (
            <>
              <IconUpload aria-hidden />
              {t('composer.cover.dropShort')}
            </>
          ) : (
            <>
              <IconPencil aria-hidden />
              {t('composer.cover.editShort')}
            </>
          )}
        </span>
      </button>
      {open ? (
        <ReelCoverModal
          video={video}
          thumbnail={thumbnail}
          onClose={() => setOpen(false)}
          onSave={(next) => {
            replace(next)
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

/**
 * "Choose a thumbnail": drag along the video's frames to pick one, or use a picture of your own,
 * picked from the device, pasted or dropped onto the dialog.
 */
function ReelCoverModal({
  video,
  thumbnail,
  onClose,
  onSave,
}: {
  video: ComposerMedia
  thumbnail: ComposerThumbnail | null
  onClose: () => void
  onSave: (thumbnail: ComposerThumbnail) => void
}) {
  const { t } = useTranslation('planning')
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrubbing = useRef(false)
  // A video picked on this device plays from the file, without a download.
  const [source] = useState(() => localVideoUrl(video.id) ?? video.url)
  const cached = readyVideoFrames(video.id)
  const [duration, setDuration] = useState(cached?.duration ?? 0)
  const [time, setTime] = useState(thumbnail?.source === 'frame' ? (thumbnail.time ?? 0) : 0)
  const [picture, setPicture] = useState<{ url: string; file?: File } | null>(
    thumbnail?.source === 'upload' ? { url: thumbnail.url, file: thumbnail.file } : null,
  )
  const [changed, setChanged] = useState(false)
  const [frames, setFrames] = useState<string[]>(cached?.frames ?? [])
  // Stored videos are read through CORS; if the bucket refuses, the video still plays without it.
  const [readable, setReadable] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ownUrls = useRef(new Set<string>())

  useEffect(() => {
    const urls = ownUrls.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  // The strip of frames under the preview, read once per video and kept while composing.
  useEffect(() => {
    let cancelled = false
    void videoFrames(video.id, video.url).then((result) => {
      if (cancelled || !result) return
      setFrames(result.frames)
      setDuration((current) => current || result.duration)
    })
    return () => {
      cancelled = true
    }
  }, [video.id, video.url])

  const takePicture = (file: File | null) => {
    if (!file) {
      setError(t('composer.cover.invalidFile'))
      return
    }
    const url = URL.createObjectURL(file)
    ownUrls.current.add(url)
    setPicture({ url, file })
    setChanged(true)
    setError(null)
  }

  // A picture pasted anywhere while the dialog is open becomes the cover.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const data = event.clipboardData
      const files = data?.files.length
        ? Array.from(data.files)
        : Array.from(data?.items ?? [])
            .filter((item) => item.kind === 'file')
            .flatMap((item) => item.getAsFile() ?? [])
      if (!files.length) return
      event.preventDefault()
      takePicture(pickedImage(files))
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  })

  const moveTo = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), duration || 0)
    setTime(clamped)
    setPicture(null)
    setChanged(true)
    setError(null)
    if (videoRef.current) videoRef.current.currentTime = clamped
  }

  const timeAt = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    return ((event.clientX - box.left) / box.width) * duration
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 2 : 0.5
    const next =
      event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? time - step
        : event.key === 'ArrowRight' || event.key === 'ArrowUp'
          ? time + step
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? duration
              : null
    if (next === null) return
    event.preventDefault()
    moveTo(next)
  }

  const save = async () => {
    if (!changed && thumbnail) {
      onClose()
      return
    }
    setSaving(true)
    try {
      if (picture?.file) {
        onSave({
          id: crypto.randomUUID(),
          type: 'image',
          name: picture.file.name,
          url: URL.createObjectURL(picture.file),
          file: picture.file,
          source: 'upload',
        })
        return
      }
      const element = videoRef.current
      if (!element || !readable) throw new Error('Video not readable')
      const file = await captureFrame(element)
      onSave({
        id: crypto.randomUUID(),
        type: 'image',
        name: file.name,
        url: URL.createObjectURL(file),
        file,
        source: 'frame',
        time,
        videoId: video.id,
      })
    } catch {
      setError(t('composer.cover.captureFailed'))
    } finally {
      setSaving(false)
    }
  }

  const position = duration ? (time / duration) * 100 : 0

  return (
    <Modal
      open
      title={t('composer.cover.modalTitle')}
      width={640}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            icon={<IconUpload aria-hidden />}
            disabled={saving}
            onClick={() => inputRef.current?.click()}
          >
            {t('composer.cover.upload')}
          </Button>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            {t('composer.cover.save')}
          </Button>
        </div>
      }
    >
      <div
        className="relative grid gap-4"
        onDragOver={(event) => {
          if (!Array.from(event.dataTransfer.types).includes('Files')) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          setDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          takePicture(pickedImage(event.dataTransfer.files))
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={IMAGE_TYPES.join(',')}
          onChange={(event) => {
            takePicture(pickedImage(event.target.files))
            event.target.value = ''
          }}
        />
        <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-950">
          <video
            ref={videoRef}
            key={readable ? 'cors' : 'plain'}
            src={source}
            crossOrigin={readable && !source.startsWith('blob:') ? 'anonymous' : undefined}
            muted
            playsInline
            preload="auto"
            className={`size-full object-contain ${picture ? 'invisible' : ''}`}
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration || 0)
              event.currentTarget.currentTime = time
            }}
            onError={() => {
              if (readable && !source.startsWith('blob:')) setReadable(false)
            }}
          />
          {picture ? (
            <img src={picture.url} alt="" className="absolute inset-0 size-full object-contain" />
          ) : null}
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label={t('composer.cover.position')}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${clock(time)} / ${clock(duration)}`}
          className="relative h-14 cursor-pointer touch-none select-none overflow-hidden rounded-lg bg-neutral-800 focus-visible:focus-ring"
          onKeyDown={onKeyDown}
          onPointerDown={(event) => {
            if (!duration) return
            scrubbing.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            moveTo(timeAt(event))
          }}
          onPointerMove={(event) => {
            if (scrubbing.current) moveTo(timeAt(event))
          }}
          onPointerUp={() => {
            scrubbing.current = false
          }}
          onPointerCancel={() => {
            scrubbing.current = false
          }}
        >
          <div className="flex size-full">
            {frames.map((frame, index) => (
              <img
                key={index}
                src={frame}
                alt=""
                draggable={false}
                className="h-full min-w-0 flex-1 object-cover"
              />
            ))}
          </div>
          {picture ? <div className="absolute inset-0 bg-neutral-950/50" /> : null}
          <span
            aria-hidden
            className={`absolute inset-y-0 w-1 -translate-x-1/2 rounded-pill bg-brand-500 shadow-sm ${picture ? 'opacity-0' : ''}`}
            style={{ left: `${position}%` }}
          />
        </div>

        <div className="grid justify-items-center gap-1 text-center">
          <span className="text-body-sm tabular-nums text-text-secondary">
            {clock(time)} / {clock(duration)}
          </span>
        </div>

        {error ? <Alert variant="soft" tone="error" title={error} /> : null}

        {dragging ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-border-focus bg-action-subtle text-label-md text-text-primary">
            {t('composer.cover.drop')}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
