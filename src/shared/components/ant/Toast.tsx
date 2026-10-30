import { notification } from 'antd'
import { createContext, useContext, useId, useMemo, useState, type ReactNode } from 'react'
import { componentToken } from '@/shared/styles/tokens'
import type { ToastAction, ToastApi, ToastOptions } from '@/shared/ui/primitives/Toast'
import { Spin } from './Spin'

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
      // Opening the same key again updates the toast in place; `duration: 0` keeps it open.
      const show = (duration = options.duration) =>
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
                  <ToastActionButton
                    action={action}
                    spaced={Boolean(options.description)}
                    onPending={() => show(0)}
                    onDone={() => notificationApi.destroy(key)}
                  />
                ) : null}
              </>
            ) : undefined,
          duration,
          placement: options.placement,
          onClose: options.onClose,
          className: `app-toast app-toast--${tone}`,
          role: tone === 'error' || tone === 'warning' ? 'alert' : 'status',
        })
      show()
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

function ToastActionButton({
  action,
  spaced,
  onPending,
  onDone,
}: {
  action: ToastAction
  spaced: boolean
  onPending: () => void
  onDone: () => void
}) {
  const [pending, setPending] = useState(false)
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className={`flex items-center gap-2 text-label-md text-link underline underline-offset-2 hover:text-link-hover focus-visible:focus-ring disabled:cursor-wait ${spaced ? 'mt-2' : ''}`}
      onClick={() => {
        if (action.href) window.open(action.href, '_blank', 'noopener,noreferrer')
        const result = action.onClick?.()
        if (!(result instanceof Promise)) return onDone()
        setPending(true)
        onPending()
        void result.finally(onDone)
      }}
    >
      {pending ? <Spin size="sm" /> : null}
      {action.label}
    </button>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
