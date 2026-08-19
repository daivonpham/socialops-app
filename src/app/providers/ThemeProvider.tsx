// The ONE file outside shared/adapters allowed to import antd (ESLint carve-out):
// it wires ConfigProvider (token mapping) + StyleProvider (CSS layer) once.
import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { antTheme } from '@/shared/components/ant/theme'

/**
 * `layer` puts every antd style inside the `antd` CSS layer; the order
 * declared in shared/styles/index.css (theme, base, antd, components,
 * utilities) makes antd win over Tailwind's preflight while Tailwind
 * utilities keep winning over antd.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <StyleProvider layer>
      <ConfigProvider theme={antTheme}>{children}</ConfigProvider>
    </StyleProvider>
  )
}
