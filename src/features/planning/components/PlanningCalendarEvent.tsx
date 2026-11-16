import { useTranslation } from 'react-i18next'
import { toPlainCaption } from '@/shared/lib/plainCaption'
import { IconFacebook, IconTikTok, MarkdownText, Tooltip } from '@/shared/ui'
import type { PlanningContent } from '../api'
import { pendingApprovalIntent } from '../model/approval'
import { planningStatusGroup, type PlanningSummaryStatus } from '../model/planning-status-group'
import { PlanningMediaThumbnail } from './PlanningMediaThumbnail'

export const PLANNING_EVENT_STATUS_CLASS: Record<PlanningSummaryStatus, string> = {
  draft: 'border-border-subtle bg-bg-surface-subtle',
  pending_approval: 'border-warning-100 bg-warning-50',
  scheduled: 'border-info-100 bg-info-50',
  in_progress: 'border-info-100 bg-info-50',
  published: 'border-success-100 bg-success-50',
  needs_action: 'border-error-100 bg-error-50',
  deleted: 'border-border-subtle bg-bg-surface-subtle',
}

export function PlanningCalendarEvent({
  content,
  timeText,
  tooltip = true,
}: {
  content: PlanningContent
  timeText: string
  tooltip?: boolean
}) {
  const { t } = useTranslation('planning')
  const summaryStatus = planningStatusGroup(content)
  // Waiting for approval reads as how the post will go out once approved.
  const pending = pendingApprovalIntent(content)
  const statusLabel = pending ? t(`pendingIntent.${pending}`) : t(`statusGroup.${summaryStatus}`)
  const label = t('calendar.eventLabel', {
    time: timeText,
    platform: t(`platform.${content.platform}`),
    caption: content.title ?? toPlainCaption(content.caption),
    status: statusLabel,
    count: content.targets.length,
  })

  const card = (
    <div
      aria-label={label}
      className={`planning-calendar-event min-w-0 rounded-md border px-2 py-1 shadow-xs transition-shadow duration-fast hover:shadow-md ${PLANNING_EVENT_STATUS_CLASS[summaryStatus]}`}
    >
      <div className="planning-calendar-event__primary flex min-w-0 items-center gap-2">
        <PlanningMediaThumbnail content={content} className="h-5 w-5 shrink-0 rounded-sm" />
        <strong className="min-w-0 flex-1 truncate text-caption font-medium text-text-primary">
          {content.title ?? toPlainCaption(content.caption)}
        </strong>
        <span className="shrink-0 text-caption tabular-nums text-text-secondary">{timeText}</span>
      </div>
      <div className="planning-calendar-event__meta mt-1 flex min-w-0 items-center gap-1 text-caption text-text-tertiary">
        <span className="flex shrink-0 text-platform-facebook">
          {content.platform === 'facebook' ? (
            <IconFacebook aria-label={t('platform.facebook')} />
          ) : (
            <IconTikTok aria-label={t('platform.tiktok')} className="text-text-primary" />
          )}
        </span>
        <span className="truncate">{statusLabel}</span>
        <span aria-hidden>·</span>
        <span className="truncate">
          {t(
            content.platform === 'facebook'
              ? 'calendar.facebookTargetCount'
              : 'calendar.tiktokTargetCount',
            { count: content.targets.length },
          )}
        </span>
      </div>
    </div>
  )

  return tooltip ? (
    <Tooltip
      // A preview only: the full caption is one click away, in the post details.
      title={<MarkdownText className="line-clamp-3">{content.caption}</MarkdownText>}
      placement="top"
    >
      {card}
    </Tooltip>
  ) : (
    card
  )
}
