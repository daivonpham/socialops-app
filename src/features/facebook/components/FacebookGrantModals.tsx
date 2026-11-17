import { useTranslation } from 'react-i18next'
import { Avatar, Button, IconFacebook, Modal } from '@/shared/ui'
import type { FacebookOtherBrandPage } from '../api'

/**
 * Before logging in to Facebook: the login replaces the user's whole Page grant, so Pages
 * other Brands use must be ticked again or they stop working there.
 */
export function FacebookGrantNoticeModal({
  open,
  pages,
  loading,
  onContinue,
  onClose,
}: {
  open: boolean
  pages: FacebookOtherBrandPage[]
  loading: boolean
  onContinue: () => void
  onClose: () => void
}) {
  const { t } = useTranslation('facebook')
  return (
    <Modal
      open={open}
      title={t('grant.noticeTitle')}
      headerIcon={<IconFacebook className="text-platform-facebook" />}
      headerDescription={t('grant.noticeDescription')}
      width={520}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" loading={loading} onClick={onContinue}>
            {t('grant.continue')}
          </Button>
        </div>
      }
    >
      <ul className="grid gap-2">
        {pages.map((page) => (
          <li
            key={page.id}
            className="flex items-center gap-3 rounded-lg border border-border-subtle px-4 py-3"
          >
            <Avatar name={page.name} src={page.avatarUrl} size="md" />
            <span className="grid min-w-0 gap-1">
              <span className="truncate text-label-md text-text-primary">{page.name}</span>
              <span className="truncate text-caption text-text-tertiary">
                {t('grant.usedIn', { brands: page.brandNames.join(', ') })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

/** After logging in: Pages left unticked lost access in every Brand using them. */
export function FacebookLostPagesModal({
  pages,
  loading,
  onReconnect,
  onClose,
}: {
  pages: string[]
  loading: boolean
  onReconnect: () => void
  onClose: () => void
}) {
  const { t } = useTranslation('facebook')
  return (
    <Modal
      open={pages.length > 0}
      title={t('grant.lostTitle', { count: pages.length })}
      headerDescription={t('grant.lostDescription')}
      width={520}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>{t('grant.later')}</Button>
          <Button variant="primary" loading={loading} onClick={onReconnect}>
            {t('grant.reconnect')}
          </Button>
        </div>
      }
    >
      <ul className="grid gap-2">
        {pages.map((name) => (
          <li
            key={name}
            className="rounded-lg border border-border-subtle px-4 py-3 text-label-md text-text-primary"
          >
            {name}
          </li>
        ))}
      </ul>
    </Modal>
  )
}
