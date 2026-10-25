import { useTranslation } from 'react-i18next'
import type { FacebookIntegrationDto } from '@/features/facebook'
import { Avatar, Checkbox } from '@/shared/ui'

type FacebookPage = FacebookIntegrationDto['pages'][number]

/** "All Pages" or a hand-picked subset of the Pages the member can see. */
export function ReportPagesPicker({
  pages,
  value,
  onChange,
}: {
  pages: FacebookPage[]
  value: 'all' | string[]
  onChange: (value: 'all' | string[]) => void
}) {
  const { t } = useTranslation('reports')
  const selected = value === 'all' ? pages.map((page) => page.id) : value
  const toggle = (pageId: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...selected, pageId])]
      : selected.filter((id) => id !== pageId)
    onChange(next.length === pages.length ? 'all' : next)
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-label-md text-text-secondary">{t('details.pages')}</legend>
      {pages.length ? (
        <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <div className="bg-bg-surface-subtle px-4 py-3">
            <Checkbox
              checked={value === 'all'}
              indeterminate={value !== 'all' && selected.length > 0}
              onChange={(event) => onChange(event.target.checked ? 'all' : [])}
            >
              <span className="text-label-md text-text-primary">
                {t('details.allPages', { count: pages.length })}
              </span>
            </Checkbox>
          </div>
          <div className="app-scrollbar max-h-[224px] overflow-y-auto">
            {pages.map((page) => (
              <div key={page.id} className="px-4 py-3">
                <Checkbox
                  checked={selected.includes(page.id)}
                  onChange={(event) => toggle(page.id, event.target.checked)}
                >
                  <span className="flex items-center gap-3">
                    <Avatar name={page.name} src={page.avatarUrl} size="xs" />
                    <span className="text-body-sm text-text-primary">{page.name}</span>
                  </span>
                </Checkbox>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-subtle px-4 py-3 text-body-sm text-text-tertiary">
          {t('noPages')}
        </p>
      )}
    </fieldset>
  )
}
