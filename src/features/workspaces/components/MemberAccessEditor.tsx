import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Avatar, Checkbox, IconChevronDown } from '@/shared/ui'
import type { AccessOptionBrandDto, BrandAccessInput } from '../api'

type Brand = AccessOptionBrandDto

/**
 * Brand → Page access picker. Access is always saved as an explicit Page list: Pages
 * connected to a Brand later are granted to members manually. Older grants stored as
 * `pageIds: null` (every Page) display as fully selected and are saved as a list.
 * Platform labels come from the Page provider, so new social networks need no layout change.
 */
export function MemberAccessEditor({
  options,
  value,
  onChange,
}: {
  options: Brand[]
  value: BrandAccessInput[]
  onChange: (value: BrandAccessInput[]) => void
}) {
  const { t } = useTranslation('workspaces')
  const [expanded, setExpanded] = useState(() => new Set(value.map((item) => item.brandId)))
  if (!options.length) return <Alert variant="soft" tone="info" title={t('access.noBrands')} />

  const set = (brandId: string, pageIds: string[] | null | undefined) => {
    const rest = value.filter((item) => item.brandId !== brandId)
    // undefined removes the Brand; an empty selection also removes it.
    onChange(
      pageIds === undefined || (pageIds && !pageIds.length)
        ? rest
        : [...rest, { brandId, pageIds }].sort(
            (left, right) =>
              options.findIndex((brand) => brand.id === left.brandId) -
              options.findIndex((brand) => brand.id === right.brandId),
          ),
    )
  }

  const toggleExpanded = (brandId: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(brandId)) next.delete(brandId)
      else next.add(brandId)
      return next
    })

  return (
    <ul className="app-scrollbar grid max-h-[26rem] gap-2 overflow-y-auto pe-1">
      {options.map((brand) => {
        const grant = value.find((item) => item.brandId === brand.id)
        const total = brand.pages.length
        const selectedIds = grant ? (grant.pageIds ?? brand.pages.map((page) => page.id)) : []
        const allSelected = Boolean(grant) && selectedIds.length >= total
        const partial = Boolean(grant) && !allSelected
        const isOpen = expanded.has(brand.id)
        const subtitle = !grant
          ? t('access.pageCount', { count: total })
          : allSelected
            ? t('access.allPagesCount', { count: total })
            : t('access.selectedOf', { selected: selectedIds.length, total })

        return (
          <li key={brand.id} className="rounded-xl border border-border-subtle bg-bg-surface">
            <div className="flex items-center gap-3 px-4 py-3">
              <Checkbox
                aria-label={brand.name}
                // A Brand without connected Pages has nothing to grant yet.
                disabled={total === 0}
                checked={allSelected}
                indeterminate={partial}
                onChange={(event) => {
                  // Clicking a partially selected Brand selects all of it, like a tri-state tree.
                  set(
                    brand.id,
                    event.target.checked ? brand.pages.map((page) => page.id) : undefined,
                  )
                  if (event.target.checked) setExpanded((current) => new Set(current).add(brand.id))
                }}
              />
              <Avatar name={brand.name} src={brand.avatarUrl ?? undefined} size="md" />
              <button
                type="button"
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-start outline-none focus-visible:focus-ring"
                onClick={() => toggleExpanded(brand.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label-md text-text-primary">
                    {brand.name}
                  </span>
                  <span className="block truncate text-caption text-text-tertiary">{subtitle}</span>
                </span>
                <IconChevronDown
                  aria-hidden
                  className={`shrink-0 text-icon-sm text-text-tertiary transition-transform duration-fast ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {isOpen ? (
              <div className="grid gap-1 px-4 pb-3 ps-11">
                {total === 0 ? (
                  <p className="py-1 text-caption text-text-tertiary">{t('access.noPages')}</p>
                ) : (
                  brand.pages.map((page) => (
                    <label
                      key={page.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-bg-surface-muted"
                    >
                      <Checkbox
                        checked={selectedIds.includes(page.id)}
                        onChange={(event) =>
                          set(
                            brand.id,
                            event.target.checked
                              ? [...selectedIds, page.id]
                              : selectedIds.filter((id) => id !== page.id),
                          )
                        }
                      />
                      <Avatar name={page.name} src={page.avatarUrl} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">
                        {page.name}
                      </span>
                      <span className="shrink-0 text-caption text-text-tertiary">
                        {t(`access.platforms.${page.provider}`, { defaultValue: page.provider })}
                      </span>
                    </label>
                  ))
                )}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
