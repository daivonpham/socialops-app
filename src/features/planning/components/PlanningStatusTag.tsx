import { useTranslation } from 'react-i18next'
import { formatDateTime, type AppLocale } from '@/shared/i18n'
import { StatusTag } from '@/shared/ui'
import type { PlanningContent } from '../api'
import { pendingApprovalIntent } from '../model'
import { planningStatusGroup, planningSummaryStatusTone } from '../model/planning-status-group'

/**
 * Post status. Content waiting for approval shows how it will go out once approved (now, or
 * at its scheduled time) so the approver sees it at a glance.
 */
export function PlanningStatusTag({
  content,
  showTime = false,
}: {
  content: PlanningContent
  /** Show the requested publish time under a scheduled post waiting for approval. */
  showTime?: boolean
}) {
  const { t, i18n } = useTranslation('planning')
  const pending = pendingApprovalIntent(content)
  if (!pending) {
    const group = planningStatusGroup(content)
    return (
      <StatusTag tone={planningSummaryStatusTone(group)}>{t(`statusGroup.${group}`)}</StatusTag>
    )
  }
  return (
    <span className="grid gap-1">
      <StatusTag tone="warning">{t(`pendingIntent.${pending}`)}</StatusTag>
      {showTime && pending === 'schedule' && content.scheduledAt ? (
        <span className="text-caption tabular-nums text-text-secondary">
          {formatDateTime(content.scheduledAt, i18n.resolvedLanguage as AppLocale)}
        </span>
      ) : null}
    </span>
  )
}
