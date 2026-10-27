import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RouteAccessGuard } from '@/app/router/guards'
import { BrandOnboardingModal } from '@/features/brands/components/BrandOnboardingModal'
import { useActiveWorkspace } from '@/shared/scope'
import { motion } from '@/shared/styles/tokens'
import { Button, Drawer, IconSidebarCollapse, IconSidebarExpand } from '@/shared/ui'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/** Shell chrome: top bar + left sidebar + content. No data fetching here. */
export default function AdminLayout() {
  const { t } = useTranslation('app')
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [desktopSidebarHover, setDesktopSidebarHover] = useState(false)
  const { workspaceId } = useActiveWorkspace()
  const desktopSidebarExpanded = desktopSidebarOpen || desktopSidebarHover
  const hoverCloseTimer = useRef<number | null>(null)

  const openDesktopPreview = () => {
    if (hoverCloseTimer.current !== null) {
      window.clearTimeout(hoverCloseTimer.current)
      hoverCloseTimer.current = null
    }
    if (!desktopSidebarOpen) setDesktopSidebarHover(true)
  }

  const closeDesktopPreview = () => {
    if (hoverCloseTimer.current !== null) window.clearTimeout(hoverCloseTimer.current)
    // Brief delay so moving between the TopBar rail and Sidebar does not flicker shut.
    hoverCloseTimer.current = window.setTimeout(() => {
      setDesktopSidebarHover(false)
      hoverCloseTimer.current = null
    }, motion.duration.fast)
  }

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current !== null) window.clearTimeout(hoverCloseTimer.current)
    }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-bg-surface text-text-primary">
      <BrandOnboardingModal workspaceId={workspaceId} />
      <TopBar
        onOpenSidebar={() => setMobileNavOpen(true)}
        desktopSidebarExpanded={desktopSidebarExpanded}
        onPreviewOpen={openDesktopPreview}
        onPreviewClose={closeDesktopPreview}
      />
      <div className="flex min-h-0 flex-1">
        <div className="hidden min-h-0 md:flex md:flex-col">
          <Sidebar
            collapsed={!desktopSidebarExpanded}
            onPreviewOpen={openDesktopPreview}
            onPreviewClose={closeDesktopPreview}
          />
          {/* Outside the sidebar hover target so the control never fights preview open/close. */}
          <div
            className={
              'shrink-0 border-e border-border-subtle bg-bg-surface transition-[width,padding] duration-drawer ease-standard ' +
              (desktopSidebarExpanded ? 'w-sidebar px-3 pb-3' : 'w-sidebar-collapsed px-2 pb-2')
            }
          >
            <div className="mb-2 h-px bg-border-subtle" />
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                aria-label={desktopSidebarOpen ? t('sidebar.collapse') : t('sidebar.expand')}
                onClick={() => {
                  if (hoverCloseTimer.current !== null) {
                    window.clearTimeout(hoverCloseTimer.current)
                    hoverCloseTimer.current = null
                  }
                  setDesktopSidebarOpen((current) => !current)
                  setDesktopSidebarHover(false)
                }}
              >
                <span aria-hidden className="flex items-center text-icon-md text-text-secondary">
                  {desktopSidebarOpen ? <IconSidebarCollapse /> : <IconSidebarExpand />}
                </span>
              </Button>
            </div>
          </div>
        </div>
        <main
          data-popup-root
          className="app-scrollbar relative min-w-0 flex-1 overflow-y-auto p-4 md:p-5 xl:p-6"
        >
          <RouteAccessGuard>
            <Outlet />
          </RouteAccessGuard>
        </main>
      </div>

      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <Sidebar inDrawer showScopeControls />
      </Drawer>
    </div>
  )
}
