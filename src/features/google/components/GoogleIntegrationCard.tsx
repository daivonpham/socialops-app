import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Alert, Button, ConfirmDialog, IconGoogle, Spin, useToast } from '@/shared/ui'
import {
  connectGoogleInPopup,
  GOOGLE_QUERY_KEYS,
  isGoogleConsentCancelled,
  useDisconnectGoogle,
  useGoogleConnection,
} from '../api'
import { useApiErrorMessage } from '@/shared/hooks'

/** The user's Google account for Sheets exports: status, connect, reconnect, disconnect. */
export function GoogleIntegrationCard() {
  const { t } = useTranslation('google')
  const errorMessage = useApiErrorMessage('google')
  const toast = useToast()
  const client = useQueryClient()
  const connection = useGoogleConnection()
  const disconnect = useDisconnectGoogle()
  const [connecting, setConnecting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const connect = () => {
    setConnecting(true)
    connectGoogleInPopup()
      .then(() => toast.success({ title: t('integration.connectedToast') }))
      .catch((error: unknown) => {
        if (isGoogleConsentCancelled(error)) return
        toast.error({ title: errorMessage(error, t('integration.error')) })
      })
      .finally(() => {
        setConnecting(false)
        void client.invalidateQueries({ queryKey: GOOGLE_QUERY_KEYS.connection })
      })
  }

  const data = connection.data
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface">
          <IconGoogle className="text-icon-md" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-label-md font-semibold text-text-primary">
            {t('integration.title')}
          </h3>
          <p className="mt-1 text-body-sm text-text-secondary">{t('integration.description')}</p>
          {connection.isPending ? (
            <Spin size="sm" className="mt-2" />
          ) : connection.isError ? (
            <p className="mt-2 text-body-sm text-error-700">{t('integration.loadError')}</p>
          ) : data?.connected ? (
            <p className="mt-2 truncate text-body-sm font-medium text-text-primary">
              {t('integration.connectedAs', { email: data.email ?? '' })}
            </p>
          ) : (
            <p className="mt-2 text-body-sm text-text-tertiary">{t('integration.notConnected')}</p>
          )}
          {data?.connected && !data.usable ? (
            <div className="mt-3">
              <Alert variant="soft" tone="warning" title={t('integration.reconnectNeeded')} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {data?.connected ? (
          <Button disabled={disconnect.isPending} onClick={() => setConfirming(true)}>
            {t('integration.disconnect')}
          </Button>
        ) : null}
        {!data?.connected || !data.usable ? (
          <Button
            variant="primary"
            layered={false}
            loading={connecting}
            disabled={connection.isPending}
            onClick={connect}
          >
            {data?.connected ? t('integration.reconnect') : t('integration.connect')}
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirming}
        title={t('integration.disconnectTitle')}
        description={t('integration.disconnectDescription')}
        confirmLabel={t('integration.disconnect')}
        loading={disconnect.isPending}
        onConfirm={() =>
          disconnect.mutate(undefined, {
            onSuccess: () => {
              setConfirming(false)
              toast.success({ title: t('integration.disconnected') })
            },
            onError: (error) => toast.error({ title: errorMessage(error, t('integration.error')) }),
          })
        }
        onClose={() => setConfirming(false)}
      />
    </section>
  )
}
