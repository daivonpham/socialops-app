import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, resolveLocale } from '@/shared/i18n'
import { Button } from './primitives/Button'
import { Image } from './primitives/Image'
import { Progress } from './primitives/Progress'
import {
  IconCheckCircle,
  IconFile,
  IconPauseStory,
  IconPlaySolid,
  IconTrash,
  IconUploadCloud,
  IconXCircle,
} from './primitives/icons'

export type FileUploadStatus = 'uploading' | 'complete' | 'failed'

export type FileUploadCardProps = {
  name: string
  /** What the thumbnail shows: the picture, a frame of the video, or a file icon. */
  preview: { type: 'image' | 'video' | 'file'; url?: string }
  /** Size in bytes, when known. */
  size?: number
  /** No status: the file is picked but not sent yet. */
  status?: FileUploadStatus
  /** 0–100 while uploading. */
  percent?: number
  onRemove?: () => void
  onRetry?: () => void
  /** Turns removing off, e.g. while the post is being saved. */
  disabled?: boolean
  /**
   * Plays the video somewhere else (e.g. a post preview): the thumbnail's play button toggles it
   * and shows whether it is playing; the thumbnail itself never plays.
   */
  playback?: { playing: boolean; onToggle: () => void }
}

function formatSize(bytes: number, locale: string): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${formatNumber(value, resolveLocale(locale), { maximumFractionDigits: unit > 1 ? 1 : 0 })} ${units[unit]}`
}

/**
 * One file being attached: its thumbnail, name, size and upload state, with a bar while it
 * uploads and a way to try again when it failed.
 */
export function FileUploadCard({
  name,
  preview,
  size,
  status,
  percent = 0,
  onRemove,
  onRetry,
  disabled = false,
  playback,
}: FileUploadCardProps) {
  const { t, i18n } = useTranslation('common')
  const locale = i18n.resolvedLanguage ?? 'vi-VN'
  const shown = status === 'complete' ? 100 : status === 'failed' ? 0 : percent
  const sizeText =
    size === undefined
      ? null
      : status
        ? t('fileUpload.progress', {
            loaded: formatSize((size * shown) / 100, locale),
            total: formatSize(size, locale),
          })
        : formatSize(size, locale)
  const state: Record<FileUploadStatus, { icon: ReactNode; label: string; tone: string }> = {
    uploading: {
      icon: <IconUploadCloud aria-hidden />,
      label: t('fileUpload.uploading'),
      tone: 'text-text-secondary',
    },
    complete: {
      icon: <IconCheckCircle aria-hidden />,
      label: t('fileUpload.complete'),
      tone: 'text-success-700',
    },
    failed: {
      icon: <IconXCircle aria-hidden />,
      label: t('fileUpload.failed'),
      tone: 'text-error-700',
    },
  }

  return (
    <div
      className={`flex min-w-0 items-stretch gap-3 rounded-xl border bg-bg-surface p-3 ${status === 'failed' ? 'border-error-600' : 'border-border-subtle'}`}
    >
      <Thumbnail name={name} preview={preview} playback={playback} />
      <div className="grid min-w-0 flex-1 gap-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <span className="truncate text-body-sm font-medium text-text-primary" title={name}>
            {name}
          </span>
          {onRemove && status !== 'uploading' ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              icon={<IconTrash />}
              aria-label={t('fileUpload.remove', { name })}
              className="-me-1 -mt-1 shrink-0"
              onClick={onRemove}
            />
          ) : null}
        </div>
        {sizeText || status ? (
          // One line whatever the width: the square thumbnail takes its height from this column.
          <span className="flex min-w-0 items-center gap-2 whitespace-nowrap text-caption text-text-tertiary">
            {sizeText ? <span className="truncate tabular-nums">{sizeText}</span> : null}
            {sizeText && status ? (
              <span aria-hidden className="h-3 w-px shrink-0 bg-border-subtle" />
            ) : null}
            {status ? (
              <span className={`inline-flex shrink-0 items-center gap-1 ${state[status].tone}`}>
                {state[status].icon}
                {state[status].label}
              </span>
            ) : null}
          </span>
        ) : null}
        {status === 'uploading' || status === 'complete' ? (
          <span className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <Progress
                percent={shown}
                ariaLabel={t('fileUpload.percent', { percent: shown, name })}
              />
            </span>
            <span className="shrink-0 text-caption tabular-nums text-text-secondary">{shown}%</span>
          </span>
        ) : null}
        {status === 'failed' && onRetry ? (
          <button
            type="button"
            className="justify-self-start text-label-sm font-semibold text-error-700 hover:underline focus-visible:focus-ring"
            onClick={onRetry}
          >
            {t('fileUpload.retry')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Thumbnail({
  name,
  preview,
  playback,
}: {
  name: string
  preview: FileUploadCardProps['preview']
  playback?: FileUploadCardProps['playback']
}) {
  const { t } = useTranslation('common')
  return (
    <span className="relative flex aspect-square min-h-[56px] shrink-0 self-stretch items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-subtle text-icon-lg text-text-tertiary">
      {preview.type === 'image' && preview.url ? (
        // Ant gives the image's wrapper `position: relative`, which wins over a class on it; the
        // wrapper stays in a layer of its own so the picture never sizes the thumbnail.
        <span className="absolute inset-0">
          <Image
            src={preview.url}
            alt={name}
            className="size-full object-cover"
            wrapperClassName="size-full"
            preview={{ mask: false }}
          />
        </span>
      ) : preview.type === 'video' && preview.url ? (
        <>
          {/* The first frame stands in for a thumbnail. */}
          <video
            src={preview.url}
            className="absolute inset-0 size-full object-cover"
            muted
            preload="metadata"
          />
          {playback ? (
            <button
              type="button"
              aria-label={t(playback.playing ? 'fileUpload.pause' : 'fileUpload.play', { name })}
              aria-pressed={playback.playing}
              onClick={playback.onToggle}
              className="absolute inset-0 flex items-center justify-center bg-neutral-950/25 text-icon-sm text-text-inverse transition-colors hover:bg-neutral-950/40 focus-visible:focus-ring"
            >
              {playback.playing ? <IconPauseStory aria-hidden /> : <IconPlaySolid aria-hidden />}
            </button>
          ) : (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-950/25 text-icon-sm text-text-inverse">
              <IconPlaySolid aria-hidden />
            </span>
          )}
        </>
      ) : (
        <IconFile aria-hidden />
      )}
    </span>
  )
}
