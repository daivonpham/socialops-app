import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import { fileExtensionOf, fileKindOf, openFile } from '@/shared/lib/openFile'
import {
  IconAttach,
  IconClose,
  IconRefresh,
  Image,
  ImagePreviewGroup,
  Spin,
  Tooltip,
  useToast,
} from '@/shared/ui'
import { releaseAiAttachment, uploadAiAttachment, type AiAttachment } from '../api'

export const ATTACHMENTS_MAX = 5
const FILE_MAX_BYTES = 10 * 1024 * 1024

/** The types the API accepts, by extension: browsers often leave Office types empty. */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
}
const ACCEPT = Object.keys(MIME_BY_EXTENSION)
  .map((extension) => `.${extension}`)
  .join(',')

export type Attachment = {
  id: string
  file: File
  mimeType: string
  /** Object URL of the picked file, shown until the uploaded copy is ready. */
  previewUrl: string
  status: 'uploading' | 'ready' | 'failed'
  uploaded?: AiAttachment
}

const sameFile = (a: File, b: File): boolean =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

/**
 * Files picked in the composer, each uploaded as soon as it is picked. Removing one stops its
 * upload and lets the API delete it; closing the composer does the same for those not sent. Sent
 * files belong to the chat from then on, and go when it does.
 */
export function useAttachments(brandId: string) {
  const { t } = useTranslation('aiContent')
  const toast = useToast()
  const errorMessage = useApiErrorMessage('aiContent')
  const [items, setItems] = useState<Attachment[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items
  const uploads = useRef(new Map<string, AbortController>())

  const patch = (id: string, change: Partial<Attachment>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)))

  const upload = (item: Attachment) => {
    const controller = new AbortController()
    uploads.current.set(item.id, controller)
    patch(item.id, { status: 'uploading' })
    uploadAiAttachment(brandId, item.file, item.mimeType, {
      signal: controller.signal,
    })
      .then((uploaded) => patch(item.id, { status: 'ready', uploaded }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        patch(item.id, { status: 'failed' })
        toast.error({
          title: errorMessage(error, t('attach.uploadError', { name: item.file.name })),
        })
      })
      .finally(() => uploads.current.delete(item.id))
  }

  const discard = (item: Attachment) => {
    uploads.current.get(item.id)?.abort()
    if (item.uploaded) void releaseAiAttachment(brandId, item.uploaded.id).catch(() => undefined)
    URL.revokeObjectURL(item.previewUrl)
  }

  useEffect(
    () => () => itemsRef.current.forEach(discard),
    // Runs once, on close; `discard` only reads refs and the Brand of this composer.
    [],
  )

  const add = (files: File[]) => {
    const current = itemsRef.current
    const fresh = files.filter((file) => !current.some((item) => sameFile(item.file, file)))
    const known = fresh.filter((file) => MIME_BY_EXTENSION[fileExtensionOf(file.name)])
    const fitting = known.filter((file) => file.size <= FILE_MAX_BYTES)
    const room = Math.max(ATTACHMENTS_MAX - current.length, 0)
    const taken = fitting.slice(0, room)
    if (known.length < fresh.length) toast.warning({ title: t('attach.unsupported') })
    if (fitting.length < known.length) toast.warning({ title: t('attach.tooLarge') })
    if (taken.length < fitting.length)
      toast.warning({ title: t('attach.tooMany', { count: ATTACHMENTS_MAX }) })
    if (!taken.length) return
    const added: Attachment[] = taken.map((file) => ({
      id: crypto.randomUUID(),
      file,
      mimeType: MIME_BY_EXTENSION[fileExtensionOf(file.name)]!,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
    }))
    setItems([...current, ...added])
    added.forEach(upload)
  }

  const remove = (id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id)
    if (item) discard(item)
    setItems((current) => current.filter((entry) => entry.id !== id))
  }

  const retry = (id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id)
    if (item?.status === 'failed') upload(item)
  }

  return {
    items,
    add,
    remove,
    retry,
    /** The uploaded files, handed to a request that was sent; the composer starts empty again. */
    consume: (): string[] => {
      const sent = itemsRef.current.flatMap((item) => (item.uploaded ? [item.uploaded.id] : []))
      itemsRef.current.forEach((item) => {
        uploads.current.get(item.id)?.abort()
        URL.revokeObjectURL(item.previewUrl)
      })
      itemsRef.current = []
      setItems([])
      return sent
    },
    /** The uploaded files, for the request about to be sent. */
    readyIds: items.flatMap((item) => (item.uploaded ? [item.uploaded.id] : [])),
    full: items.length >= ATTACHMENTS_MAX,
    uploading: items.some((item) => item.status === 'uploading'),
  }
}

/** Badge colour by file kind; anything unknown stays neutral. */
const BADGE_TONE: Partial<Record<ReturnType<typeof fileKindOf>, string>> = {
  pdf: 'bg-error-600',
  word: 'bg-info-700',
  excel: 'bg-success-700',
}

/** A page with a folded corner and the file type on a coloured tag, e.g. "PDF". */
function FileTypeIcon({ name }: { name: string }) {
  const extension = fileExtensionOf(name)
  return (
    <span className="relative block h-[38px] w-[34px]">
      <svg
        viewBox="0 0 38 44"
        fill="none"
        aria-hidden
        className="absolute end-0 top-0 h-full w-[28px] text-neutral-300"
      >
        <path
          d="M5 1.5h16.5L30.5 10.5v28a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4v-33a4 4 0 0 1 4-4Z"
          transform="translate(1 0)"
          fill="currentColor"
          className="text-bg-surface"
        />
        <path
          d="M5 1.5h16.5L30.5 10.5v28a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4v-33a4 4 0 0 1 4-4Z M22.5 1.5v6a3 3 0 0 0 3 3h5"
          transform="translate(1 0)"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      {extension ? (
        <span
          className={`absolute start-0 bottom-[6px] rounded-sm px-1 text-[9px] leading-[12px] font-bold text-text-inverse uppercase ${BADGE_TONE[fileKindOf(name)] ?? 'bg-neutral-600'}`}
        >
          {extension.slice(0, 4)}
        </span>
      ) : null}
    </span>
  )
}

/** The paperclip: opens the file picker. */
export function AttachButton({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (files: File[]) => void
}) {
  const { t } = useTranslation('aiContent')
  const input = useRef<HTMLInputElement>(null)
  const label = disabled ? t('attach.full', { count: ATTACHMENTS_MAX }) : t('attach.add')
  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          onPick(Array.from(event.target.files ?? []))
          // Cleared so the same file can be picked again after removing it.
          event.target.value = ''
        }}
      />
      <Tooltip title={label}>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="flex size-[36px] items-center justify-center rounded-lg text-icon-md text-text-secondary transition-colors hover:bg-bg-surface-subtle hover:text-ai-600 focus-visible:focus-ring disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
        >
          <IconAttach aria-hidden />
        </button>
      </Tooltip>
    </>
  )
}

/** Over a tile while it uploads, or after it failed. */
function TileState({ item, onRetry }: { item: Attachment; onRetry: () => void }) {
  const { t } = useTranslation('aiContent')
  if (item.status === 'uploading')
    return (
      <span
        role="status"
        aria-label={t('attach.uploading', { name: item.file.name })}
        className="absolute inset-0 flex items-center justify-center rounded-lg bg-bg-surface/75"
      >
        <Spin size="sm" />
      </span>
    )
  if (item.status === 'failed')
    return (
      <button
        type="button"
        onClick={onRetry}
        aria-label={t('attach.retry', { name: item.file.name })}
        title={t('attach.retry', { name: item.file.name })}
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg border border-error-500 bg-error-50/90 text-error-700 focus-visible:focus-ring"
      >
        <IconRefresh aria-hidden className="text-icon-md" />
        <span className="text-[10px] leading-[14px] font-medium">{t('attach.retryShort')}</span>
      </button>
    )
  return null
}

/** Tiles above the text: a picture for images, an icon and the name for files. */
export function AttachmentList({
  items,
  onRemove,
  onRetry,
}: {
  items: Attachment[]
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}) {
  const { t } = useTranslation('aiContent')
  if (!items.length) return null
  return (
    <ImagePreviewGroup>
      <ul className="mb-3 flex flex-wrap gap-3" aria-label={t('attach.list')}>
        {items.map((item) => {
          const ready = item.status === 'ready'
          const url = item.uploaded?.url ?? item.previewUrl
          return (
            <li key={item.id} className="group relative w-[72px]">
              {fileKindOf(item.file.name, item.mimeType) === 'image' ? (
                <div className="size-[72px] overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-subtle">
                  <Image
                    // The local copy stays on screen: same picture, no second download.
                    src={item.previewUrl}
                    alt={item.file.name}
                    wrapperClassName="!block size-full [&_.ant-image-mask]:!hidden"
                    className="!size-full cursor-pointer object-cover"
                    preview={ready}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  title={item.file.name}
                  disabled={!ready}
                  aria-label={t('attach.open', { name: item.file.name })}
                  onClick={() => openFile({ url, name: item.file.name, mimeType: item.mimeType })}
                  className="flex size-[72px] flex-col items-center justify-center gap-1 rounded-lg border border-border-subtle bg-bg-surface-subtle px-1 pt-1 transition-colors hover:border-ai-300 focus-visible:focus-ring disabled:cursor-default disabled:hover:border-border-subtle"
                >
                  <FileTypeIcon name={item.file.name} />
                  <span className="w-full truncate text-center text-[10px] leading-[14px] text-text-secondary">
                    {item.file.name}
                  </span>
                </button>
              )}
              <TileState item={item} onRetry={() => onRetry(item.id)} />
              <button
                type="button"
                aria-label={t('attach.remove', { name: item.file.name })}
                onClick={() => onRemove(item.id)}
                // Shown on hover or keyboard focus; always shown where there is no hover (touch).
                className="absolute -end-[6px] -top-[6px] flex size-[18px] items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-[10px] text-text-primary opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:focus-ring [@media(hover:none)]:opacity-100"
              >
                <IconClose aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </ImagePreviewGroup>
  )
}
