import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Draggable } from '@fullcalendar/interaction'
import { formatLocalizedDate } from '@/shared/i18n'
import { Popover } from '@/shared/ui'
import type { PlanningContent } from '../api'
import { planningCalendarEventDate } from '../model/calendar-event-date'
import { planningStatusGroup } from '../model/planning-status-group'
import { PLANNING_EVENT_STATUS_CLASS, PlanningCalendarEvent } from './PlanningCalendarEvent'

/** Posts that share a calendar spot, shown as one card with the rest stacked behind it. */
export function PlanningCalendarStack({
  contents,
  timeText,
  open,
  formatTime,
  canDrag,
  onClose,
  onSelectContent,
}: {
  contents: PlanningContent[]
  timeText: string
  open: boolean
  formatTime: (date: string) => string
  /** Whether a post in the list may be dragged onto another day or time. */
  canDrag: (content: PlanningContent) => boolean
  onClose: () => void
  onSelectContent: (content: PlanningContent) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const draggable = useRef<Draggable | null>(null)
  // Posts in the open list drag onto the calendar like external items; the calendar's `drop`
  // reschedules them. While dragging, the list hides so every day stays reachable.
  const listRef = useCallback((node: HTMLUListElement | null) => {
    draggable.current?.destroy()
    draggable.current = null
    if (!node) return
    const instance = new Draggable(node, {
      itemSelector: '[data-planning-drag-id]',
      eventData: { create: false },
      minDistance: 5,
    })
    instance.dragging.emitter.on('dragstart', () =>
      document.body.classList.add('planning-stack-dragging'),
    )
    instance.dragging.emitter.on('dragend', () =>
      document.body.classList.remove('planning-stack-dragging'),
    )
    draggable.current = instance
  }, [])
  const [first] = contents
  if (!first) return null

  const firstDate = planningCalendarEventDate(first)
  // The next posts peek out above the top card, nearest first, in their own status colour.
  const layers = contents.slice(1, 3).reverse()

  return (
    <Popover
      open={open}
      // Opening is driven by the calendar's event click so mouse and keyboard behave alike.
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      placement="bottomLeft"
      content={
        <div className="grid w-[20rem] max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
            <p className="text-label-md text-text-primary">
              {formatLocalizedDate(firstDate, i18n.resolvedLanguage, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <span className="shrink-0 text-caption text-text-tertiary">
              {t('calendar.stackCount', { count: contents.length })}
            </span>
          </div>
          <ul
            ref={listRef}
            className="planning-calendar-stack-list grid max-h-[24rem] gap-2 overflow-y-auto p-2"
          >
            {contents.map((content) => (
              <li key={content.id}>
                <button
                  type="button"
                  data-planning-drag-id={canDrag(content) ? content.id : undefined}
                  className={`block w-full rounded-md text-start outline-none focus-visible:focus-ring ${canDrag(content) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  onClick={() => {
                    onClose()
                    onSelectContent(content)
                  }}
                >
                  <PlanningCalendarEvent
                    content={content}
                    timeText={formatTime(planningCalendarEventDate(content))}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <div
        aria-label={t('calendar.stackLabel', { count: contents.length, time: timeText })}
        aria-expanded={open}
        className="planning-calendar-stack flex min-w-0 flex-col"
      >
        <div aria-hidden className="planning-calendar-stack__layers flex flex-col">
          {layers.map((content, index) => (
            <span
              key={content.id}
              className={`block h-[6px] shrink-0 rounded-t-md border border-b-0 ${layers.length - index === 2 ? 'mx-3' : 'mx-[6px]'} ${PLANNING_EVENT_STATUS_CLASS[planningStatusGroup(content)]}`}
            />
          ))}
        </div>
        <div aria-hidden className="planning-calendar-stack__top min-h-0">
          <PlanningCalendarEvent content={first} timeText={timeText} tooltip={false} />
        </div>
      </div>
    </Popover>
  )
}
