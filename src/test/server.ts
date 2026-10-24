import { setupServer } from 'msw/node'

/** Network boundary for component tests; each test registers the handlers it needs. */
export const server = setupServer()
