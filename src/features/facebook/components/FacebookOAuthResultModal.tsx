import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  IconFacebook,
  Modal,
  Spin,
  StatusTag,
  useToast,
} from '@/shared/ui'
import { useAvailableFacebookPages, useSelectFacebookPages } from '../api'

export type FacebookOAuthResult = { brandId: string; connectionId: string }

export function FacebookOAuthResultModal({
  result,
  onClose,
  onConnected,
}: {
  result: FacebookOAuthResult | null
  onClose: () => void
  onConnected: () => void
}) {
  const { t } = useTranslation('facebook')
  const toast = useToast()
  const pages = useAvailableFacebookPages(result?.brandId ?? null, result?.connectionId ?? null)
  const selectPages = useSelectFacebookPages(result?.brandId ?? null)
  const [selected, setSelected] = useState<string[]>([])
  const autoConnectedConnections = useRef(new Set<string>())
  const selectablePages = pages.data?.filter((page) => !page.isConnected) ?? []

  useEffect(() => {
    setSelected([])
  }, [result?.connectionId])

  useEffect(() => {
    if (
      !result ||
      pages.data?.length !== 1 ||
      pages.data[0].isConnected ||
      autoConnectedConnections.current.has(result.connectionId)
    )
      return
    autoConnectedConnections.current.add(result.connectionId)
    selectPages.mutate(
      { ...result, pageIds: [pages.data[0].id] },
      {
        onSuccess: () => {
          toast.success({ title: t('oauth.connected') })
          onConnected()
        },
        onError: () => toast.error({ title: t('oauth.selectError') }),
      },
    )
  }, [onConnected, pages.data, result, selectPages, t, toast])

  const connectSelected = () => {
    if (!result || selected.length === 0) return
    selectPages.mutate(
      { ...result, pageIds: selected },
      {
        onSuccess: () => {
          toast.success({ title: t('oauth.connected') })
          onConnected()
        },
        onError: () => toast.error({ title: t('oauth.selectError') }),
      },
    )
  }

  return (
    <Modal
      open={result !== null}
      title={
        <div className="flex items-center gap-4 pe-8">
          <IconFacebook className="size-12 shrink-0 text-platform-facebook" />
          <span className="min-w-0">
            <span className="block text-heading-2 text-text-primary">{t('oauth.selectTitle')}</span>
            <span className="mt-1 block text-body-sm font-normal text-text-secondary">
              {t('oauth.selectDescription')}
            </span>
          </span>
        </div>
      }
      width={560}
      onClose={onClose}
      footer={
        selectablePages.length > 0 ? (
          <div className="flex gap-3">
            <Button className="flex-1" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              loading={selectPages.isPending}
              disabled={selected.length === 0}
              onClick={connectSelected}
            >
              {t('oauth.connectSelected')}
            </Button>
          </div>
        ) : null
      }
    >
      {pages.isPending || (pages.data?.length === 1 && selectPages.isPending) ? (
        <div className="flex items-center justify-center gap-3 py-10 text-body-sm text-text-secondary">
          <Spin size="lg" />
          {t('oauth.loadingPages')}
        </div>
      ) : null}

      {pages.isError ? (
        <Alert variant="soft" tone="error" title={t('oauth.loadError')} />
      ) : null}

      {pages.data?.length === 0 ? (
        <Alert variant="soft" tone="warning" title={t('oauth.noPages')} />
      ) : null}

      {pages.data?.length ? (
        <div className="grid max-h-80 gap-2 overflow-y-auto">
          {pages.data.map((page) => (
            <label
              key={page.id}
              className={`flex items-center gap-3 rounded-lg border border-border-subtle px-4 py-3 ${page.isConnected ? 'cursor-default bg-bg-surface-subtle' : 'cursor-pointer hover:bg-bg-surface-muted'}`}
            >
              <Checkbox
                checked={selected.includes(page.id)}
                disabled={page.isConnected}
                onChange={({ target }) =>
                  setSelected((current) =>
                    target.checked
                      ? [...current, page.id]
                      : current.filter((id) => id !== page.id),
                  )
                }
              />
              <Avatar name={page.name} src={page.avatarUrl} size="md" />
              <span className="min-w-0">
                <strong className="block truncate text-label-md text-text-primary">{page.name}</strong>
              </span>
              {page.isConnected ? (
                <StatusTag tone="success">{t('oauth.alreadyConnected')}</StatusTag>
              ) : null}
            </label>
          ))}
        </div>
      ) : null}
    </Modal>
  )
}
