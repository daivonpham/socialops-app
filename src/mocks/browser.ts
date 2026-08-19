import { setupWorker } from 'msw/browser'
import { brandHandlers } from '@/features/brands/api/mocks'
import { socialAccountHandlers } from '@/features/social-accounts/api/mocks'
import { workspaceHandlers } from '@/features/workspaces/api/mocks'

// Dev-only module: imported dynamically from main.tsx, so no mock code (or
// msw itself) ends up in the production bundle.
export const worker = setupWorker(
  ...workspaceHandlers,
  ...brandHandlers,
  ...socialAccountHandlers,
)
