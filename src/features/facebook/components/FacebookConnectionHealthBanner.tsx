import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/i18n'
import { Alert, Button, IconRefresh } from '@/shared/ui'
import type { FacebookPageDto } from '../api'

const PAUSED = new Set<FacebookPageDto['health']>(['token_expired', 'permission_missing'])

/**
 * Tells the Brand when Facebook must be connected again: paused Pages (dead token or lost
 * permission) first, otherwise a grant that is about to expire. Reconnecting is a new
 * Facebook login, which restores every affected Page of this Brand at once.
 */
export function FacebookConnectionHealthBanner({
  pages,
  canManage,
  reconnecting,
  onReconnect,
}: {
  pages: FacebookPageDto[]
  canManage: boolean
  reconnecting: boolean
  onReconnect: () => void
}) {
  const { t, i18n } = useTranslation('facebook')
  const paused = pages.filter((page) => PAUSED.has(page.health))
  const expiring = pages.filter((page) => page.health === 'token_expiring')
  if (!paused.length && !expiring.length) return null

  const names = new Intl.ListFormat(i18n.resolvedLanguage, { type: 'conjunction' }).format(
    (paused.length ? paused : expiring).map((page) => page.name),
  )
  const deadline = expiring
    .map((page) => page.reconnectBy)
    .filter((value): value is string => Boolean(value))
    .sort()[0]
  const action = canManage ? (
    <Button
      size="sm"
      icon={<IconRefresh aria-hidden />}
      loading={reconnecting}
      onClick={onReconnect}
    >
      {t('tokenHealth.reconnect')}
    </Button>
  ) : undefined
  const help = canManage ? '' : ` ${t('tokenHealth.askManager')}`

  return paused.length ? (
    <Alert
      variant="soft"
      tone="warning"
      title={t('tokenHealth.pausedTitle', { count: paused.length })}
      description={`${t('tokenHealth.pausedDescription', { pages: names })}${help}`}
      action={action}
    />
  ) : (
    <Alert
      variant="soft"
      tone="warning"
      title={
        deadline
          ? t('tokenHealth.expiringTitle', { date: formatDate(deadline, i18n.resolvedLanguage) })
          : t('tokenHealth.expiringSoonTitle')
      }
      description={`${t('tokenHealth.expiringDescription', { pages: names })}${help}`}
      action={action}
    />
  )
}
