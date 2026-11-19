import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * A horizontal scrollbar that stays at the bottom of the page's scroll area while the bottom of a
 * wide table is still below it, so people can scroll sideways without first scrolling down to the
 * end of the table. It mirrors the table's own scroll position, whose native bar is hidden.
 */
export function StickyHorizontalScrollbar({
  targetRef,
}: {
  targetRef: RefObject<HTMLDivElement | null>
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [scrollWidth, setScrollWidth] = useState(0)
  const [overflowing, setOverflowing] = useState(false)
  const [bottomInset, setBottomInset] = useState(0)

  useEffect(() => {
    const target = targetRef.current
    const bar = barRef.current
    if (!target || !bar) return

    const measure = () => {
      setScrollWidth(target.scrollWidth)
      setOverflowing(target.scrollWidth > target.clientWidth + 1)
      bar.scrollLeft = target.scrollLeft
      // Sticky stops at the inner edge of the scroll area's padding; reach past it to the very
      // bottom so no rows show below the bar.
      const scroller = findScrollParent(bar)
      setBottomInset(scroller ? parseFloat(getComputedStyle(scroller).paddingBottom) || 0 : 0)
    }
    measure()

    // Each side only copies a position that differs, so the two scroll events settle at once.
    const syncFromTarget = () => {
      if (bar.scrollLeft !== target.scrollLeft) bar.scrollLeft = target.scrollLeft
    }
    const syncFromBar = () => {
      if (target.scrollLeft !== bar.scrollLeft) target.scrollLeft = bar.scrollLeft
    }
    target.addEventListener('scroll', syncFromTarget, { passive: true })
    bar.addEventListener('scroll', syncFromBar, { passive: true })

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(target)
      if (target.firstElementChild) observer.observe(target.firstElementChild)
    }

    return () => {
      target.removeEventListener('scroll', syncFromTarget)
      bar.removeEventListener('scroll', syncFromBar)
      observer?.disconnect()
    }
  }, [targetRef])

  // A hidden bar cannot hold a scroll position, so catch up once it shows.
  useEffect(() => {
    if (overflowing && barRef.current && targetRef.current) {
      barRef.current.scrollLeft = targetRef.current.scrollLeft
    }
  }, [overflowing, targetRef])

  return (
    <div
      ref={barRef}
      aria-hidden
      className={`app-scrollbar sticky z-sticky overflow-x-auto overflow-y-hidden ${overflowing ? '' : 'hidden'}`}
      style={{ bottom: -bottomInset }}
    >
      <div className="h-px" style={{ width: scrollWidth }} />
    </div>
  )
}

function findScrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) return node
  }
  return null
}
