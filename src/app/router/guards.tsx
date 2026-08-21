import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useMatches } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { allOf, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import { Spin } from '@/shared/ui'
import { ROUTES } from './paths'
import type { AppRouteHandle } from './routes'

/**
 * Route guards are UX only — they avoid dead-end screens. Real authorization
 * happens on the server for every request (frontend-admin-security).
 */

/** The shell never renders without an active Brand (brand-scoped query keys depend on it). */
export function RequireBrand({ children }: { children: ReactNode }) {
  const { brandId } = useActiveBrand()
  const location = useLocation()
  if (brandId === null) {
    return <Navigate to={ROUTES.SELECT_BRAND} replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

/** Reads the SAME `handle.requires` the sidebar uses — single access source per route. */
export function RouteAccessGuard({ children }: { children: ReactNode }) {
  const { t } = useTranslation('app')
  const matches = useMatches()
  const { granted, isLoading } = usePermissions()

  const requires = [...matches]
    .reverse()
    .map((match) => (match.handle as AppRouteHandle | undefined)?.requires)
    .find((value) => value !== undefined)

  if (!requires || requires.length === 0) return <>{children}</>

  // Never render 403 while grants are still loading (authorized users would flash it).
  if (isLoading) {
    return (
      <div className="flex justify-center pt-16">
        <Spin size="lg" />
      </div>
    )
  }

  if (!allOf(granted, requires)) {
    return (
      <section className="max-w-narrow">
        <h1 className="text-heading-2 text-text-primary">{t('accessDenied.title')}</h1>
        <p className="mt-2 text-body-md text-text-secondary">
          {t('accessDenied.description')}
        </p>
        <Link
          to={ROUTES.ALL_PLATFORMS}
          className="mt-6 inline-block rounded-sm text-label-md text-link outline-none hover:text-link-hover focus-visible:focus-ring"
        >
          {t('accessDenied.goToAllPlatforms')}
        </Link>
      </section>
    )
  }

  return <>{children}</>
}
