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
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useTranslation } from 'react-i18next'
import {
  formatDateTime,
  formatLocalizedDate,
  getLocalTimeZone,
  uses12HourTime,
} from '@/shared/i18n'
import {
  Alert,
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
import { useApiErrorMessage } from '@/shared/hooks'

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
  const [calendarHeading, setCalendarHeading] = useState<CalendarHeading>({
    title: '',
    range: '',
    month: '',
    day: '',
    week: 0,
  })
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null)
  const [rescheduleError, setRescheduleError] = useState<unknown>(null)
  const [openStackId, setOpenStackId] = useState<string | null>(null)
  const fullCalendarView = calendarView === 'month' ? 'dayGridMonth' : 'timeGridWeek'
  const uses12HourClock = uses12HourTime(i18n.resolvedLanguage)
  const timeZone = getLocalTimeZone()
  const events = useMemo<EventInput[]>(
    () =>
      groupPlanningCalendarContents(contents, calendarView).map((group) => {
        const [content] = group
        const isStack = group.length > 1
        return {
          id: isStack ? `stack:${content.id}` : content.id,
          title: content.title ?? content.caption,
          start: planningCalendarEventDate(content),
          // A stack opens its list on click; its posts are rescheduled one by one from the post.
          editable: !isStack && getPlanningDragPolicy(content.status).draggable,
          durationEditable: false,
          extendedProps: { contents: group } satisfies PlanningEventProperties,
        }
      }),
    [calendarView, contents],
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
    setRescheduleError(null)
    try {
      await reschedule.mutateAsync({ brandId, contentId: content.id, scheduledAt: proposedAt })
    } catch (error) {
      revert()
      setRescheduleError(error)
    }
  }

  const handleEventDrop = (info: EventDropArg) => {
    const [content] = (info.event.extendedProps as PlanningEventProperties).contents
    const proposedAt = info.event.start?.toISOString()
    if (!content || !proposedAt) {
      info.revert()
      return
    }

    const policy = getPlanningDragPolicy(content.status)
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
      <div className="flex shrink-0 flex-col gap-4 border-b border-border-subtle p-4 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <Button
              icon={<IconChevronLeft />}
              aria-label={t('calendar.previous')}
              className="rounded-e-none"
              onClick={() => calendarRef.current?.getApi().prev()}
            />
            <DatePicker
              value={selectedDate}
              displayValue={calendarHeading.range || t('calendar.today')}
              aria-label={t('calendar.selectDate')}
              suffixIcon={null}
              className="-ms-px w-[270px] rounded-none z-1"
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
            className="min-w-40"
            onChange={(event) => onCalendarViewChange(event.target.value as PlanningCalendarView)}
            options={[
              { value: 'month', label: t('calendar.month') },
              { value: 'week', label: t('calendar.week') },
            ]}
          />
        </div>
      </div>

      {rescheduleError ? (
        <div className="p-4 pb-0">
          <Alert
            variant="soft"
            tone="error"
            title={errorMessage(rescheduleError, t('reschedule.error'))}
            closable
            onClose={() => setRescheduleError(null)}
          />
        </div>
      ) : null}

      <div className="planning-calendar app-scrollbar min-h-0 flex-1 overflow-auto">
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
          dayMaxEvents={3}
          eventMaxStack={2}
          slotEventOverlap={false}
          moreLinkClick="popover"
          events={events}
          eventTimeFormat={{
            hour: uses12HourClock ? 'numeric' : '2-digit',
            minute: '2-digit',
            hour12: uses12HourClock,
          }}
          moreLinkContent={(args) => t('calendar.more', { count: args.num })}
          eventAllow={(_, event) => {
            if (!event) return false
            const { contents } = event.extendedProps as PlanningEventProperties
            return contents.length === 1 && getPlanningDragPolicy(contents[0].status).draggable
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
            <p>{pendingReschedule.content.title ?? pendingReschedule.content.caption}</p>
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
  const month = formatLocalizedDate(currentDate, locale, { month: 'short' })
    .replace('.', '')
    .toUpperCase()

  return {
    title: info.view.title,
    range: `${formatLocalizedDate(info.view.currentStart, locale, rangeFormatOptions)} – ${formatLocalizedDate(rangeEnd, locale, rangeFormatOptions)}`,
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
