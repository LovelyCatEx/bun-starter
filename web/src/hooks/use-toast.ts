import { createContext, useContext } from 'react'

import type { ToastStatus } from '@/components/motion/animated-toast-stack'

/** 一条 toast 的可选部分；标题单独传，见下面各快捷方法 */
export interface ToastOptions {
  /** 第二行小字 */
  description?: string
  /** 毫秒；不传就用 provider 的默认值 */
  duration?: number
  /** 是否显示关闭按钮 */
  dismissible?: boolean
}

export interface Toast {
  /** 最通用的一条：状态自己指定，其余几个方法都是它的简写 */
  show: (title: string, status?: ToastStatus, options?: ToastOptions) => string
  success: (title: string, options?: ToastOptions) => string
  error: (title: string, options?: ToastOptions) => string
  info: (title: string, options?: ToastOptions) => string
  loading: (title: string, options?: ToastOptions) => string
  /** 收掉某一条；`show` / `success`… 的返回值就是 id */
  dismiss: (id: string) => void
  /** 收掉当前所有 */
  clear: () => void
}

export const ToastContext = createContext<Toast | null>(null)

/**
 * 全局 toast 的入口，组件里弹提示只有这一条路；状态在 `<ToastProvider>` 里，全局同一个栈。
 *
 * **文案由调用方翻好再传进来**，不在这里认 i18n 的 key —— 弹出的那一刻文案就定死了
 * （同 `hooks/notification/`，见 frontend.md「浏览器通知」）。
 */
export function useToast(): Toast {
  const toast = useContext(ToastContext)
  if (!toast) {
    throw new Error('useToast 必须在 <ToastProvider> 里使用')
  }
  return toast
}
