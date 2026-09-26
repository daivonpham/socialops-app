import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getBrands } from '@/features/brands/api/service'
import { BRAND_QUERY_KEYS } from '@/features/brands/api/hooks'
import { getWorkspaces } from '@/features/workspaces/api/service'
import { WORKSPACE_QUERY_KEYS } from '@/features/workspaces/api/hooks'
import { useAuth } from '@/shared/auth'
import { ScopeContext, type ScopeContextValue } from '@/shared/scope'
import { Spin } from '@/shared/ui'

const WORKSPACE_STORAGE_KEY = 'socialops.active_workspace_id'
const BRAND_STORAGE_KEY = 'socialops.active_brand_id'
const LEGACY_STORAGE_KEY = 'socialops.scope'

type PersistedScope = { workspaceId: string | null; brandId: string | null }

function storedId(key: string) {
  const value = localStorage.getItem(key)?.trim()
  return value || null
}

function migrateLegacyScope() {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return
  try {
    const legacy = JSON.parse(raw) as Partial<PersistedScope>
    if (!storedId(WORKSPACE_STORAGE_KEY) && typeof legacy.workspaceId === 'string') {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, legacy.workspaceId)
    }
    if (!storedId(BRAND_STORAGE_KEY) && typeof legacy.brandId === 'string') {
      localStorage.setItem(BRAND_STORAGE_KEY, legacy.brandId)
    }
  } catch {
    // Invalid persisted UI state is discarded and rebuilt from the API.
  } finally {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
}

function persistScope({ workspaceId, brandId }: PersistedScope) {
  if (workspaceId) localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
  else localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  if (brandId) localStorage.setItem(BRAND_STORAGE_KEY, brandId)
  else localStorage.removeItem(BRAND_STORAGE_KEY)
}

/** Restores the last UI scope only after the API confirms that it is still accessible. */
export function ScopeProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<PersistedScope>({ workspaceId: null, brandId: null })
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null)

  const commit = useCallback((next: PersistedScope) => {
    persistScope(next)
    setScope(next)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      setScope({ workspaceId: null, brandId: null })
      setResolvedUserId(null)
      return
    }

    let cancelled = false
    setResolvedUserId(null)
    migrateLegacyScope()

    const reconcile = async () => {
      try {
        const workspaceResponse = await queryClient.fetchQuery({
          queryKey: WORKSPACE_QUERY_KEYS.list(),
          queryFn: getWorkspaces,
        })
        const workspaces = workspaceResponse.data
        const savedWorkspaceId = storedId(WORKSPACE_STORAGE_KEY)
        const workspace =
          workspaces.find((candidate) => candidate.id === savedWorkspaceId) ?? workspaces[0]

        if (!workspace) {
          if (!cancelled) commit({ workspaceId: null, brandId: null })
          return
        }

        const brandResponse = await queryClient.fetchQuery({
          queryKey: BRAND_QUERY_KEYS.list(workspace.id),
          queryFn: () => getBrands(workspace.id),
        })
        const brands = brandResponse.data
        const savedBrandId = storedId(BRAND_STORAGE_KEY)
        const brand = brands.find((candidate) => candidate.id === savedBrandId) ?? brands[0]

        if (!cancelled) commit({ workspaceId: workspace.id, brandId: brand?.id ?? null })
      } catch {
        if (!cancelled) commit({ workspaceId: null, brandId: null })
      } finally {
        if (!cancelled) setResolvedUserId(user.id)
      }
    }

    void reconcile()
    return () => {
      cancelled = true
    }
  }, [commit, queryClient, status, user?.id])

  const value = useMemo<ScopeContextValue>(
    () => ({
      workspaceId: scope.workspaceId,
      brandId: scope.brandId,
      setWorkspace: (workspaceId) => commit({ workspaceId, brandId: null }),
      selectBrand: (workspaceId, brandId) => commit({ workspaceId, brandId }),
    }),
    [commit, scope],
  )

  if (status === 'authenticated' && resolvedUserId !== user?.id) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-page">
        <Spin size="lg" />
      </div>
    )
  }

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
}
