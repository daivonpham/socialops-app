import { useMatches, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PLATFORM_LABEL_KEY, type Platform } from '@/features/social-accounts'
import type { AppRouteHandle } from './routes'

/** Placeholder body for every shell route — real pages ship in later tasks. */
export default function PlaceholderPage() {
  const { t } = useTranslation(['app', 'socialAccounts'])
  const matches = useMatches()
  const { platform } = useParams()

  const nav = [...matches]
    .reverse()
    .map((match) => (match.handle as AppRouteHandle | undefined)?.nav)
    .find((value) => value !== undefined)

  const title =
    (nav?.labelKey ? t(nav.labelKey, { ns: 'app' }) : undefined) ??
    (platform
      ? t(PLATFORM_LABEL_KEY[platform as Platform], { ns: 'socialAccounts', defaultValue: platform })
      : t('placeholder.comingSoon', { ns: 'app' }))

  return (
    <section>
      <h1 className="text-heading-1 text-text-primary">{title}</h1>
      <p className="mt-2 max-w-narrow text-body-md text-text-secondary">
        {t('placeholder.description', { ns: 'app', title })}
      </p>
    </section>
  )
}
