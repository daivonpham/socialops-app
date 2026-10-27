import { useTranslation } from 'react-i18next'
import {
  Button,
  Dropdown,
  IconChevronDown,
  IconDownload,
  IconFile,
  IconFileText,
  IconGrid,
  IconTable,
} from '@/shared/ui'

export type ExportFormat = 'xlsx' | 'zip' | 'pdf' | 'sheets'

/**
 * One export button: Excel (one sheet per table), every table as CSV files in a ZIP (a CSV
 * file can only hold one table), the designed PDF report, and a Google Sheets file in the
 * user's Drive.
 */
export function ReportExportMenu({
  disabled,
  loading,
  onExport,
}: {
  disabled: boolean
  loading: boolean
  onExport: (format: ExportFormat) => void
}) {
  const { t } = useTranslation('reports')
  return (
    <Dropdown
      placement="bottomRight"
      onSelect={(key) => onExport(key as ExportFormat)}
      items={[
        { key: 'xlsx', label: t('preview.excel'), icon: <IconTable aria-hidden /> },
        { key: 'zip', label: t('preview.csv'), icon: <IconFileText aria-hidden /> },
        { type: 'divider' as const },
        { key: 'pdf', label: t('preview.pdf'), icon: <IconFile aria-hidden /> },
        { key: 'sheets', label: t('preview.sheets'), icon: <IconGrid aria-hidden /> },
      ]}
    >
      <Button disabled={disabled} loading={loading} icon={<IconDownload aria-hidden />}>
        <span className="flex items-center gap-2">
          {t('preview.export')}
          <IconChevronDown aria-hidden className="text-icon-sm" />
        </span>
      </Button>
    </Dropdown>
  )
}
