import { useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/auth'
import { ClickWave } from '@/shared/ui'
import { useAiAvailability, type AiPlatform, type AiSuggestionHandoff } from '../api'
import { AiCreateModal } from './AiCreateModal'
import { AiMark } from './AiMark'
import { rememberOpenChat } from '../model/chatMemory'

/**
 * Sits beside "Create post". Shows only when AI is switched on and this person may create posts,
 * and looks different on purpose: the `ai` gradient, the sparkle and a Beta tag.
 */
export function AiCreateButton({
  brandId,
  platform,
  defaultPageId,
  onOpenContent,
  onUseSuggestion,
  onCreated,
  className = '',
  openChatId = null,
  onChatOpened,
}: {
  brandId: string | null
  /** The network the post is for: the dialog offers only its accounts. */
  platform: AiPlatform
  defaultPageId?: string
  onOpenContent: (contentId: string, platform: AiPlatform) => void
  /** "Use" on a suggestion: open the post screen filled with it. */
  onUseSuggestion: (suggestion: AiSuggestionHandoff) => void
  onCreated: () => void
  /** Width and placement from the toolbar it sits in, e.g. full width on a phone. */
  className?: string
  /** Opens the dialog on this chat, e.g. from a notification; `onChatOpened` then clears it. */
  openChatId?: string | null
  onChatOpened?: () => void
}) {
  const { t } = useTranslation('aiContent')
  const availability = useAiAvailability(brandId)
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const data = availability.data
  const shown = Boolean(brandId && data?.enabled && data.canGenerate)
  useRunningBorder(buttonRef, shown)
  const { user } = useAuth()
  useEffect(() => {
    if (!openChatId || !brandId || !shown) return
    // The dialog opens on the chat it remembers, so this chat becomes the remembered one.
    rememberOpenChat(user?.id, brandId, openChatId)
    setOpen(true)
    onChatOpened?.()
  }, [brandId, onChatOpened, openChatId, shown, user?.id])
  if (!brandId || !data?.enabled || !data.canGenerate) return null

  return (
    <>
      <ClickWave>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          className={`app-ai-running-border inline-flex h-[36px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-label-md text-text-inverse shadow-[0_4px_14px_-4px] shadow-ai-500/60 transition-[filter,box-shadow] duration-fast hover:brightness-110 hover:shadow-ai-500/80 focus-visible:focus-ring active:brightness-95 ${className}`}
        >
          <AiMark tone="white" className="w-[20px]" />
          {t('button')}
          {/* Dropped on a phone, where the button has half a row. */}
          <span className="hidden rounded-full border border-bg-surface/40 bg-bg-surface/20 px-2 text-caption font-medium sm:inline">
            {t('beta')}
          </span>
        </button>
      </ClickWave>
      {open ? (
        <AiCreateModal
          brandId={brandId}
          platform={platform}
          availability={data}
          defaultPageId={defaultPageId}
          onOpenContent={(contentId, platform) => {
            setOpen(false)
            onOpenContent(contentId, platform)
          }}
          onUseSuggestion={(suggestion) => {
            setOpen(false)
            onUseSuggestion(suggestion)
          }}
          onCreated={onCreated}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

const LAP_MS = 4000
const SAMPLES = 96

/**
 * Keyframes for the conic angle that move the light along the border at an even speed. Turning
 * the angle evenly would race along the long sides of a wide button and crawl at the short
 * ends, so each step of the lap gets the angle of the point an even distance along the edge.
 */
function evenLapKeyframes(width: number, height: number): Keyframe[] {
  const perimeter = 2 * (width + height)
  // Clockwise from the top middle, as the conic gradient counts its angle.
  const pointAt = (distance: number): [number, number] => {
    let d = (distance + width / 2) % perimeter
    if (d < width) return [d - width / 2, -height / 2]
    d -= width
    if (d < height) return [width / 2, d - height / 2]
    d -= height
    if (d < width) return [width / 2 - d, height / 2]
    d -= width
    return [-width / 2, height / 2 - d]
  }
  let previous = 0
  return Array.from({ length: SAMPLES + 1 }, (_, index) => {
    const [x, y] = pointAt((index / SAMPLES) * perimeter)
    let angle = (Math.atan2(x, -y) * 180) / Math.PI
    // Keep it climbing past 360 so the lap never spins back.
    while (angle < previous - 1e-6) angle += 360
    previous = angle
    return { offset: index / SAMPLES, '--app-ai-border-angle': `${angle}deg` }
  })
}

/** Runs the border light round `ref` while it is shown, re-paced when it changes size. */
function useRunningBorder(ref: RefObject<HTMLElement | null>, shown: boolean) {
  useEffect(() => {
    const element = ref.current
    // Older browsers and the test DOM lack these: the border then just stays still.
    if (!element || typeof ResizeObserver === 'undefined' || !element.animate) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let animation: Animation | undefined
    const run = () => {
      const { width, height } = element.getBoundingClientRect()
      if (!width || !height) return
      const time = animation?.currentTime ?? 0
      animation?.cancel()
      animation = element.animate(evenLapKeyframes(width, height), {
        duration: LAP_MS,
        iterations: Infinity,
      })
      animation.currentTime = time
    }
    const observer = new ResizeObserver(run)
    observer.observe(element)
    return () => {
      observer.disconnect()
      animation?.cancel()
    }
  }, [ref, shown])
}
