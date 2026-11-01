import { http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type { WorkspaceDto } from './types'

export const MOCK_WORKSPACES: WorkspaceDto[] = [
  { id: 'ws-north', name: 'North Agency', role: 'owner' },
  { id: 'ws-south', name: 'South Studio', role: 'full_access' },
]

export const workspaceHandlers = [
  http.get('/api/workspaces', () => HttpResponse.json(envelope(MOCK_WORKSPACES, '/workspaces'))),
  http.get('/api/invitations/mine', () => HttpResponse.json(envelope([], '/invitations/mine'))),
]
