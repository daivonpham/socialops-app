import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toPlainCaption } from '@/shared/lib/plainCaption'

/** The caption as the Page shows it: Markdown marks off, line breaks kept. */
export function CaptionClamp({
  caption: written,
  inverse = false,
  lines = 2,
  renderText,
}: {
  caption: string
  inverse?: boolean
  lines?: 2 | 4
  renderText?: (text: string) => ReactNode
}) {
  const { t } = useTranslation('planning')
  const caption = useMemo(() => toPlainCaption(written), [written])
  const showMore = t('detail.showMoreCaption')
  const containerRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const measureTextRef = useRef<HTMLSpanElement>(null)
  const measureActionRef = useRef<HTMLSpanElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [collapsedText, setCollapsedText] = useState<string | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    const measureText = measureTextRef.current
    const measureAction = measureActionRef.current
    if (!container || !measure || !measureText || !measureAction) return

    const update = () => {
      if (container.clientWidth === 0) return
      const lineHeight = Number.parseFloat(window.getComputedStyle(measure).lineHeight)
      const oneLineHeight = Number.isFinite(lineHeight) ? lineHeight : measure.clientHeight
      const maxHeight = oneLineHeight * lines + 1
      const fits = (text: string, withAction: boolean) => {
        measureText.textContent = withAction ? `${text}\u00a0…\u00a0` : text
        measureAction.textContent = withAction ? showMore : ''
        return measure.scrollHeight <= maxHeight
      }

      if (fits(caption, false)) {
        setCollapsedText(null)
        return
      }

      const words = [...caption.matchAll(/\S+/gu)]
      let low = 0
      let high = words.length
      while (low < high) {
        const middle = Math.ceil((low + high) / 2)
        const word = words[middle - 1]
        const prefix = caption.slice(0, word.index! + word[0].length).trimEnd()
        if (fits(prefix, true)) low = middle
        else high = middle - 1
      }
      const lastWord = words[low - 1]
      setCollapsedText(
        lastWord ? caption.slice(0, lastWord.index! + lastWord[0].length).trimEnd() : '',
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [caption, lines, showMore])

  const shortened = collapsedText !== null && !expanded
  return (
    <span ref={containerRef} className="relative block min-w-0">
      <span className="whitespace-pre-wrap break-words">
        {renderText
          ? renderText(shortened ? collapsedText : caption)
          : shortened
            ? collapsedText
            : caption}
        {shortened ? (
          <>
            <span aria-hidden="true">&nbsp;…&nbsp;</span>
            <button
              type="button"
              className={`font-medium hover:underline focus-visible:focus-ring ${inverse ? 'pointer-events-auto text-neutral-100' : 'text-action-text'}`}
              onClick={() => setExpanded(true)}
              aria-expanded={false}
            >
              {showMore}
            </button>
          </>
        ) : null}
      </span>
      {collapsedText !== null && expanded ? (
        <button
          type="button"
          className={`mt-1 block font-medium hover:underline focus-visible:focus-ring ${inverse ? 'pointer-events-auto text-neutral-100' : 'text-action-text'}`}
          onClick={() => setExpanded(false)}
          aria-expanded={true}
        >
          {t('detail.showLessCaption')}
        </button>
      ) : null}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute inset-x-0 top-0 block whitespace-pre-wrap break-words"
      >
        <span ref={measureTextRef} />
        <span ref={measureActionRef} className="font-medium" />
      </span>
    </span>
  )
}
