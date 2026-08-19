import { useMemo, useState, type ReactNode } from 'react'
import { ScopeContext, type ScopeContextValue } from '@/shared/scope'

const STORAGE_KEY = 'socialops.scope'

type PersistedScope = { workspaceId: string | null; brandId: string | null }

function readPersistedScope(): PersistedScope {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedScope
  } catch {
    // Corrupted storage — fall back to an empty scope (user re-picks a brand).
  }
  return { workspaceId: null, brandId: null }
}

/** Supplies the Workspace→Brand scope and persists the last used Brand. */
export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<PersistedScope>(readPersistedScope)

  const value = useMemo<ScopeContextValue>(() => {
    const commit = (next: PersistedScope) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setScope(next)
    }
    return {
      workspaceId: scope.workspaceId,
      brandId: scope.brandId,
      setWorkspace: (workspaceId) => commit({ workspaceId, brandId: null }),
      selectBrand: (workspaceId, brandId) => commit({ workspaceId, brandId }),
    }
  }, [scope])

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
}
