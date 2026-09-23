import { notification } from 'antd'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { componentToken } from '@/shared/styles/tokens'
import type { ToastApi, ToastOptions } from '@/shared/ui/primitives/Toast'

type ToastTone = 'success' | 'info' | 'warning' | 'error'

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notificationApi, contextHolder] = notification.useNotification({
    placement: 'topRight',
    duration: componentToken.toast.durationSeconds,
    maxCount: componentToken.toast.maxCount,
    top: componentToken.toast.offset,
    stack: { threshold: componentToken.toast.stackThreshold },
  })

  const api = useMemo<ToastApi>(() => {
    const open = (tone: ToastTone, options: ToastOptions) => {
      notificationApi.open({
        type: tone,
        message: options.title,
        description: options.description,
        duration: options.duration,
        placement: options.placement,
        onClose: options.onClose,
        className: `app-toast app-toast--${tone}`,
        role: tone === 'error' || tone === 'warning' ? 'alert' : 'status',
      })
    }

    return {
      success: (options) => open('success', options),
      info: (options) => open('info', options),
      warning: (options) => open('warning', options),
      error: (options) => open('error', options),
      destroy: () => notificationApi.destroy(),
    }
  }, [notificationApi])

  return (
    <ToastContext.Provider value={api}>
      {contextHolder}
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
