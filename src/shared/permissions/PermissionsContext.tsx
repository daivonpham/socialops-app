import { createContext, useContext } from 'react'

/**
 * Holds the permission keys granted to the current user in the ACTIVE Brand
 * only (the backend scopes grants per Brand). The context lives in shared so
 * both features and app can read it; app/providers/PermissionProvider supplies
 * the data and re-reads it whenever the active Brand changes.
 */
export type PermissionsContextValue = {
  granted: readonly string[]
  /** True while the active Brand's grants are (re)loading — never treat missing-as-denied during this window. */
  isLoading: boolean
}

export const PermissionsContext = createContext<PermissionsContextValue>({
  granted: [],
  isLoading: false,
})

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext)
}
