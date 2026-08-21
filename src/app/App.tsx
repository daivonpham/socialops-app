import { RouterProvider } from 'react-router-dom'
import { I18nProvider } from './providers/I18nProvider'
import { PermissionProvider } from './providers/PermissionProvider'
import { QueryProvider } from './providers/QueryProvider'
import { ScopeProvider } from './providers/ScopeProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { router } from './router/routes'

export default function App() {
  return (
    <I18nProvider>
      <QueryProvider>
        <ThemeProvider>
          <ScopeProvider>
            <PermissionProvider>
              <RouterProvider router={router} />
            </PermissionProvider>
          </ScopeProvider>
        </ThemeProvider>
      </QueryProvider>
    </I18nProvider>
  )
}
