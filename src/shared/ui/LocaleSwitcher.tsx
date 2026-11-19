import { useTranslation } from 'react-i18next'
import { normalizeLocale, resolveLocale, SUPPORTED_LOCALES, type AppLocale } from '@/shared/i18n'
import { Button } from './primitives/Button'
import { Dropdown, type DropdownMenuItem } from './primitives/Dropdown'
import { IconChevronDown, IconGlobe } from './primitives/icons'

function localeDisplayName(locale: AppLocale, t: ReturnType<typeof useTranslation<'common'>>['t']) {
  return locale === 'en-US' ? t('locales.enUS') : t('locales.viVN')
}

export function useLocaleMenu() {
  const { t, i18n } = useTranslation('common')
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language)
  const items: DropdownMenuItem[] = SUPPORTED_LOCALES.map((option) => ({
    key: option,
    label: localeDisplayName(option, t),
  }))

  const selectLocale = (key: string) => {
    const nextLocale = normalizeLocale(key)
    if (nextLocale && nextLocale !== locale) void i18n.changeLanguage(nextLocale)
  }

  return {
    locale,
    localeLabel: localeDisplayName(locale, t),
    items,
    selectLocale,
  }
}

/** Language menu. `compact` shows only the globe and chevron, for tight headers. */
export function LocaleSwitcher({
  className = '',
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { t } = useTranslation('common')
  const { locale, localeLabel, items, selectLocale } = useLocaleMenu()

  return (
    <Dropdown placement="bottomRight" selectedKey={locale} items={items} onSelect={selectLocale}>
      {compact ? (
        <Button
          variant="ghost"
          aria-label={t('locales.changeLanguage')}
          title={localeLabel}
          className={`h-9 px-2 ${className}`.trim()}
        >
          <span className="flex items-center gap-1 text-text-secondary">
            <IconGlobe aria-hidden className="text-icon-md" />
            <IconChevronDown aria-hidden className="text-icon-sm" />
          </span>
        </Button>
      ) : (
        <Button
          icon={<IconGlobe aria-hidden />}
          aria-label={t('locales.changeLanguage')}
          className={`h-9 ${className}`.trim()}
        >
          <span className="flex items-center gap-2">
            <span>{localeLabel}</span>
            <IconChevronDown aria-hidden className="text-icon-sm" />
          </span>
        </Button>
      )}
    </Dropdown>
  )
}
