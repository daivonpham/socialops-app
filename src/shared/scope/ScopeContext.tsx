import { createContext, useContext } from 'react'

/**
 * Active Workspace → Brand scope. The context LIVES here so features can read
 * it without importing app/; app/providers/ScopeProvider supplies the value
 * and persistence (same engine-vs-data split as shared/permissions).
 */
export type ScopeContextValue = {
  workspaceId: string | null
  brandId: string | null
  /** Switch workspace — clears the active brand until one is picked again. */
  setWorkspace: (workspaceId: string | null) => void
  /** Atomically select a brand together with the workspace it belongs to. */
  selectBrand: (workspaceId: string, brandId: string) => void
}

export const ScopeContext = createContext<ScopeContextValue | null>(null)

function useScope(): ScopeContextValue {
  const scope = useContext(ScopeContext)
  if (!scope) throw new Error('Scope hooks must be used inside <ScopeProvider>.')
  return scope
}

export function useActiveWorkspace() {
  const { workspaceId, setWorkspace } = useScope()
  return { workspaceId, setWorkspace }
}

export function useActiveBrand() {
  const { brandId, selectBrand } = useScope()
  return { brandId, selectBrand }
}
