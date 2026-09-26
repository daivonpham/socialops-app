import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { logout, restoreSession } from '@/features/auth'
import { onSessionExpired, setAccessToken } from '@/shared/api/client'
import { AuthContext, type AuthSession, type AuthStatus, type AuthUser } from '@/shared/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [user, setUser] = useState<AuthUser | null>(null)
  const restorePromiseRef = useRef<Promise<void> | null>(null)

  const becomeAnonymous = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    queryClient.clear()
    setStatus('anonymous')
    localStorage.removeItem('socialops.active_workspace_id')
    localStorage.removeItem('socialops.active_brand_id')
    localStorage.removeItem('socialops.scope')
  }, [queryClient])

  useEffect(() => {
    onSessionExpired(becomeAnonymous)
    return () => onSessionExpired(null)
  }, [becomeAnonymous])

  const restore = useCallback(() => {
    if (status === 'authenticated' || status === 'anonymous') return Promise.resolve()
    if (restorePromiseRef.current) return restorePromiseRef.current

    setStatus('loading')
    const operation = restoreSession()
      .then((session) => {
        setAccessToken(session.accessToken)
        setUser(session.user)
        setStatus('authenticated')
      })
      .catch(() => becomeAnonymous())
      .finally(() => {
        restorePromiseRef.current = null
      })
    restorePromiseRef.current = operation
    return operation
  }, [becomeAnonymous, status])

  const value = useMemo(
    () => ({
      status,
      user,
      authenticate: (session: AuthSession) => {
        setAccessToken(session.accessToken)
        setUser(session.user)
        setStatus('authenticated')
      },
      restore,
      updateUser: setUser,
      signOut: async () => {
        try {
          await logout()
        } finally {
          becomeAnonymous()
        }
      },
    }),
    [becomeAnonymous, restore, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
