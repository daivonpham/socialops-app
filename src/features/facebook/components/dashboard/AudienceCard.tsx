import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCityLabel, formatCountryLabel, type AppLocale } from '@/shared/i18n'
import { Progress } from '@/shared/ui'
import type { FacebookDashboardDto } from '../../api'
import { DashboardCard } from './DashboardCard'
import { formatNumberText } from './format'

/** Rows shown before "show more". */
const COLLAPSED_ROWS = 5

export function AudienceCard({
  audience,
  className,
}: {
  audience: FacebookDashboardDto['audience']
  className?: string
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  // One switch opens both lists, so countries and cities stay side by side.
  const [expanded, setExpanded] = useState(false)
  const hasMore =
    audience.countries.length > COLLAPSED_ROWS || audience.cities.length > COLLAPSED_ROWS
  const label = (value: string, kind: 'countries' | 'cities') =>
    value === 'other'
      ? t('dashboard.audience.other')
      : kind === 'countries'
        ? formatCountryLabel(value, locale)
        : formatCityLabel(value, locale)

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.audience.title')}
      description={t('dashboard.audience.description')}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {(['countries', 'cities'] as const).map((kind) => {
          const rows = audience[kind]
          const shown = expanded ? rows : rows.slice(0, COLLAPSED_ROWS)
          return (
            <div key={kind} className="grid content-start gap-3">
              <h3 className="text-label-md text-text-secondary">
                {t(`dashboard.audience.${kind}`)}
              </h3>
              {rows.length ? (
                <ol className="grid gap-3">
                  {shown.map((item, index) => (
                    <li key={item.label} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-bg-surface-muted text-caption text-text-tertiary">
                        {index + 1}
                      </span>
                      <span className="grid gap-1">
                        <span className="flex items-center justify-between gap-2 text-body-sm">
                          <span className="truncate text-text-primary">
                            {label(item.label, kind)}
                          </span>
                          <span className="shrink-0 tabular-nums text-text-secondary">
                            {formatNumberText(item.value, locale, item.value % 1 ? 1 : 0)}%
                          </span>
                        </span>
                        <Progress
                          percent={item.value}
                          tone={item.label === 'other' ? 'muted' : 'primary'}
                          ariaLabel={label(item.label, kind)}
                        />
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-body-sm text-text-tertiary">
                  {t('dashboard.audience.unavailable')}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {hasMore ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="justify-self-start text-label-md text-link underline underline-offset-4 hover:text-link-hover focus-visible:focus-ring"
        >
          {expanded ? t('dashboard.audience.showLess') : t('dashboard.audience.showMore')}
        </button>
      ) : null}
    </DashboardCard>
  )
}
