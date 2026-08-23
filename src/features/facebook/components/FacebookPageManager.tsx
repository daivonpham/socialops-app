import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Button,
  Drawer,
  IconDisconnect,
  IconFacebook,
  IconPlus,
  IconRefresh,
  Modal,
  StatusTag,
} from '@/shared/ui'
import {
  useDisconnectFacebook,
  useDisconnectFacebookPage,
  useReconnectFacebookPage,
  type FacebookIntegrationDto,
  type FacebookPageDto,
} from '../api'
import { HEALTH_TONE } from '../model/status'

export function FacebookPageManager({
  brandId,
  integration,
  open,
  onClose,
  onAdd,
}: {
  brandId: string
  integration: FacebookIntegrationDto
  open: boolean
  onClose: () => void
  onAdd: () => void
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const reconnect = useReconnectFacebookPage(brandId)
  const disconnectPage = useDisconnectFacebookPage(brandId)
  const disconnectAll = useDisconnectFacebook(brandId)
  const [confirmPage, setConfirmPage] = useState<FacebookPageDto | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        placement="right"
        width="normal"
        title={t('connection.drawerTitle')}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border-subtle p-4">
            <p className="text-body-sm text-text-tertiary">{t('connection.drawerDescription')}</p>
            <Button className="mt-4" size="sm" icon={<IconPlus />} onClick={onAdd}>
              {t('connection.addPage')}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4">
              {integration.pages.map((page) => (
                <div key={page.id} className="rounded-xl border border-border-subtle p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-info-50 text-platform-facebook">
                      <IconFacebook />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-label-md text-text-primary">
                          {page.name}
                        </strong>
                        <StatusTag tone={HEALTH_TONE[page.health]}>
                          {t(`health.${page.health}`)}
                        </StatusTag>
                      </div>
                      <p className="mt-1 text-caption text-text-tertiary">
                        {page.handle} · {formatNumber(page.followers, locale)}{' '}
                        {t('metrics.followers').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {page.health !== 'connected' ? (
                      <Button
                        size="sm"
                        icon={<IconRefresh />}
                        loading={reconnect.isPending && reconnect.variables?.pageId === page.id}
                        onClick={() => reconnect.mutate({ brandId, pageId: page.id })}
                      >
                        {t('connection.reconnect')}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<IconDisconnect />}
                      onClick={() => setConfirmPage(page)}
                    >
                      {t('connection.disconnectPage')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border-subtle p-4">
            <Button
              variant="destructive"
              icon={<IconDisconnect />}
              onClick={() => setConfirmAll(true)}
            >
              {t('connection.disconnectAll')}
            </Button>
          </div>
        </div>
      </Drawer>
      <Modal
        open={Boolean(confirmPage)}
        title={t('connection.disconnectPageTitle')}
        onClose={() => setConfirmPage(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmPage(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              loading={disconnectPage.isPending}
              onClick={() =>
                confirmPage &&
                disconnectPage.mutate(
                  { brandId, pageId: confirmPage.id },
                  { onSuccess: () => setConfirmPage(null) },
                )
              }
            >
              {t('common.confirm')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-tertiary">
          {t('connection.disconnectPageDescription', { page: confirmPage?.name ?? '' })}
        </p>
      </Modal>
      <Modal
        open={confirmAll}
        title={t('connection.disconnectAllTitle')}
        onClose={() => setConfirmAll(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmAll(false)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              loading={disconnectAll.isPending}
              onClick={() =>
                disconnectAll.mutate(brandId, {
                  onSuccess: () => {
                    setConfirmAll(false)
                    onClose()
                  },
                })
              }
            >
              {t('connection.disconnectAll')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-tertiary">
          {t('connection.disconnectAllDescription')}
        </p>
      </Modal>
    </>
  )
}
