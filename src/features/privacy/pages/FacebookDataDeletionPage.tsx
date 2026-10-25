import { isAxiosError } from 'axios'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '@/shared/i18n'
import { Alert, IconCheck, Logo, SectionSkeleton } from '@/shared/ui'
import { useFacebookDataDeletionStatus } from '../api'

/**
 * Public page Meta links users to after a data deletion request (the `url` returned by the
 * data deletion callback). It only reveals the status of the given confirmation code.
 */
export default function FacebookDataDeletionPage() {
  const { t, i18n } = useTranslation('privacy')
  const [params] = useSearchParams()
  const code = params.get('code')
  const status = useFacebookDataDeletionStatus(code)
  const notFound = !code || (isAxiosError(status.error) && status.error.response?.status === 404)

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <section
        aria-label={t('dataDeletion.title')}
        className="grid w-full max-w-md gap-6 rounded-2xl border border-border-subtle bg-bg-surface p-8 shadow-lg"
      >
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        {notFound ? (
          <div className="grid gap-2 text-center">
            <h1 className="text-heading-2 text-text-primary">{t('dataDeletion.notFoundTitle')}</h1>
            <p className="text-body-md text-text-secondary">
              {t('dataDeletion.notFoundDescription')}
            </p>
          </div>
        ) : status.isPending ? (
          <SectionSkeleton rows={3} />
        ) : status.isError ? (
          <Alert variant="soft" tone="error" title={t('dataDeletion.error')} />
        ) : (
          <div className="grid gap-5">
            <div className="grid justify-items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-success-50 text-icon-md text-success-700">
                <IconCheck aria-hidden />
              </span>
              <h1 className="text-heading-2 text-text-primary">
                {t('dataDeletion.completedTitle')}
              </h1>
              <p className="text-body-sm text-text-secondary">
                {t('dataDeletion.completedDescription')}
              </p>
            </div>
            <dl className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
              <div className="grid gap-1 px-4 py-3">
                <dt className="text-caption text-text-tertiary">{t('dataDeletion.code')}</dt>
                <dd className="break-all font-mono text-label-md text-text-primary">
                  {status.data.confirmationCode}
                </dd>
              </div>
              <div className="grid gap-1 px-4 py-3">
                <dt className="text-caption text-text-tertiary">{t('dataDeletion.completedAt')}</dt>
                <dd className="text-label-md text-text-primary">
                  {formatDateTime(status.data.completedAt, i18n.resolvedLanguage)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </main>
  )
}
