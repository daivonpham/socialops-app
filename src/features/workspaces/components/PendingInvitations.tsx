import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AUTH_ROUTES } from '@/features/auth'
import { formatDate } from '@/shared/i18n/format'
import { Avatar, Button, SectionLabel, useToast } from '@/shared/ui'
import {
  useAcceptInvitationById,
  useDeclineInvitationById,
  useMyInvitations,
  type MyInvitationDto,
} from '../api'
import { useEnterWorkspace } from '../model/use-enter-workspace'
import { useApiErrorMessage } from '@/shared/hooks'

/**
 * Pending Workspace invitations, accepted or declined in place, so an invite works without the
 * email link (e.g. after first signing in with the wrong account). Shown at the top of the
 * notification bell; renders nothing when none is waiting.
 */
export function PendingInvitations({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('workspaces')
  const items = useMyInvitations().data ?? []
  if (!items.length) return null
  return (
    <section aria-label={t('inbox.title')} className="border-b border-border-subtle">
      <SectionLabel className="block px-4 pt-3">{t('inbox.title')}</SectionLabel>
      <ul className="divide-y divide-border-subtle">
        {items.map((invitation) => (
          <InvitationItem key={invitation.id} invitation={invitation} onDone={onDone} />
        ))}
      </ul>
    </section>
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
  const errorMessage = useApiErrorMessage('workspaces')
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
    } catch (error) {
      toast.error({ title: errorMessage(error, t('invitation.actionError')) })
    }
  }

  const declineInvitation = () =>
    decline.mutate(invitation.id, {
      onSuccess: () => toast.success({ title: t('invitation.declined') }),
      onError: (error) => toast.error({ title: errorMessage(error, t('invitation.actionError')) }),
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
