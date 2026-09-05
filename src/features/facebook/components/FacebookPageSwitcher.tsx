import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { Button, Dropdown, IconCaretUpDown, IconFacebook, IconPlus } from '@/shared/ui'
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
  const selectedPage = pages.find((page) => page.id === selectedPageId)
  const selectedPageLabel = selectedPage?.name ?? t('common.allPages')

  return (
    <Dropdown
      searchPlaceholder={t('connection.searchPages')}
      items={[
        {
          key: 'all',
          label: t('common.allPages'),
          icon: <IconFacebook className="text-platform-facebook" />,
        },
        { type: 'divider' },
        ...pages.map((page) => ({
          key: page.id,
          label: <SocialAccountLabel name={page.name} avatarUrl={page.avatarUrl} />,
          searchText: page.name,
        })),
      ]}
      selectedKey={selectedPageId}
      onSelect={(key) => {
        if (key !== selectedPageId) onPageChange(key)
      }}
      footer={
        canManagePages
          ? {
              label: t('connection.addPage'),
              icon: <IconPlus />,
              onClick: onAddPage,
            }
          : undefined
      }
    >
      <Button
        size="md"
        variant="secondary"
        aria-label={t('connection.pageSwitcherLabel')}
        className="min-w-56"
      >
        <span className="flex w-full min-w-0 items-center gap-2">
          {selectedPage ? (
            <SocialAccountLabel
              name={selectedPage.name}
              avatarUrl={selectedPage.avatarUrl}
              className="flex-1"
            />
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <IconFacebook className="shrink-0 text-platform-facebook" />
              <span className="truncate text-start">{selectedPageLabel}</span>
            </span>
          )}
          <IconCaretUpDown aria-hidden className="shrink-0 text-icon-sm text-text-tertiary" />
        </span>
      </Button>
    </Dropdown>
  )
}
