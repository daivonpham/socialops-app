import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/i18n'
import { Alert, Button, IconRefresh } from '@/shared/ui'
import type { TikTokAccountDto } from '../api'

/**
 * Tells the Brand when TikTok must be connected again: accounts TikTok cut off or that miss
 * permissions first, otherwise a grant about to expire. Reconnecting is a new TikTok login.
 */
export function TikTokConnectionHealthBanner({
  accounts,
  canManage,
  reconnecting,
  onReconnect,
}: {
  accounts: TikTokAccountDto[]
  canManage: boolean
  reconnecting: boolean
  onReconnect: () => void
}) {
  const { t, i18n } = useTranslation('tiktok')
  const cut = accounts.filter((account) => account.health === 'reconnect_required')
  const missing = accounts.filter((account) => account.health === 'permission_missing')
  const expiring = accounts.filter((account) => account.health === 'token_expiring')
  const affected = cut.length ? cut : missing.length ? missing : expiring
  if (!affected.length) return null

  const names = new Intl.ListFormat(i18n.resolvedLanguage, { type: 'conjunction' }).format(
    affected.map((account) => account.name),
  )
  const deadline = expiring
    .map((account) => account.refreshExpiresAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0]
  const description = cut.length
    ? t('health.bannerReconnect', { names })
    : missing.length
      ? t('health.bannerPermission', { names })
      : t('health.bannerExpiring', { names })

  return (
    <Alert
      variant="soft"
      tone="warning"
      title={
        !cut.length && !missing.length && deadline
          ? t('health.token_expiring', { date: formatDate(deadline, i18n.resolvedLanguage) })
          : t('health.bannerTitle', { count: affected.length })
      }
      description={canManage ? description : `${description} ${t('health.readOnly')}`}
      action={
        canManage ? (
          <Button
            size="sm"
            icon={<IconRefresh aria-hidden />}
            loading={reconnecting}
            onClick={onReconnect}
          >
            {t('health.reconnect')}
          </Button>
        ) : undefined
      }
    />
  )
}
