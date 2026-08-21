// React 19 compatibility patch for antd v5 — must load before any antd usage.
import '@ant-design/v5-patch-for-react-19'
import '@/shared/styles/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import { initializeAppI18n } from '@/app/i18n'

async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

void Promise.all([enableMocking(), initializeAppI18n()]).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
