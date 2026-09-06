import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  DatesSetArg,
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
  IconChevronLeft,
  IconChevronRight,
  Modal,
  Select,
} from '@/shared/ui'
import { useReschedulePlanningContent, type PlanningContent } from '../api'
import type { PlanningCalendarView } from '../config/planning.filters'
import { getPlanningDragPolicy } from '../model'
import { PlanningCalendarEvent } from './PlanningCalendarEvent'
import './planning-calendar.css'

type PendingReschedule = {
  content: PlanningContent
  previousAt: string
  proposedAt: string
  revert: () => void
}

type PlanningEventProperties = {
  content: PlanningContent
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
  calendarView,
  selectedDate,
  onCalendarViewChange,
  onDateChange,
  onSelectContent,
}: {
  brandId: string
  contents: PlanningContent[]
  calendarView: PlanningCalendarView
  selectedDate: string
  onCalendarViewChange: (view: PlanningCalendarView) => void
  onDateChange: (date: string) => void
  onSelectContent: (content: PlanningContent) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const calendarRef = useRef<FullCalendar | null>(null)
  const reschedule = useReschedulePlanningContent(brandId)
  const [calendarHeading, setCalendarHeading] = useState<CalendarHeading>({
    title: '',
    range: '',
    month: '',
    day: '',
    week: 0,
  })
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null)
  const [hasRescheduleError, setHasRescheduleError] = useState(false)
  const fullCalendarView = calendarView === 'month' ? 'dayGridMonth' : 'timeGridWeek'
  const uses12HourClock = uses12HourTime(i18n.resolvedLanguage)
  const timeZone = getLocalTimeZone()
  const events = useMemo<EventInput[]>(
    () =>
      contents.flatMap((content) => {
        if (!content.scheduledAt) return []
        const policy = getPlanningDragPolicy(content.status)
        return [
          {
            id: content.id,
            title: content.title ?? content.caption,
            start: content.scheduledAt,
            editable: policy.draggable,
            durationEditable: false,
            extendedProps: { content } satisfies PlanningEventProperties,
          },
        ]
      }),
    [contents],
  )

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
    setHasRescheduleError(false)
    try {
      await reschedule.mutateAsync({ brandId, contentId: content.id, scheduledAt: proposedAt })
    } catch {
      revert()
      setHasRescheduleError(true)
    }
  }

  const handleEventDrop = (info: EventDropArg) => {
    const { content } = info.event.extendedProps as PlanningEventProperties
    const proposedAt = info.event.start?.toISOString()
    if (!proposedAt) {
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
              className="-ms-px w-[260px] rounded-none z-1"
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

      {hasRescheduleError ? (
        <div className="p-4 pb-0">
          <Alert
            tone="error"
            title={t('reschedule.error')}
            closable
            onClose={() => setHasRescheduleError(false)}
          />
        </div>
      ) : null}

      <div className="planning-calendar app-scrollbar min-h-0 flex-1 overflow-auto">
        <FullCalendar
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
            const { content } = event.extendedProps as PlanningEventProperties
            return getPlanningDragPolicy(content.status).draggable
          }}
          eventContent={(args: EventContentArg) => {
            const { content } = args.event.extendedProps as PlanningEventProperties
            return <PlanningCalendarEvent content={content} timeText={args.timeText} />
          }}
          eventClick={(args: EventClickArg) => {
            const { content } = args.event.extendedProps as PlanningEventProperties
            onSelectContent(content)
          }}
          eventDrop={handleEventDrop}
          datesSet={handleDatesSet}
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
