import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AUTH_ROUTES } from '@/features/auth'
import { formatDate } from '@/shared/i18n/format'
import { Avatar, Badge, Button, IconBell, Popover, useToast } from '@/shared/ui'
import {
  useAcceptInvitationById,
  useDeclineInvitationById,
  useMyInvitations,
  type MyInvitationDto,
} from '../api'
import { useEnterWorkspace } from '../model/use-enter-workspace'

/**
 * Top-bar inbox for pending Workspace invitations, so an invite can be accepted without the
 * email link (e.g. after first signing in with the wrong account).
 */
export function InvitationsInbox() {
  const { t } = useTranslation('workspaces')
  const [open, setOpen] = useState(false)
  const invitations = useMyInvitations()
  const items = invitations.data ?? []

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      content={
        <div className="grid w-[22rem] max-w-[calc(100vw-2rem)]">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-label-md text-text-primary">{t('inbox.title')}</p>
          </div>
          {items.length ? (
            <ul className="max-h-[26rem] divide-y divide-border-subtle overflow-y-auto">
              {items.map((invitation) => (
                <InvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  onDone={() => setOpen(false)}
                />
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-center gap-2 px-4 py-8 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-bg-surface-subtle text-icon-md text-text-tertiary">
                <IconBell aria-hidden />
              </span>
              <p className="text-body-sm text-text-tertiary">{t('inbox.empty')}</p>
            </div>
          )}
        </div>
      }
    >
      <button
        type="button"
        aria-label={
          items.length ? t('inbox.triggerWithCount', { count: items.length }) : t('inbox.trigger')
        }
        className="relative flex size-10 items-center justify-center rounded-lg text-icon-md text-text-secondary outline-none hover:bg-bg-surface-subtle focus-visible:focus-ring"
      >
        <IconBell aria-hidden />
        {items.length ? (
          <Badge
            aria-hidden
            count={items.length > 9 ? '9+' : items.length}
            tone="danger"
            placement="corner"
            className="-end-1 -top-1"
          />
        ) : null}
      </button>
    </Popover>
  )
}

function InvitationItem({
  invitation,
  onDone,
}: {
  invitation: MyInvitationDto
  onDone: () => void
}) {
  const { t, i18n } = useTranslation('workspaces')
  const toast = useToast()
  const navigate = useNavigate()
  const accept = useAcceptInvitationById()
  const decline = useDeclineInvitationById()
  const enterWorkspace = useEnterWorkspace()
  const busy = accept.isPending || decline.isPending

  const acceptInvitation = async () => {
    try {
      const { workspaceId } = await accept.mutateAsync(invitation.id)
      await enterWorkspace(workspaceId)
      toast.success({ title: t('invitation.accepted', { workspace: invitation.workspaceName }) })
      onDone()
      navigate(AUTH_ROUTES.POST_AUTH)
    } catch {
      toast.error({ title: t('invitation.actionError') })
    }
  }

  const declineInvitation = () =>
    decline.mutate(invitation.id, {
      onSuccess: () => toast.success({ title: t('invitation.declined') }),
      onError: () => toast.error({ title: t('invitation.actionError') }),
    })

  return (
    <li className="grid gap-3 px-4 py-3">
      <div className="flex items-start gap-3">
        <Avatar name={invitation.workspaceName} size="sm" />
        <div className="grid min-w-0 gap-1">
          <p className="text-body-sm text-text-secondary">
            {t('inbox.message', {
              inviter: invitation.inviterName,
              workspace: invitation.workspaceName,
            })}
          </p>
          <p className="text-caption text-text-tertiary">
            {t(`roles.${invitation.role}`)}
            <span aria-hidden> · </span>
            {t('inbox.expires', { date: formatDate(invitation.expiresAt, i18n.language) })}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" loading={decline.isPending} disabled={busy} onClick={declineInvitation}>
          {t('invitation.decline')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          loading={accept.isPending}
          disabled={busy}
          onClick={() => void acceptInvitation()}
        >
          {t('inbox.accept')}
        </Button>
      </div>
    </li>
  )
}
