import { useEffect, useState, useSyncExternalStore } from 'react'

/*
 * App-wide progress line under the top bar for long, user-started work (exports, saves).
 * Any screen reports work with `useTopLoading(active)`; the app shell renders one
 * `<TopLoadingBar />`. Overlapping work keeps the line running until the last one ends.
 */
let pending = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Shows the top progress line while `active` is true. */
export function useTopLoading(active: boolean) {
  useEffect(() => {
    if (!active) return
    pending += 1
    emit()
    return () => {
      pending -= 1
      emit()
    }
  }, [active])
}

type Phase = 'idle' | 'running' | 'finishing'

/** Short work never shows the line, so it does not flash. */
const SHOW_DELAY_MS = 150
const FINISH_MS = 400

export function TopLoadingBar({ label }: { label: string }) {
  const busy = useSyncExternalStore(subscribe, () => pending > 0)
  const [phase, setPhase] = useState<Phase>('idle')
  // Starts at 0 and moves to 85% on the next frame so the long transition actually runs.
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (busy) {
      const timer = window.setTimeout(() => setPhase('running'), SHOW_DELAY_MS)
      return () => window.clearTimeout(timer)
    }
    setStarted(false)
    setPhase((current) => (current === 'running' ? 'finishing' : 'idle'))
  }, [busy])

  useEffect(() => {
    if (phase === 'running') {
      const frame = window.requestAnimationFrame(() => setStarted(true))
      return () => window.cancelAnimationFrame(frame)
    }
    if (phase === 'finishing') {
      const timer = window.setTimeout(() => setPhase('idle'), FINISH_MS)
      return () => window.clearTimeout(timer)
    }
  }, [phase])

  if (phase === 'idle') return null
  const finishing = phase === 'finishing'
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-busy={!finishing}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden"
    >
      <div
        className="h-full origin-left bg-brand-600 rtl:origin-right"
        style={{
          transform: `scaleX(${finishing ? 1 : started ? 0.85 : 0})`,
          opacity: finishing ? 0 : 1,
          // Slows down as it nears 85%; finishing fills the rest, then fades out.
          transition: finishing
            ? `transform 200ms ease-out, opacity 200ms ease-out 200ms`
            : started
              ? 'transform 8s cubic-bezier(0.1, 0.6, 0.2, 1)'
              : 'none',
        }}
      />
    </div>
  )
}
