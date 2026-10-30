import { notification } from 'antd'
import { createContext, useContext, useId, useMemo, type ReactNode } from 'react'
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

  const keyPrefix = useId()

  const api = useMemo<ToastApi>(() => {
    let sequence = 0
    const open = (tone: ToastTone, options: ToastOptions) => {
      const key = `${keyPrefix}-${(sequence += 1)}`
      const { action } = options
      notificationApi.open({
        key,
        type: tone,
        message: options.title,
        // The action sits in the description slot so it aligns under the title, not the corner.
        description:
          options.description || action ? (
            <>
              {options.description}
              {action ? (
                <button
                  type="button"
                  className={`block text-label-md text-link underline underline-offset-2 hover:text-link-hover focus-visible:focus-ring ${options.description ? 'mt-2' : ''}`}
                  onClick={() => {
                    if (action.href) window.open(action.href, '_blank', 'noopener,noreferrer')
                    action.onClick?.()
                    notificationApi.destroy(key)
                  }}
                >
                  {action.label}
                </button>
              ) : null}
            </>
          ) : undefined,
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
  }, [keyPrefix, notificationApi])

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
