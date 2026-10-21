import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { Button, Dropdown, IconFacebook, IconPlusCircle, IconTikTok } from '@/shared/ui'
import type { PlanningPlatform } from '../api'
import { PLANNING_ACCESS } from '../config/planning-access'
import { canPublishOnPlatform } from '../config/planning-capabilities'
import { getPlanningCreatePath } from '../config/planning.routes'
import type { PlanningAccount } from '../model'

export function CreatePostButton({
  accounts,
  platform,
}: {
  accounts: PlanningAccount[]
  platform: 'all' | PlanningPlatform
}) {
  const { t } = useTranslation('planning')
  const navigate = useNavigate()
  const { granted } = usePermissions()
  const canCreatePost = hasPermission(granted, PLANNING_ACCESS.publish[0])

  const openComposer = (targetPlatform: PlanningPlatform) => {
    navigate(getPlanningCreatePath(targetPlatform))
  }

  const trigger = (
    <Button
      variant="primary"
      icon={<IconPlusCircle />}
      disabled={!canCreatePost || (platform !== 'all' && !canPublishOnPlatform(platform))}
      title={
        !canCreatePost
          ? t('create.noPermission')
          : platform === 'tiktok'
            ? t('create.platformUnavailable')
            : undefined
      }
      onClick={platform === 'all' ? undefined : () => openComposer(platform)}
    >
      {t('create.button')}
    </Button>
  )

  if (platform !== 'all') return trigger

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
          disabled:
            !canPublishOnPlatform('tiktok') ||
            !accounts.some((account) => account.platform === 'tiktok'),
        },
      ]}
      onSelect={(key) => openComposer(key as PlanningPlatform)}
    >
      {trigger}
    </Dropdown>
  )
}
