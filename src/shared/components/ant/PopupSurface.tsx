import type { ReactNode } from 'react'

export type PopupPlacement =
  'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'

function caretPosition(placement: PopupPlacement): string {
  return placement.startsWith('top') ? 'popup-surface__caret--top' : 'popup-surface__caret--bottom'
}

function PopupCaret({ placement }: { placement: PopupPlacement }) {
  return (
    <span
      aria-hidden
      style={{ left: 'var(--arrow-x, 50%)' }}
      className={
        'popup-surface__caret pointer-events-none absolute size-3 rounded-xs border-border-subtle bg-bg-surface ' +
        caretPosition(placement)
      }
    />
  )
}

export function PopupSurface({
  placement,
  className = '',
  caret = true,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  placement: PopupPlacement
  className?: string
  /** The arrow pointing at what opened it. */
  caret?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  children: ReactNode
}) {
  return (
    <div
      className={`popup-surface ${placement.startsWith('top') ? 'popup-surface--top' : 'popup-surface--bottom'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`${className} popup-surface__panel relative rounded-lg border border-border-subtle bg-bg-surface shadow-lg`}
      >
        {caret ? <PopupCaret placement={placement} /> : null}
        {children}
      </div>
    </div>
  )
}
