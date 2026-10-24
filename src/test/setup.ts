import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resources } from '@/app/i18n/resources'
import { i18n, initializeI18n } from '@/shared/i18n'
import { server } from './server'

// Ant Design reads these browser APIs that jsdom does not implement.
if (!window.matchMedia)
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
// jsdom cannot compute pseudo-element styles and logs on every call; Ant asks for them often.
const getComputedStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = (element: Element) => getComputedStyle(element)
if (!window.ResizeObserver)
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' })
  await initializeI18n(resources)
  await i18n.changeLanguage('en-US')
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  sessionStorage.clear()
  localStorage.clear()
})
afterAll(() => server.close())
