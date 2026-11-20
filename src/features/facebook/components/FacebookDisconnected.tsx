import { useTranslation } from 'react-i18next'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { IconFacebook, PlatformDisconnected } from '@/shared/ui'
import { FACEBOOK_ACCESS } from '../config/facebook-access'

export function FacebookDisconnected({
  isConnecting,
  onConnect,
}: {
  isConnecting: boolean
  onConnect: () => void
}) {
  const { t } = useTranslation('facebook')
  const { granted } = usePermissions()

  return (
    <PlatformDisconnected
      tone="facebook"
      icon={<IconFacebook className="h-10 w-10 shrink-0 text-platform-facebook" />}
      buttonIcon={<IconFacebook />}
      canConnect={hasPermission(granted, FACEBOOK_ACCESS.manageConnection[0])}
      isConnecting={isConnecting}
      onConnect={onConnect}
      text={{
        title: t('title'),
        heroTitle: t('connection.disconnectedTitle'),
        heroDescription: t('connection.disconnectedDescription'),
        privacy: t('connection.privacy'),
        connect: t('connection.connect'),
        connecting: t('connection.connecting'),
        permissionReason: t('connection.permissionReason'),
        featuresLabel: t('connection.featuresLabel'),
        insightsTitle: t('connection.insightsTitle'),
        insightsDescription: t('connection.insightsDescription'),
        performanceTitle: t('connection.performanceTitle'),
        performanceDescription: t('connection.performanceDescription'),
        planningTitle: t('connection.planningTitle'),
        planningDescription: t('connection.planningDescription'),
        followers: t('metrics.followers'),
        views: t('metrics.mediaViews'),
        interactions: t('metrics.contentInteractions'),
        performanceInteractions: t('overview.contentInteractions'),
        posts: t('metrics.published'),
        scheduled: t('connection.scheduled'),
        draft: t('connection.draft'),
      }}
    />
  )
}
