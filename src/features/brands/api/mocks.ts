import { http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import { PERMISSIONS } from '@/shared/permissions'
import type { BrandDetailDto, BrandDto } from './types'

/**
 * Per-brand grants differ on purpose so switching brand visibly rescopes the
 * UI: Nimbus has no members access, Solstice has no reports access.
 */
export const MOCK_BRANDS: BrandDetailDto[] = [
  {
    id: 'br-aurora',
    workspaceId: 'ws-north',
    name: 'Aurora Coffee',
    permissions: [
      PERMISSIONS.REPORTS_VIEW.key,
      PERMISSIONS.MEMBERS_VIEW.key,
      PERMISSIONS.SETTINGS_VIEW.key,
    ],
  },
  {
    id: 'br-nimbus',
    workspaceId: 'ws-north',
    name: 'Nimbus Wear',
    permissions: [PERMISSIONS.REPORTS_VIEW.key, PERMISSIONS.SETTINGS_VIEW.key],
  },
  {
    id: 'br-solstice',
    workspaceId: 'ws-south',
    name: 'Solstice Spa',
    permissions: [PERMISSIONS.MEMBERS_VIEW.key, PERMISSIONS.SETTINGS_VIEW.key],
  },
]

export const brandHandlers = [
  http.get('/api/workspaces/:workspaceId/brands', ({ params }) => {
    const list: BrandDto[] = MOCK_BRANDS.filter(
      (brand) => brand.workspaceId === params.workspaceId,
    ).map(({ id, workspaceId, name }) => ({ id, workspaceId, name }))
    return HttpResponse.json(envelope(list, `/workspaces/${String(params.workspaceId)}/brands`))
  }),
  http.get('/api/brands/:brandId', ({ params }) => {
    const brand = MOCK_BRANDS.find((candidate) => candidate.id === params.brandId)
    if (!brand) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(envelope(brand, `/brands/${String(params.brandId)}`))
  }),
]
