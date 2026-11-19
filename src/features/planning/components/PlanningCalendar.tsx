import { toPlainCaption } from '@/shared/lib/plainCaption'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type {
  DatesSetArg,
  DayCellMountArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core'
import viLocale from '@fullcalendar/core/locales/vi'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DropArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useTranslation } from 'react-i18next'
import {
  formatDateTime,
  formatLocalizedDate,
  formatLocalizedDateRange,
  getLocalTimeZone,
  uses12HourTime,
} from '@/shared/i18n'
import {
  Button,
  DatePicker,
  Dropdown,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconImage,
  IconMobile,
  IconPlus,
  IconPost,
  IconReel,
  IconVideo,
  Modal,
  Select,
  useToast,
} from '@/shared/ui'
import {
  useReschedulePlanningContent,
  type PlanningContent,
  type PlanningPlatform,
  type PlanningPostType,
} from '../api'
import type { PlanningCalendarView } from '../config/planning.filters'
import { getPlanningDragPolicy } from '../model'
import {
  groupPlanningCalendarContents,
  planningCalendarEventDate,
} from '../model/calendar-event-date'
import { PlanningCalendarEvent } from './PlanningCalendarEvent'
import { PlanningCalendarStack } from './PlanningCalendarStack'
import './planning-calendar.css'
import { PHONE_QUERY, useApiErrorMessage, useMediaQuery } from '@/shared/hooks'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { PLANNING_ACCESS } from '../config/planning-access'

type PendingReschedule = {
  content: PlanningContent
  previousAt: string
  proposedAt: string
  revert: () => void
}

/** One post, or several stacked posts in time order. */
type PlanningEventProperties = {
  contents: PlanningContent[]
}

type CalendarHeading = {
  title: string
  range: string
  /** What the date control shows on a phone: the month, or a week's range without its year. */
  shortRange: string
  month: string
  day: string
  week: number
}

const FULL_CALENDAR_PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin]

export function PlanningCalendar({
  brandId,
  contents,
  createPlatform,
  calendarView,
  selectedDate,
  onCalendarViewChange,
  onDateChange,
  onSelectContent,
  onCreatePost,
}: {
  brandId: string
  contents: PlanningContent[]
  createPlatform?: PlanningPlatform
  calendarView: PlanningCalendarView
  selectedDate: string
  onCalendarViewChange: (view: PlanningCalendarView) => void
  onDateChange: (date: string) => void
  onSelectContent: (content: PlanningContent) => void
  onCreatePost: (date: string, postType: PlanningPostType) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const errorMessage = useApiErrorMessage('planning')
  const calendarRef = useRef<FullCalendar | null>(null)
  const createButtonRoots = useRef(new Map<HTMLElement, Root>())
  const createButtonCleanups = useRef(new Map<HTMLElement, () => void>())
  const reschedule = useReschedulePlanningContent(brandId)
  const { granted } = usePermissions()
  const canPublishDirect = hasPermission(granted, PLANNING_ACCESS.publishDirect[0])
  const [calendarHeading, setCalendarHeading] = useState<CalendarHeading>({
    title: '',
    range: '',
    shortRange: '',
    month: '',
    day: '',
    week: 0,
  })
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null)
  const toast = useToast()
  const [openStackId, setOpenStackId] = useState<string | null>(null)
  const fullCalendarView = calendarView === 'month' ? 'dayGridMonth' : 'timeGridWeek'
  // On a phone the month fits the width: each post is a status-coloured chip with its picture,
  // its details one tap away. The week keeps its width and scrolls sideways.
  const phone = useMediaQuery(PHONE_QUERY)
  const compactMonth = phone && calendarView === 'month'
  const uses12HourClock = uses12HourTime(i18n.resolvedLanguage)
  const timeZone = getLocalTimeZone()
  const events = useMemo<EventInput[]>(
    () =>
      groupPlanningCalendarContents(contents, calendarView).map((group) => {
        const [content] = group
        const isStack = group.length > 1
        return {
          id: isStack ? `stack:${content.id}` : content.id,
          title: content.title ?? toPlainCaption(content.caption),
          start: planningCalendarEventDate(content),
          // A stack opens its list on click; its posts are rescheduled one by one from the post.
          editable: !isStack && getPlanningDragPolicy(content.status, canPublishDirect).draggable,
          durationEditable: false,
          extendedProps: { contents: group } satisfies PlanningEventProperties,
        }
      }),
    [calendarView, canPublishDirect, contents],
  )
  const formatEventTime = (date: string) =>
    formatLocalizedDate(date, i18n.resolvedLanguage, {
      hour: uses12HourClock ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: uses12HourClock,
    })

  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api || api.view.type === fullCalendarView) return
    api.changeView(fullCalendarView)
  }, [fullCalendarView])

  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api || toDateKey(api.getDate()) === selectedDate) return
    api.gotoDate(selectedDate)
  }, [selectedDate])

  const persistReschedule = async (
    content: PlanningContent,
    proposedAt: string,
    revert: () => void,
  ) => {
    try {
      await reschedule.mutateAsync({ brandId, contentId: content.id, scheduledAt: proposedAt })
    } catch (error) {
      revert()
      toast.error({ title: errorMessage(error, t('reschedule.error')) })
    }
  }

  const handleEventDrop = (info: EventDropArg) => {
    const [content] = (info.event.extendedProps as PlanningEventProperties).contents
    const proposedAt = info.event.start?.toISOString()
    if (!content || !proposedAt) {
      info.revert()
      return
    }

    const policy = getPlanningDragPolicy(content.status, canPublishDirect)
    if (!policy.draggable) {
      info.revert()
      return
    }
    if (policy.requiresConfirmation) {
      setPendingReschedule({
        content,
        previousAt: content.scheduledAt ?? content.createdAt,
        proposedAt,
        revert: info.revert,
      })
      return
    }

    void persistReschedule(content, proposedAt, info.revert)
  }

  /** A post dragged out of a stack's list onto another day or time. */
  const handleStackItemDrop = (info: DropArg) => {
    setOpenStackId(null)
    const content = contents.find((item) => item.id === info.draggedEl.dataset.planningDragId)
    if (!content) return
    const policy = getPlanningDragPolicy(content.status, canPublishDirect)
    if (!policy.draggable) return
    const previousAt = planningCalendarEventDate(content)
    const proposed = new Date(info.date)
    // A month cell is a whole day: keep the post's time, like dragging a single event.
    if (info.allDay) {
      const previous = new Date(previousAt)
      proposed.setHours(previous.getHours(), previous.getMinutes(), 0, 0)
    }
    const proposedAt = proposed.toISOString()
    if (proposed.getTime() === new Date(previousAt).getTime()) return
    // Nothing moved on the calendar yet, so there is nothing to revert.
    const revert = () => undefined
    if (policy.requiresConfirmation) {
      setPendingReschedule({ content, previousAt, proposedAt, revert })
      return
    }
    void persistReschedule(content, proposedAt, revert)
  }

  const closeRescheduleConfirmation = () => {
    pendingReschedule?.revert()
    setPendingReschedule(null)
  }

  const confirmReschedule = async () => {
    if (!pendingReschedule) return
    const current = pendingReschedule
    await persistReschedule(current.content, current.proposedAt, current.revert)
    setPendingReschedule(null)
  }

  const handleDatesSet = (info: DatesSetArg) => {
    const currentDate = info.view.calendar.getDate()
    const nextHeading = createCalendarHeading(info, currentDate, i18n.resolvedLanguage)
    setCalendarHeading((currentHeading) =>
      isSameCalendarHeading(currentHeading, nextHeading) ? currentHeading : nextHeading,
    )
    const currentDateKey = toDateKey(currentDate)
    if (currentDateKey !== selectedDate) onDateChange(currentDateKey)
  }

  const handleDatePick = (date: string) => {
    if (!date) return
    calendarRef.current?.getApi().gotoDate(date)
    onDateChange(date)
  }

  const mountCreateButton = useCallback(
    (info: DayCellMountArg) => {
      const isMonthView = info.view.type === 'dayGridMonth'
      const isWeekView = info.view.type === 'timeGridWeek'
      if (
        !createPlatform ||
        (!isMonthView && !isWeekView) ||
        toDateKey(info.date) < toDateKey(new Date())
      ) {
        return
      }

      const dayFrame = info.el.querySelector<HTMLElement>(
        isMonthView ? '.fc-daygrid-day-frame' : '.fc-timegrid-col-frame',
      )
      if (!dayFrame || createButtonRoots.current.has(info.el)) return

      const date = toDateKey(info.date)
      const label = t('calendar.createPost', {
        date: formatLocalizedDate(info.date, i18n.resolvedLanguage, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      })
      const container = document.createElement('div')
      container.className = `planning-calendar__create-action planning-calendar__create-action--${isMonthView ? 'month' : 'week'}`
      dayFrame.appendChild(container)

      if (isWeekView) {
        const timeGridBody = info.el.closest<HTMLElement>('.fc-timegrid-body')
        if (timeGridBody) {
          const updateHoveredColumn = (event: PointerEvent) => {
            const bounds = info.el.getBoundingClientRect()
            const isHovered = event.clientX >= bounds.left && event.clientX <= bounds.right
            container.classList.toggle('is-hovered', isHovered)
          }
          const clearHoveredColumn = () => container.classList.remove('is-hovered')

          timeGridBody.addEventListener('pointermove', updateHoveredColumn)
          timeGridBody.addEventListener('pointerleave', clearHoveredColumn)
          createButtonCleanups.current.set(info.el, () => {
            timeGridBody.removeEventListener('pointermove', updateHoveredColumn)
            timeGridBody.removeEventListener('pointerleave', clearHoveredColumn)
          })
        }
      }

      const root = createRoot(container)
      createButtonRoots.current.set(info.el, root)
      root.render(
        <CalendarCreateMenu
          date={date}
          dayFrame={dayFrame}
          label={label}
          mode={isMonthView ? 'month' : 'week'}
          platform={createPlatform}
          onSelect={onCreatePost}
        />,
      )
    },
    [createPlatform, i18n.resolvedLanguage, onCreatePost, t],
  )

  const unmountCreateButton = useCallback((info: DayCellMountArg) => {
    createButtonCleanups.current.get(info.el)?.()
    createButtonCleanups.current.delete(info.el)
    const root = createButtonRoots.current.get(info.el)
    if (!root) return
    root.unmount()
    createButtonRoots.current.delete(info.el)
  }, [])

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-xs">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border-subtle p-4 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-16 w-16 shrink-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-surface shadow-xs sm:flex">
            <span className="flex h-6 w-full items-center justify-center bg-bg-surface-muted text-micro font-medium uppercase text-text-tertiary">
              {calendarHeading.month}
            </span>
            <strong className="flex flex-1 items-center justify-center text-heading-2 tabular-nums text-platform-facebook">
              {calendarHeading.day}
            </strong>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-heading-3 text-text-primary">{calendarHeading.title}</h2>
              <span className="rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-caption text-text-secondary">
                {t('calendar.weekNumber', { week: calendarHeading.week })}
              </span>
            </div>
            <p className="mt-1 truncate text-body-sm text-text-tertiary">
              {calendarHeading.range} · {t('calendar.timeZone', { timeZone })}
            </p>
          </div>
        </div>
        {/* The date control takes what the view picker leaves, so it never runs off a phone. */}
        <div className="flex w-full min-w-0 items-center gap-2 xl:w-auto xl:shrink-0">
          <div className="flex min-w-0 flex-1 items-center xl:flex-none">
            <Button
              icon={<IconChevronLeft />}
              aria-label={t('calendar.previous')}
              className="rounded-e-none"
              onClick={() => calendarRef.current?.getApi().prev()}
            />
            <DatePicker
              value={selectedDate}
              displayValue={
                (phone ? calendarHeading.shortRange : calendarHeading.range) || t('calendar.today')
              }
              aria-label={t('calendar.selectDate')}
              suffixIcon={null}
              className="-ms-px z-1 w-auto min-w-0 flex-1 rounded-none xl:w-[270px] xl:flex-none"
              onChange={handleDatePick}
            />
            <Button
              icon={<IconChevronRight />}
              aria-label={t('calendar.next')}
              className="-ms-px rounded-s-none"
              onClick={() => calendarRef.current?.getApi().next()}
            />
          </div>
          <Select
            aria-label={t('calendar.view')}
            value={calendarView}
            showSearch={false}
            className="w-[6.5rem] shrink-0 sm:w-[11.5rem]"
            onChange={(event) => onCalendarViewChange(event.target.value as PlanningCalendarView)}
            options={[
              { value: 'month', label: t(phone ? 'calendar.monthShort' : 'calendar.month') },
              { value: 'week', label: t(phone ? 'calendar.weekShort' : 'calendar.week') },
            ]}
          />
        </div>
      </div>

      <div
        className={`planning-calendar app-scrollbar min-h-0 flex-1 overflow-auto ${compactMonth ? 'planning-calendar--compact' : ''}`}
      >
        <FullCalendar
          key={createPlatform ?? 'read-only'}
          ref={calendarRef}
          plugins={FULL_CALENDAR_PLUGINS}
          locales={[viLocale]}
          locale={i18n.resolvedLanguage?.startsWith('vi') ? 'vi' : 'en'}
          initialView={fullCalendarView}
          initialDate={selectedDate}
          headerToolbar={false}
          firstDay={1}
          height="100%"
          stickyHeaderDates
          nowIndicator
          allDaySlot={false}
          editable
          eventDurationEditable={false}
          dayMaxEvents={compactMonth ? 2 : 3}
          dayHeaderFormat={compactMonth ? { weekday: 'narrow' } : undefined}
          eventMaxStack={2}
          slotEventOverlap={false}
          moreLinkClick="popover"
          events={events}
          eventTimeFormat={{
            hour: uses12HourClock ? 'numeric' : '2-digit',
            minute: '2-digit',
            hour12: uses12HourClock,
          }}
          moreLinkContent={(args) =>
            compactMonth ? `+${args.num}` : t('calendar.more', { count: args.num })
          }
          eventAllow={(_, event) => {
            if (!event) return false
            const { contents } = event.extendedProps as PlanningEventProperties
            return (
              contents.length === 1 &&
              getPlanningDragPolicy(contents[0].status, canPublishDirect).draggable
            )
          }}
          eventContent={(args: EventContentArg) => {
            const { contents } = args.event.extendedProps as PlanningEventProperties
            if (contents.length > 1) {
              return (
                <PlanningCalendarStack
                  contents={contents}
                  timeText={args.timeText}
                  open={openStackId === args.event.id}
                  formatTime={formatEventTime}
                  canDrag={(content) =>
                    getPlanningDragPolicy(content.status, canPublishDirect).draggable
                  }
                  onClose={() => setOpenStackId(null)}
                  onSelectContent={onSelectContent}
                />
              )
            }
            return <PlanningCalendarEvent content={contents[0]} timeText={args.timeText} />
          }}
          eventClick={(args: EventClickArg) => {
            const { contents } = args.event.extendedProps as PlanningEventProperties
            if (contents.length > 1) setOpenStackId(args.event.id)
            else onSelectContent(contents[0])
          }}
          eventDrop={handleEventDrop}
          droppable
          dropAccept="[data-planning-drag-id]"
          drop={handleStackItemDrop}
          datesSet={handleDatesSet}
          dayCellDidMount={mountCreateButton}
          dayCellWillUnmount={unmountCreateButton}
        />
      </div>

      <Modal
        open={Boolean(pendingReschedule)}
        title={t('reschedule.title')}
        onClose={closeRescheduleConfirmation}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={closeRescheduleConfirmation}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={reschedule.isPending}
              onClick={() => void confirmReschedule()}
            >
              {t('reschedule.confirm')}
            </Button>
          </div>
        }
      >
        {pendingReschedule ? (
          <div className="grid gap-3 text-body-sm text-text-secondary">
            <p>
              {pendingReschedule.content.title ?? toPlainCaption(pendingReschedule.content.caption)}
            </p>
            <p>
              {t('reschedule.change', {
                previous: formatDateTime(pendingReschedule.previousAt, i18n.resolvedLanguage),
                next: formatDateTime(pendingReschedule.proposedAt, i18n.resolvedLanguage),
                timeZone,
              })}
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}

function CalendarCreateMenu({
  date,
  dayFrame,
  label,
  mode,
  platform,
  onSelect,
}: {
  date: string
  dayFrame: HTMLElement
  label: string
  mode: 'month' | 'week'
  platform: PlanningPlatform
  onSelect: (date: string, postType: PlanningPostType) => void
}) {
  const { t } = useTranslation('planning')
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const isToday = date === toDateKey(new Date())

  const cancelClose = useCallback(() => {
    if (closeTimer.current === null) return
    window.clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])

  const closeMenu = useCallback(() => {
    cancelClose()
    setOpen(false)
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && dayFrame.contains(activeElement)) {
      activeElement.blur()
    }
  }, [cancelClose, dayFrame])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = window.setTimeout(closeMenu, 10)
  }, [cancelClose, closeMenu])

  useEffect(() => {
    dayFrame.addEventListener('mouseenter', cancelClose)
    dayFrame.addEventListener('mouseleave', scheduleClose)
    return () => {
      cancelClose()
      dayFrame.removeEventListener('mouseenter', cancelClose)
      dayFrame.removeEventListener('mouseleave', scheduleClose)
    }
  }, [cancelClose, dayFrame, scheduleClose])

  useEffect(() => {
    if (!open) return

    const trackOpenMenuPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      if (dayFrame.contains(target) || target.closest('.planning-calendar__create-popup')) {
        cancelClose()
        return
      }

      scheduleClose()
    }

    document.addEventListener('pointermove', trackOpenMenuPointer)
    return () => document.removeEventListener('pointermove', trackOpenMenuPointer)
  }, [cancelClose, dayFrame, open, scheduleClose])

  const items =
    platform === 'facebook'
      ? [
          {
            key: 'facebook_feed',
            label: t(isToday ? 'calendar.createFacebookFeed' : 'calendar.scheduleFacebookFeed'),
            icon: <IconPost aria-hidden />,
          },
          {
            key: 'facebook_story',
            label: t(isToday ? 'calendar.createFacebookStory' : 'calendar.scheduleFacebookStory'),
            icon: <IconMobile aria-hidden />,
          },
          {
            key: 'facebook_reel',
            label: t(isToday ? 'calendar.createFacebookReel' : 'calendar.scheduleFacebookReel'),
            icon: <IconReel aria-hidden />,
          },
        ]
      : [
          {
            key: 'tiktok_video',
            label: t(isToday ? 'calendar.createTikTokVideo' : 'calendar.scheduleTikTokVideo'),
            icon: <IconVideo aria-hidden />,
          },
          {
            key: 'tiktok_photo',
            label: t(isToday ? 'calendar.createTikTokPhoto' : 'calendar.scheduleTikTokPhoto'),
            icon: <IconImage aria-hidden />,
          },
        ]

  return (
    <Dropdown
      placement="bottomLeft"
      items={items}
      open={open}
      onOpenChange={setOpen}
      popupClassName="planning-calendar__create-popup"
      onPopupMouseEnter={cancelClose}
      onPopupMouseLeave={scheduleClose}
      onSelect={(postType) => {
        closeMenu()
        onSelect(date, postType as PlanningPostType)
      }}
    >
      {mode === 'month' ? (
        <Button
          size="sm"
          icon={<IconPlus aria-hidden />}
          aria-label={label}
          title={label}
          className="planning-calendar__create-button"
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <Button
          aria-label={label}
          title={label}
          className={`planning-calendar__create-button planning-calendar__create-button--week ${open ? 'border-border-focus text-action-text ring-2 ring-brand-100' : ''}`}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="flex w-full items-center justify-between gap-2">
            <span>{t('calendar.schedule')}</span>
            <IconChevronDown aria-hidden className="text-icon-sm" />
          </span>
        </Button>
      )}
    </Dropdown>
  )
}

function isSameCalendarHeading(current: CalendarHeading, next: CalendarHeading) {
  return (
    current.title === next.title &&
    current.range === next.range &&
    current.shortRange === next.shortRange &&
    current.month === next.month &&
    current.day === next.day &&
    current.week === next.week
  )
}

function createCalendarHeading(
  info: DatesSetArg,
  currentDate: Date,
  locale?: string,
): CalendarHeading {
  const rangeEnd = new Date(info.view.currentEnd.getTime() - 1)
  const rangeFormatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  const shortRangeOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const month = formatLocalizedDate(currentDate, locale, { month: 'short' })
    .replace('.', '')
    .toUpperCase()

  return {
    title: info.view.title,
    range: `${formatLocalizedDate(info.view.currentStart, locale, rangeFormatOptions)} – ${formatLocalizedDate(rangeEnd, locale, rangeFormatOptions)}`,
    shortRange:
      info.view.type === 'dayGridMonth'
        ? formatLocalizedDate(currentDate, locale, { month: 'short', year: 'numeric' })
        : formatLocalizedDateRange(info.view.currentStart, rangeEnd, locale, shortRangeOptions),
    month,
    day: String(currentDate.getDate()),
    week: getIsoWeek(currentDate),
  }
}

function getIsoWeek(date: Date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
