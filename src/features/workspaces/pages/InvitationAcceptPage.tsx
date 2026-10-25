import { useEffect, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AUTH_ROUTES, forgetPendingInvitation } from '@/features/auth'
import { useAuth } from '@/shared/auth'
import {
  Button,
  IconMail,
  IconProfile,
  IconWarning,
  Logo,
  SectionSkeleton,
  useToast,
} from '@/shared/ui'
import { useAcceptInvitation, useDeclineInvitation, useInvitationPreview } from '../api'
import { useEnterWorkspace } from '../model/use-enter-workspace'

/**
 * GitHub-style invitation landing page: anyone holding the email link can see who invited
 * them; accepting requires signing in with the invited, verified email.
 */
export default function InvitationAcceptPage() {
  const { t } = useTranslation('workspaces')
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const token = params.get('token')
  const { status, user, restore, signOut } = useAuth()
  const enterWorkspace = useEnterWorkspace()
  const preview = useInvitationPreview(token)
  const accept = useAcceptInvitation()
  const decline = useDeclineInvitation()

  useEffect(() => {
    if (status === 'idle') void restore()
  }, [restore, status])

  // We've arrived: the token is in the URL now, so the post-sign-in redirect is done.
  useEffect(forgetPendingInvitation, [])

  const authParams = (email: string) =>
    new URLSearchParams({ invitation: token ?? '', email }).toString()

  const acceptInvitation = async (workspace: string) => {
    if (!token) return
    try {
      const { workspaceId } = await accept.mutateAsync(token)
      await enterWorkspace(workspaceId)
      toast.success({ title: t('invitation.accepted', { workspace }) })
      navigate(AUTH_ROUTES.POST_AUTH, { replace: true })
    } catch {
      toast.error({ title: t('invitation.actionError') })
    }
  }

  const declineInvitation = () => {
    if (!token) return
    decline.mutate(token, {
      onSuccess: () => {
        toast.success({ title: t('invitation.declined') })
        navigate(AUTH_ROUTES.POST_AUTH, { replace: true })
      },
      onError: () => toast.error({ title: t('invitation.actionError') }),
    })
  }

  if (!token || preview.isError) {
    const notFound =
      !token || (isAxiosError(preview.error) && preview.error.response?.status === 404)
    return (
      <InvitationShell>
        <ClosedState
          title={notFound ? t('invitation.invalidTitle') : t('invitation.actionError')}
          description={notFound ? t('invitation.invalidDescription') : ''}
        />
      </InvitationShell>
    )
  }
  if (preview.isPending || status === 'idle' || status === 'loading')
    return (
      <InvitationShell>
        <SectionSkeleton rows={4} />
      </InvitationShell>
    )

  const invitation = preview.data
  if (invitation.status !== 'PENDING')
    return (
      <InvitationShell>
        <ClosedState
          title={
            invitation.status === 'EXPIRED'
              ? t('invitation.expiredTitle')
              : t('invitation.closedTitle')
          }
          description={
            invitation.status === 'EXPIRED'
              ? t('invitation.expiredDescription')
              : t('invitation.closedDescription')
          }
        />
      </InvitationShell>
    )

  const heading = t('invitation.heading', {
    inviter: invitation.inviterName,
    workspace: invitation.workspaceName,
  })
  const details = t('invitation.details', {
    role: t(`roles.${invitation.role}`),
    email: invitation.email,
  })
  const emailMatches = user?.email.toLowerCase() === invitation.email.toLowerCase()

  return (
    <InvitationShell>
      <div className="grid gap-6">
        <div className="grid gap-2 text-center">
          <h1 className="text-heading-2 font-semibold text-text-primary">{heading}</h1>
          <p className="text-body-md text-text-secondary">{details}</p>
        </div>

        {status === 'anonymous' ? (
          <div className="grid gap-3">
            <Button
              variant={invitation.accountExists ? 'primary' : 'secondary'}
              size="lg"
              className="w-full"
              onClick={() => navigate(`${AUTH_ROUTES.LOGIN}?${authParams(invitation.email)}`)}
            >
              {t('invitation.signIn')}
            </Button>
            <Button
              variant={invitation.accountExists ? 'secondary' : 'primary'}
              size="lg"
              className="w-full"
              onClick={() => navigate(`${AUTH_ROUTES.REGISTER}?${authParams(invitation.email)}`)}
            >
              {t('invitation.createAccount')}
            </Button>
          </div>
        ) : emailMatches ? (
          <div className="grid gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={accept.isPending}
              disabled={decline.isPending}
              onClick={() => void acceptInvitation(invitation.workspaceName)}
            >
              {t('invitation.accept')}
            </Button>
            <Button
              size="lg"
              className="w-full"
              loading={decline.isPending}
              disabled={accept.isPending}
              onClick={declineInvitation}
            >
              {t('invitation.decline')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex gap-3 rounded-xl border border-warning-100 bg-warning-50 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-700">
                <IconWarning aria-hidden />
              </span>
              <div className="grid gap-1">
                <p className="text-label-md font-semibold text-warning-700">
                  {t('invitation.mismatchTitle')}
                </p>
                <p className="text-body-sm text-warning-700">
                  {t('invitation.mismatchDescription')}
                </p>
              </div>
            </div>
            <dl className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
              <AccountRow
                label={t('invitation.invitedAccount')}
                email={invitation.email}
                icon={<IconMail aria-hidden />}
                highlight
              />
              <AccountRow
                label={t('invitation.currentAccount')}
                email={user?.email ?? ''}
                icon={<IconProfile aria-hidden />}
              />
            </dl>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() =>
                void signOut().finally(() =>
                  navigate(`${AUTH_ROUTES.LOGIN}?${authParams(invitation.email)}`, {
                    replace: true,
                  }),
                )
              }
            >
              {t('invitation.switchAccount')}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(AUTH_ROUTES.POST_AUTH, { replace: true })}
            >
              {t('invitation.stayWithCurrent')}
            </Button>
          </div>
        )}
      </div>
    </InvitationShell>
  )
}

function AccountRow({
  label,
  email,
  icon,
  highlight = false,
}: {
  label: string
  email: string
  icon: ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-icon-md ${
          highlight ? 'bg-brand-50 text-brand-700' : 'bg-bg-surface-muted text-text-tertiary'
        }`}
      >
        {icon}
      </span>
      <div className="grid min-w-0 gap-1">
        <dt className="text-caption text-text-tertiary">{label}</dt>
        <dd className="truncate text-label-md text-text-primary" title={email}>
          {email}
        </dd>
      </div>
    </div>
  )
}

function ClosedState({ title, description }: { title: string; description: string }) {
  const { t } = useTranslation('workspaces')
  const navigate = useNavigate()
  return (
    <div className="grid gap-5 text-center">
      <div className="grid gap-2">
        <h1 className="text-heading-2 font-semibold text-text-primary">{title}</h1>
        {description ? <p className="text-body-md text-text-secondary">{description}</p> : null}
      </div>
      <Button size="lg" onClick={() => navigate(AUTH_ROUTES.POST_AUTH, { replace: true })}>
        {t('invitation.goToApp')}
      </Button>
    </div>
  )
}

function InvitationShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('workspaces')
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <section
        aria-label={t('invitation.title')}
        className="grid w-full max-w-md gap-8 rounded-2xl border border-border-subtle bg-bg-surface p-8 shadow-lg"
      >
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        {children}
      </section>
    </main>
  )
}
