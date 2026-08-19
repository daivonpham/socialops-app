import type { ReactNode } from 'react'
import { allOf as grantedAllOf, anyOf as grantedAnyOf } from './hasPermission'
import { usePermissions } from './PermissionsContext'

type CanProps = {
  allOf?: readonly string[]
  anyOf?: readonly string[]
  fallback?: ReactNode
  children: ReactNode
}

/** Conditionally renders children based on the ACTIVE Brand's grants. UX only — the server enforces. */
export function Can({ allOf, anyOf, fallback = null, children }: CanProps) {
  const { granted, isLoading } = usePermissions()
  if (isLoading) return <>{fallback}</>
  const passes =
    (!allOf || grantedAllOf(granted, allOf)) && (!anyOf || grantedAnyOf(granted, anyOf))
  return <>{passes ? children : fallback}</>
}
