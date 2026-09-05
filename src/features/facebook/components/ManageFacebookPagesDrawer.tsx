import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
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

export function ManageFacebookPagesDrawer({
  brandId,
  integration,
  isOpen,
  onClose,
  onAddPage,
  isAddingPage = false,
}: {
  brandId: string
  integration: FacebookIntegrationDto
  isOpen: boolean
  onClose: () => void
  onAddPage: () => void
  isAddingPage?: boolean
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const reconnect = useReconnectFacebookPage(brandId)
  const disconnectPage = useDisconnectFacebookPage(brandId)
  const disconnectAll = useDisconnectFacebook(brandId)
  const [pageToDisconnect, setPageToDisconnect] = useState<FacebookPageDto | null>(null)
  const [isDisconnectAllConfirmationOpen, setIsDisconnectAllConfirmationOpen] = useState(false)

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        placement="right"
        width="normal"
        title={t('connection.drawerTitle')}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border-subtle bg-bg-surface-subtle p-4">
            <div className="flex items-start gap-3">
              <IconFacebook className="shrink-0 text-icon-lg text-platform-facebook" />
              <div className="min-w-0">
                <p className="text-label-md text-text-primary">
                  {t('connection.connectedCount', { count: integration.pages.length })}
                </p>
                <p className="mt-1 text-body-sm text-text-tertiary">
                  {t('connection.drawerDescription')}
                </p>
              </div>
            </div>
            <Button
              className="mt-4"
              size="sm"
              icon={<IconPlus />}
              loading={isAddingPage}
              onClick={onAddPage}
            >
              {t('connection.addPage')}
            </Button>
          </div>
          <div className="app-scrollbar flex-1 overflow-y-auto p-4">
            <div className="grid gap-3">
              {integration.pages.map((page) => (
                <div
                  key={page.id}
                  className="rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={page.name} src={page.avatarUrl} size="md" />
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
                        @{page.username} · {formatNumber(page.followersCount, locale)}{' '}
                        {t('metrics.followers').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border-subtle pt-3">
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
                      onClick={() => setPageToDisconnect(page)}
                    >
                      {t('connection.disconnectPage')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border-subtle bg-bg-surface p-4">
            <Button
              className="w-full"
              variant="destructive"
              icon={<IconDisconnect />}
              onClick={() => setIsDisconnectAllConfirmationOpen(true)}
            >
              {t('connection.disconnectAll')}
            </Button>
          </div>
        </div>
      </Drawer>
      <Modal
        open={Boolean(pageToDisconnect)}
        title={t('connection.disconnectPageTitle')}
        onClose={() => setPageToDisconnect(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPageToDisconnect(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              loading={disconnectPage.isPending}
              onClick={() =>
                pageToDisconnect &&
                disconnectPage.mutate(
                  { brandId, pageId: pageToDisconnect.id },
                  { onSuccess: () => setPageToDisconnect(null) },
                )
              }
            >
              {t('common.confirm')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-tertiary">
          {t('connection.disconnectPageDescription', { page: pageToDisconnect?.name ?? '' })}
        </p>
      </Modal>
      <Modal
        open={isDisconnectAllConfirmationOpen}
        title={t('connection.disconnectAllTitle')}
        onClose={() => setIsDisconnectAllConfirmationOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsDisconnectAllConfirmationOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              loading={disconnectAll.isPending}
              onClick={() =>
                disconnectAll.mutate(brandId, {
                  onSuccess: () => {
                    setIsDisconnectAllConfirmationOpen(false)
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
