import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SOCIAL_ACCOUNT_QUERY_KEYS } from '@/features/social-accounts'
import { hasPermission, PERMISSIONS, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  Alert,
  Avatar,
  Button,
  EmptyState,
  IconTikTok,
  Modal,
  SectionError,
  SectionSkeleton,
  useToast,
} from '@/shared/ui'
import {
  TIKTOK_QUERY_KEYS,
  useConnectTikTok,
  useDisconnectTikTok,
  useTikTokIntegration,
} from '../api'

export default function TikTokPage() {
  const { t } = useTranslation('tiktok')
  const { brandId } = useActiveBrand()
  const { granted } = usePermissions()
  const toast = useToast()
  const client = useQueryClient()
  const integration = useTikTokIntegration(brandId)
  const connect = useConnectTikTok()
  const disconnect = useDisconnectTikTok(brandId)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const canManage = hasPermission(granted, PERMISSIONS.CHANNELS_MANAGE.key)

  useEffect(() => {
    const receiveResult = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const result = event.data as {
        type?: string
        brandId?: string
        accountId?: string
        error?: string
      }
      if (result?.type !== 'socialops.tiktok.oauth') return
      if (result.error) {
        toast.error({ title: t('oauthFailed') })
        return
      }
      if (result.brandId !== brandId || !result.accountId) return
      void Promise.all([
        client.invalidateQueries({ queryKey: TIKTOK_QUERY_KEYS.root(brandId) }),
        client.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
      ])
      toast.success({ title: t('connectSuccess') })
    }
    window.addEventListener('message', receiveResult)
    return () => window.removeEventListener('message', receiveResult)
  }, [brandId, client, t, toast])

  if (!brandId)
    return (
      <div className="py-16">
        <EmptyState title={t('noBrand.title')} description={t('noBrand.description')} />
      </div>
    )
  if (integration.isPending) return <SectionSkeleton rows={5} />
  if (integration.isError)
    return (
      <SectionError
        title={t('loadError')}
        retryLabel={t('retry')}
        onRetry={() => void integration.refetch()}
      />
    )

  return (
    <div className="grid gap-5">
      <header className="flex items-center gap-3">
        <IconTikTok className="text-icon-lg text-text-primary" />
        <div>
          <h1 className="text-heading-2 text-text-primary">{t('title')}</h1>
          <p className="text-body-sm text-text-secondary">{t('description')}</p>
        </div>
      </header>
      <Alert variant="soft" tone="warning" title={t('unavailable')} />
      {integration.data?.accounts.length ? (
        <div className="grid gap-3">
          {integration.data.accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4"
            >
              <Avatar name={account.name} src={account.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-md text-text-primary">{account.name}</p>
                <p className="text-caption text-text-secondary">{t('connected')}</p>
              </div>
              {canManage ? (
                <Button onClick={() => setConfirmDisconnect(true)}>{t('disconnect')}</Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 rounded-xl border border-border-subtle bg-bg-surface p-6">
          <p className="text-body-sm text-text-secondary">{t('disconnected')}</p>
          {canManage ? (
            <Button
              variant="primary"
              loading={connect.isPending}
              onClick={() =>
                connect.mutate(brandId, { onError: () => toast.error({ title: t('startError') }) })
              }
            >
              {t('connect')}
            </Button>
          ) : null}
        </div>
      )}
      <Modal
        open={confirmDisconnect}
        title={t('disconnectTitle')}
        onClose={() => setConfirmDisconnect(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmDisconnect(false)}>{t('cancel')}</Button>
            <Button
              variant="primary"
              loading={disconnect.isPending}
              onClick={() =>
                disconnect.mutate(undefined, {
                  onSuccess: () => {
                    setConfirmDisconnect(false)
                    toast.success({ title: t('disconnectSuccess') })
                  },
                  onError: () => toast.error({ title: t('disconnectError') }),
                })
              }
            >
              {t('disconnect')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-secondary">{t('disconnectDescription')}</p>
      </Modal>
    </div>
  )
}
