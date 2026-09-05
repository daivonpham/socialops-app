import { useTranslation } from 'react-i18next'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { Button, Dropdown, IconFacebook, IconPlus, IconTikTok } from '@/shared/ui'
import type { PlanningPlatform } from '../api'
import { PLANNING_ACCESS } from '../config/planning-access'
import type { PlanningAccount } from '../model'

export function CreatePostButton({
  accounts,
  onSelectPlatform,
}: {
  accounts: PlanningAccount[]
  onSelectPlatform: (platform: PlanningPlatform) => void
}) {
  const { t } = useTranslation('planning')
  const { granted } = usePermissions()
  const canCreatePost = hasPermission(granted, PLANNING_ACCESS.publish[0])

  return (
    <Dropdown
      placement="bottomRight"
      items={[
        {
          key: 'facebook',
          label: t('platform.facebook'),
          icon: <IconFacebook className="text-platform-facebook" />,
          disabled: !accounts.some((account) => account.platform === 'facebook'),
        },
        {
          key: 'tiktok',
          label: t('platform.tiktok'),
          icon: <IconTikTok />,
          disabled: !accounts.some((account) => account.platform === 'tiktok'),
        },
      ]}
      onSelect={(key) => onSelectPlatform(key as PlanningPlatform)}
    >
      <Button
        variant="primary"
        icon={<IconPlus />}
        disabled={!canCreatePost}
        title={!canCreatePost ? t('create.noPermission') : undefined}
      >
        {t('create.button')}
      </Button>
    </Dropdown>
  )
}
