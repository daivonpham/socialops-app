import { useTranslation } from 'react-i18next'
import { IconTikTok, PlatformDisconnected } from '@/shared/ui'

/** The TikTok screen before any account is connected; same layout as Facebook's. */
export function TikTokDisconnected({
  canConnect,
  isConnecting,
  onConnect,
}: {
  canConnect: boolean
  isConnecting: boolean
  onConnect: () => void
}) {
  const { t } = useTranslation('tiktok')

  return (
    <PlatformDisconnected
      tone="tiktok"
      icon={<IconTikTok className="h-10 w-10 shrink-0 text-platform-tiktok" />}
      buttonIcon={<IconTikTok />}
      canConnect={canConnect}
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
        views: t('metrics.views'),
        interactions: t('metrics.engagements'),
        posts: t('metrics.videos'),
        scheduled: t('connection.scheduled'),
        draft: t('connection.draft'),
      }}
    />
  )
}
