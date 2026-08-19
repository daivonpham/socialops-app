import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { RequireBrand, RouteAccessGuard } from '@/app/router/guards'
import { Drawer } from '@/shared/ui'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/** Shell chrome: top bar + left sidebar + content. No data fetching here. */
export default function AdminLayout() {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  return (
    <RequireBrand>
      <div className="flex h-screen flex-col bg-bg-page text-text-primary">
        <TopBar onOpenSidebar={() => setMobileNavOpen(true)} />
        <div className="flex min-h-0 flex-1">
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">
            <RouteAccessGuard>
              <Outlet />
            </RouteAccessGuard>
          </main>
        </div>

        <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <Sidebar inDrawer showScopeControls />
        </Drawer>
      </div>
    </RequireBrand>
  )
}
