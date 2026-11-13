import { useTranslation } from 'react-i18next'
import { formatDate, formatNumber, type AppLocale } from '@/shared/i18n'
import { SectionError, Spin } from '@/shared/ui'
import type { WorkspaceAiCredits } from '../api'

/** The Workspace's Credits as a whole. Nothing here shows what one member used. */
export function WorkspaceCreditsSummary({
  query,
}: {
  query: {
    data?: WorkspaceAiCredits
    isPending: boolean
    isError: boolean
    refetch: () => unknown
  }
}) {
  const { t, i18n } = useTranslation('workspaces')
  if (query.isPending) return <Spin />
  if (query.isError || !query.data)
    return (
      <SectionError
        title={t('members.credits.loadError')}
        retryLabel={t('members.credits.retry')}
        onRetry={() => void query.refetch()}
      />
    )
  const { monthlyCredits, remaining, resetsAt } = query.data
  const amount = (value: number | null) =>
    value === null
      ? t('members.credits.unlimited')
      : formatNumber(value, i18n.language as AppLocale)
  const items = [
    { label: t('members.credits.total'), value: amount(monthlyCredits) },
    { label: t('members.credits.remaining'), value: amount(remaining) },
    { label: t('members.credits.resets'), value: formatDate(resetsAt, i18n.language) },
  ]
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs"
        >
          <dt className="text-label-sm text-text-tertiary">{item.label}</dt>
          <dd className="mt-1 text-heading-3 text-text-primary tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
