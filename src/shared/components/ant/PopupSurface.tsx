import type { ReactNode } from 'react'

export type PopupPlacement =
  'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'

function caretPosition(placement: PopupPlacement): string {
  if (placement === 'bottomLeft') return 'left-4 top-0 -translate-y-1/2'
  if (placement === 'bottomRight') return 'right-4 top-0 -translate-y-1/2'
  if (placement === 'topLeft') return 'bottom-0 left-4 translate-y-1/2'
  if (placement === 'topRight') return 'bottom-0 right-4 translate-y-1/2'
  if (placement === 'top') return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
  return 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'
}

function PopupCaret({ placement }: { placement: PopupPlacement }) {
  const topPlacement = placement.startsWith('top')
  return (
    <span
      aria-hidden
      className={
        `pointer-events-none absolute size-3 rotate-45 rounded-xs border-border-subtle bg-bg-surface ${topPlacement ? 'border-b border-r' : 'border-l border-t'} ` +
        caretPosition(placement)
      }
    />
  )
}

export function PopupSurface({
  placement,
  className = '',
  children,
}: {
  placement: PopupPlacement
  className?: string
  children: ReactNode
}) {
  return (
    <div className={placement.startsWith('top') ? 'pb-2' : 'pt-2'}>
      <div
        className={`${className} relative rounded-lg border border-border-subtle bg-bg-surface shadow-lg`}
      >
        <PopupCaret placement={placement} />
        {children}
      </div>
    </div>
  )
}
