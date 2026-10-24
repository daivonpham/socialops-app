import { describe, expect, it } from 'vitest'
import {
  forgetPendingInvitation,
  invitationPath,
  pendingInvitationPath,
  rememberPendingInvitation,
} from './pending-invitation'

describe('pending invitation', () => {
  it('builds an in-app path that carries only the encoded token', () => {
    expect(invitationPath('a b/c')).toBe('/invitations/accept?token=a%20b%2Fc')
  })

  it('survives reads until the invitation page forgets it', () => {
    expect(pendingInvitationPath()).toBeNull()
    rememberPendingInvitation('token-1')
    // Reading is side-effect free, so a guard may call it on every render.
    expect(pendingInvitationPath()).toBe('/invitations/accept?token=token-1')
    expect(pendingInvitationPath()).toBe('/invitations/accept?token=token-1')
    forgetPendingInvitation()
    expect(pendingInvitationPath()).toBeNull()
  })
})
