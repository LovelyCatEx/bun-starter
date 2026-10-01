import { useMemo, type ReactNode } from 'react'

import {
  AnimatedToastStack,
  useAnimatedToastStack,
  type ToastStatus,
} from '@/components/motion/animated-toast-stack'

import { ToastContext, type Toast, type ToastOptions } from '@/hooks/use-toast'

/**
 * 全局 toast 的唯一持有者（`useToast()` 从这里取状态），挂在 `main.tsx` 最外层。
 *
 * `fixed` 必须传：beUI 的 `placement` 默认是 `static`，不传这个栈就落在文档流里。
 * Portal 到 `body` 不影响主题 —— `data-theme` / `data-dark-shade` 挂在 `<html>` 上。
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, showToast, dismissToast, clearToasts } = useAnimatedToastStack()

  const toast: Toast = useMemo(() => {
    const show = (title: string, status: ToastStatus = 'neutral', options?: ToastOptions) =>
      showToast({ title, status, ...options })

    return {
      show,
      success: (title, options) => show(title, 'success', options),
      error: (title, options) => show(title, 'error', options),
      info: (title, options) => show(title, 'info', options),
      loading: (title, options) => show(title, 'loading', options),
      dismiss: dismissToast,
      clear: clearToasts,
    }
  }, [showToast, dismissToast, clearToasts])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <AnimatedToastStack toasts={toasts} onDismiss={dismissToast} fixed />
    </ToastContext.Provider>
  )
}
