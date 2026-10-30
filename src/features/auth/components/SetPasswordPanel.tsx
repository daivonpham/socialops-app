import { useTranslation } from 'react-i18next'
import { Alert, Button, useToast } from '@/shared/ui'
import { useForgotPassword } from '../api'
import { getInboxUrl } from '../model/inbox-url'
import { useApiErrorMessage } from '@/shared/hooks'

/**
 * Google-only accounts have no current password to confirm, so the password is set
 * through the emailed reset link: holding a session alone must not be enough.
 */
export function SetPasswordPanel({ email, embedded }: { email: string; embedded: boolean }) {
  const { t } = useTranslation('auth')
  const errorMessage = useApiErrorMessage('auth')
  const toast = useToast()
  const send = useForgotPassword()

  const sendLink = () =>
    send.mutate(
      { email },
      {
        onSuccess: () => {
          const inboxUrl = getInboxUrl(email)
          toast.success({
            title: t('setPassword.success', { email }),
            action: inboxUrl ? { label: t('setPassword.openInbox'), href: inboxUrl } : undefined,
          })
        },
      },
    )

  return (
    <section className={embedded ? 'w-full' : 'mx-auto w-full max-w-auth'}>
      <header className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading-2 text-text-primary">{t('setPassword.title')}</h1>
          <p className="mt-2 text-body-md text-text-secondary">{t('setPassword.description')}</p>
        </div>
        <div className="flex shrink-0 justify-end">
          <Button
            variant="primary"
            layered={false}
            disabled={send.isSuccess}
            loading={send.isPending}
            onClick={sendLink}
          >
            {t('setPassword.submit')}
          </Button>
        </div>
      </header>
      <div className="mt-6">
        {send.isError ? (
          <Alert variant="soft" tone="error" title={errorMessage(send.error)} />
        ) : (
          <p className="text-body-md text-text-secondary">
            {t('setPassword.instructions', { email })}
          </p>
        )}
      </div>
    </section>
  )
}
