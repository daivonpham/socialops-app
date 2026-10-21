import { useRef, useState, type ReactNode } from 'react'
import { IconUploadCloud } from './primitives/icons'

export function MediaDropzone({
  actionLabel,
  description,
  hint,
  accept,
  multiple = false,
  onFilesSelected,
}: {
  actionLabel: string
  description?: string
  hint?: ReactNode
  accept?: string
  multiple?: boolean
  onFilesSelected: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const selectFiles = (files: FileList | null) => {
    if (!files?.length) return
    onFilesSelected(multiple ? Array.from(files) : [files[0]])
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          selectFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        aria-label={actionLabel}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border px-6 py-6 text-center transition-colors focus-visible:focus-ring ${dragging ? 'border-border-focus bg-action-subtle' : 'border-border-subtle bg-bg-surface hover:bg-bg-surface-subtle'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
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
          selectFiles(event.dataTransfer.files)
        }}
      >
        <span className="flex size-12 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface text-icon-md text-text-secondary shadow-xs">
          <IconUploadCloud aria-hidden />
        </span>
        <span className="text-body-sm text-text-secondary">
          <span className="font-semibold text-action-text">{actionLabel}</span>
          {description ? ` ${description}` : ''}
        </span>
        {hint ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
      </button>
    </div>
  )
}
