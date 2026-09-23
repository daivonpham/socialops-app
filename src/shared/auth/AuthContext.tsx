import { createContext, useContext } from 'react'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'
export type AuthUser = {
  id: string
  email: string
  displayName: string
  locale: 'vi' | 'en'
  avatarUrl: string | null
}
export type AuthSession = { accessToken: string; user: AuthUser }

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  authenticate: (session: AuthSession) => void
  restore: () => Promise<void>
  updateUser: (user: AuthUser) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
