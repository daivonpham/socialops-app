import { AUTH_ROUTES } from '../config/auth.routes'

const STORAGE_KEY = 'socialops.pending_invitation'

/** Builds the in-app invitation path. Only the opaque token is carried, never a URL. */
export function invitationPath(token: string): string {
  return `${AUTH_ROUTES.INVITATION}?token=${encodeURIComponent(token)}`
}

/** Survives the sign-in round trip (including Google OAuth, which leaves the SPA). */
export function rememberPendingInvitation(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token)
}

/**
 * Where to continue after sign-in when an invitation is waiting. Read-only so route guards
 * can call it during render; the invitation page forgets the token once it is shown.
 */
export function pendingInvitationPath(): string | null {
  const token = sessionStorage.getItem(STORAGE_KEY)
  return token ? invitationPath(token) : null
}

export function forgetPendingInvitation(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
