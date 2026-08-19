import { http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type { WorkspaceDto } from './types'

export const MOCK_WORKSPACES: WorkspaceDto[] = [
  { id: 'ws-north', name: 'North Agency' },
  { id: 'ws-south', name: 'South Studio' },
]

export const workspaceHandlers = [
  http.get('/api/workspaces', () =>
    HttpResponse.json(envelope(MOCK_WORKSPACES, '/workspaces')),
  ),
]
