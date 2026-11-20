import { useTranslation } from 'react-i18next'
import { AccountSwitcher, IconFacebook } from '@/shared/ui'
import type { FacebookPageDto } from '../api'

export function FacebookPageSwitcher({
  pages,
  selectedPageId,
  onPageChange,
  onAddPage,
  canManagePages,
}: {
  pages: FacebookPageDto[]
  selectedPageId: string
  onPageChange: (pageId: string) => void
  onAddPage: () => void
  canManagePages: boolean
}) {
  const { t } = useTranslation('facebook')

  return (
    <AccountSwitcher
      accounts={pages}
      selectedId={selectedPageId}
      allLabel={t('common.allPages')}
      platformIcon={<IconFacebook className="text-platform-facebook" />}
      searchPlaceholder={t('connection.searchPages')}
      ariaLabel={t('connection.pageSwitcherLabel')}
      addLabel={canManagePages ? t('connection.addPage') : undefined}
      onChange={onPageChange}
      onAdd={onAddPage}
    />
  )
}
