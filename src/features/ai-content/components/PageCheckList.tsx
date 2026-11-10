import { useTranslation } from 'react-i18next'
import { Avatar, IconCheck } from '@/shared/ui'
import type { AiAvailability } from '../api'

/** Pages to tick, with their avatars. */
export function PageCheckList({
  pages,
  value,
  onChange,
  hoverClassName = 'hover:bg-bg-surface',
}: {
  pages: AiAvailability['pages']
  value: string[]
  onChange: (next: string[]) => void
  /** The row's hover ground, set against what the list sits on. */
  hoverClassName?: string
}) {
  const { t } = useTranslation('aiContent')
  return (
    <div
      role="group"
      aria-label={t('form.pages')}
      className="app-scrollbar grid max-h-[200px] grid-cols-[minmax(0,1fr)] gap-1 overflow-y-auto"
    >
      {pages.map((page) => {
        const checked = value.includes(page.id)
        return (
          <label
            key={page.id}
            className={
              'flex h-[44px] cursor-pointer items-center gap-3 rounded-lg ps-4 pe-3 transition-colors has-[:focus-visible]:focus-ring ' +
              (checked ? 'bg-ai-50' : hoverClassName)
            }
          >
            <input
              type="checkbox"
              className="sr-only"
              aria-label={page.name}
              checked={checked}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, page.id]
                    : value.filter((item) => item !== page.id),
                )
              }
            />
            <Avatar
              name={page.name}
              src={page.avatarUrl}
              size="xs"
              fallbackClassName="text-caption"
            />
            <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">
              {page.name}
            </span>
            <span
              aria-hidden
              className={
                'flex size-5 shrink-0 items-center justify-center rounded-full text-caption transition-colors ' +
                (checked ? 'bg-ai-500 text-text-inverse' : 'border border-ai-200 bg-bg-surface')
              }
            >
              {checked ? <IconCheck /> : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}
