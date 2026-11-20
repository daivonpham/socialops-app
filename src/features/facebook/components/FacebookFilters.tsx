import { useTranslation } from 'react-i18next'
import { AnalyticsFilters } from '@/shared/ui'
import { FACEBOOK_POST_CONTENT_TYPES, type DateRange, type FacebookPostContentType } from '../api'

export function FacebookFilters({
  range,
  since,
  until,
  compare,
  contentType,
  onChange,
}: {
  range: DateRange
  since?: string
  until?: string
  compare: string
  /** Lists posts rather than statistics: the filter offers the content type, not a comparison. */
  contentType?: FacebookPostContentType
  onChange: (patch: {
    range?: string
    since?: string
    until?: string
    compare?: string
    contentType?: string
  }) => void
}) {
  const { t } = useTranslation('facebook')

  return (
    // "Last N days" are the N whole days before today, as Facebook counts them: today is not over.
    <AnalyticsFilters
      range={range}
      since={since}
      until={until}
      compare={compare}
      onChange={onChange}
      contentType={
        contentType
          ? {
              value: contentType,
              label: t('overview.filterContentType'),
              options: FACEBOOK_POST_CONTENT_TYPES.map((value) => ({
                value,
                label: t(`overview.contentKind.${value}`),
              })),
            }
          : undefined
      }
    />
  )
}
