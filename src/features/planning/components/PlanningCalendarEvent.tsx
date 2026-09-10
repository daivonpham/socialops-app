import { useTranslation } from 'react-i18next'
import { IconFacebook, IconImage, IconTikTok, Tooltip } from '@/shared/ui'
import type { PlanningContent, PlanningStatus } from '../api'

const STATUS_CLASS: Record<PlanningStatus, string> = {
  draft: 'border-border-subtle bg-bg-surface-subtle',
  scheduled: 'border-info-100 bg-info-50',
  publishing: 'border-warning-100 bg-warning-50',
  published: 'border-success-100 bg-success-50',
  failed: 'border-error-100 bg-error-50',
}

export function PlanningCalendarEvent({
  content,
  timeText,
}: {
  content: PlanningContent
  timeText: string
}) {
  const { t } = useTranslation('planning')
  const label = t('calendar.eventLabel', {
    time: timeText,
    platform: t(`platform.${content.platform}`),
    caption: content.title ?? content.caption,
    status: t(`status.${content.status}`),
    count: content.targets.length,
  })

  return (
    <Tooltip title={content.caption} placement="top">
      <div
        aria-label={label}
        className={`planning-calendar-event min-w-0 rounded-md border px-2 py-1 shadow-xs transition-shadow duration-fast hover:shadow-md ${STATUS_CLASS[content.status]}`}
      >
        <div className="planning-calendar-event__primary flex min-w-0 items-center gap-2">
          {content.thumbnailUrl ? (
            <img
              src={content.thumbnailUrl}
              alt=""
              loading="lazy"
              className="h-5 w-5 shrink-0 rounded-sm object-cover"
            />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-bg-surface-muted text-text-tertiary">
              <IconImage />
            </span>
          )}
          <strong className="min-w-0 flex-1 truncate text-caption font-medium text-text-primary">
            {content.title ?? content.caption}
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
          <span className="truncate">{t(`status.${content.status}`)}</span>
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
    </Tooltip>
  )
}
