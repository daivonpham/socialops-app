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

export type CsvTable =
  | 'kpis'
  | 'daily'
  | 'trends'
  | 'pages'
  | 'top_pages'
  | 'audience_countries'
  | 'audience_cities'
  | 'content_mix'
  | 'top_posts'
  | 'bottom_posts'
  | 'posts'
  | 'best_times'
  | 'publishing_summary'
  | 'publishing'

export type ExportFormat = 'xlsx' | 'zip' | 'csv'

/**
 * One export button: Excel (one sheet per table), every table as CSV files in a ZIP, a single
 * table as CSV, and the formats that are not ready yet. A CSV file can only hold one table.
 */
export function ReportExportMenu({
  disabled,
  loading,
  tables,
  onExport,
}: {
  disabled: boolean
  loading: boolean
  tables: CsvTable[]
  onExport: (format: ExportFormat, table?: CsvTable) => void
}) {
  const { t } = useTranslation('reports')
  return (
    <Dropdown
      placement="bottomRight"
      onSelect={(key) => {
        if (key === 'xlsx' || key === 'zip') onExport(key)
        else if (key.startsWith('csv:')) onExport('csv', key.slice(4) as CsvTable)
      }}
      items={[
        { key: 'xlsx', label: t('preview.excel'), icon: <IconTable aria-hidden /> },
        { key: 'zip', label: t('preview.csvAll'), icon: <IconFileText aria-hidden /> },
        { type: 'divider' as const },
        ...tables.map((table) => ({
          key: `csv:${table}`,
          label: t('preview.csv', { table: t(`tables.${table}`) }),
          icon: <IconFileText aria-hidden />,
        })),
        { type: 'divider' as const },
        {
          key: 'pdf',
          label: `${t('preview.pdf')} · ${t('preview.comingSoon')}`,
          icon: <IconFile aria-hidden />,
          disabled: true,
        },
        {
          key: 'sheets',
          label: `${t('preview.sheets')} · ${t('preview.comingSoon')}`,
          icon: <IconGrid aria-hidden />,
          disabled: true,
        },
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
