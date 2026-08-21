// The ONE file outside shared/adapters allowed to import antd (ESLint carve-out):
// it wires ConfigProvider (token mapping) + StyleProvider (CSS layer) once.
import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider } from 'antd'
import enUS from 'antd/es/locale/en_US'
import viVN from 'antd/es/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { antTheme } from '@/shared/components/ant/theme'
import { LOCALE_META, resolveLocale } from '@/shared/i18n'

const ANT_LOCALE = {
  'en-US': enUS,
  'vi-VN': viVN,
} as const

/**
 * `layer` puts every antd style inside the `antd` CSS layer; the order
 * declared in shared/styles/index.css (theme, base, antd, components,
 * utilities) makes antd win over Tailwind's preflight while Tailwind
 * utilities keep winning over antd.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language)

  useEffect(() => {
    dayjs.locale(LOCALE_META[locale].dayjsLocale)
  }, [locale])

  return (
    <StyleProvider layer>
      <ConfigProvider
        direction={LOCALE_META[locale].direction}
        locale={ANT_LOCALE[locale]}
        theme={antTheme}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  )
}
