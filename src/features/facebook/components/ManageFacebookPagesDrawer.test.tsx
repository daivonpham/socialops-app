import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui'
import { ManageFacebookPagesDrawer } from './ManageFacebookPagesDrawer'
import type { FacebookIntegrationDto, FacebookPageDto } from '../api'

const mutation = { mutate: vi.fn(), isPending: false, variables: undefined }
const syncPages = vi.hoisted(() => ({ value: [] as unknown[] }))

vi.mock('../api', async (importActual) => ({
  ...(await importActual<typeof import('../api')>()),
  useDisconnectFacebook: () => mutation,
  useDisconnectFacebookPage: () => mutation,
  useReconnectFacebookPage: () => mutation,
  useRequestFacebookSync: () => mutation,
  useFacebookSyncStatus: () => ({ data: { pages: syncPages.value } }),
}))

const page = (id: string): FacebookPageDto => ({
  id,
  name: `Page ${id}`,
  username: '',
  category: '',
  followersCount: 1,
  health: 'connected',
  lastSyncedAt: '',
})
const sync = (pageId: string, refreshAvailableAt: string | null = null) => ({
  pageId,
  name: pageId,
  status: 'idle',
  failureCount: 0,
  lastSyncedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  historyStartAt: null,
  backfillCompleted: true,
  lastErrorCode: null,
  refreshAvailableAt,
})

const open = (pages: FacebookPageDto[], canManage: boolean) =>
  render(
    <ToastProvider>
      <ManageFacebookPagesDrawer
        brandId="brand"
        integration={{ state: 'connected', pages } as FacebookIntegrationDto}
        isOpen
        onClose={() => undefined}
        onAddPage={() => undefined}
        canManage={canManage}
      />
    </ToastProvider>,
  )

const refreshButton = () =>
  screen.getByRole('button', { name: /(sync\.refresh|làm mới dữ liệu|refresh data)$/i })
const helpButton = () =>
  screen.getByRole('button', { name: /refreshHint|lấy bài đăng|fetches recent posts/i })

describe('ManageFacebookPagesDrawer', () => {
  beforeEach(() => {
    syncPages.value = [sync('a')]
  })

  it('lets someone who only views numbers refresh, without connection controls', () => {
    open([page('a')], false)
    expect(refreshButton()).toBeEnabled()
    expect(screen.queryByRole('button', { name: /addPage|kết nối thêm|add/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /disconnect|ngắt kết nối/i })).toBeNull()
  })

  it('has one refresh for all Pages, locked while each was just updated', () => {
    const soon = new Date(Date.now() + 18 * 60_000).toISOString()
    syncPages.value = [sync('a', soon), sync('b', soon)]
    open([page('a'), page('b')], true)
    expect(refreshButton()).toBeDisabled()
    // Its explanation stays reachable while locked.
    expect(helpButton()).toBeEnabled()
  })

  it('stays available when any Page can be refreshed', () => {
    syncPages.value = [sync('a', new Date(Date.now() + 18 * 60_000).toISOString()), sync('b')]
    open([page('a'), page('b')], false)
    expect(refreshButton()).toBeEnabled()
  })
})
