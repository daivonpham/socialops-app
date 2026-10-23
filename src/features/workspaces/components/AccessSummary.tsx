import { useTranslation } from 'react-i18next'
import { Avatar, Tooltip } from '@/shared/ui'
import type { AccessOptionBrandDto, BrandAccessInput, WorkspaceMemberRole } from '../api'
import { hasFullAccess } from '../model/member-role'

const VISIBLE_AVATARS = 3

/**
 * Compact access cell: stacked Page avatars, the granted Page names (truncated) and a
 * "2 brands · 4 Pages" line. Without Page options (members who cannot manage access)
 * it falls back to Brand names only.
 */
export function AccessSummary({
  role,
  access,
  options,
  brandNames,
  compact = false,
}: {
  role: WorkspaceMemberRole
  access: BrandAccessInput[]
  options?: AccessOptionBrandDto[]
  brandNames: Map<string, string>
  /** Single line for form controls that must match the height of a text input. */
  compact?: boolean
}) {
  const { t } = useTranslation('workspaces')
  if (hasFullAccess(role))
    return <span className="text-body-sm text-text-secondary">{t('members.fullAccess')}</span>
  if (!access.length)
    return <span className="text-body-sm text-warning-700">{t('members.noAccess')}</span>

  const brands = access.map((grant) => options?.find((brand) => brand.id === grant.brandId))
  const pages = access.flatMap((grant, index) => {
    const brand = brands[index]
    if (!brand) return []
    return grant.pageIds === null
      ? brand.pages
      : brand.pages.filter((page) => grant.pageIds?.includes(page.id))
  })
  const pageCount = options
    ? pages.length
    : access.reduce((total, grant) => total + (grant.pageIds?.length ?? 0), 0)
  // Pages identify access best; Brands stand in when no Page is known.
  const items = pages.length
    ? pages.map((page) => ({ id: page.id, name: page.name, avatarUrl: page.avatarUrl }))
    : access.map((grant, index) => ({
        id: grant.brandId,
        name: brands[index]?.name ?? brandNames.get(grant.brandId) ?? '',
        avatarUrl: brands[index]?.avatarUrl ?? undefined,
      }))
  const names = items.map((item) => item.name).filter(Boolean)

  return (
    <Tooltip title={names.join(', ')}>
      <span className={`flex min-w-0 items-center gap-2 text-start ${compact ? 'w-full' : ''}`}>
        {options ? (
          <span className="flex shrink-0 -space-x-1.5">
            {items.slice(0, VISIBLE_AVATARS).map((item) => (
              <Avatar
                key={item.id}
                name={item.name}
                src={item.avatarUrl ?? undefined}
                size="xs"
                className="ring-2 ring-bg-surface"
              />
            ))}
          </span>
        ) : null}
        <span className={compact ? 'flex min-w-0 flex-1 items-center gap-2' : 'grid min-w-0'}>
          <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">
            {names.join(', ')}
          </span>
          <span className={`truncate text-caption text-text-tertiary ${compact ? 'shrink-0' : ''}`}>
            {compact
              ? t('access.pageCount', { count: pageCount })
              : t('members.accessCounts', {
                  brands: t('members.accessSummary', { count: access.length }),
                  pages: t('access.pageCount', { count: pageCount }),
                })}
          </span>
        </span>
      </span>
    </Tooltip>
  )
}
