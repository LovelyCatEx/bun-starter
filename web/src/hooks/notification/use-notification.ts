import { useMemo, useSyncExternalStore } from 'react'

import {
  closeNotifications,
  isNotificationSupported,
  notifyUser,
  readNotificationPermission,
  requestNotificationPermission,
  subscribeNotification,
  type NotifyInput,
} from './notification'

export interface NotifyApi {
  /** False when the browser has no Notification API, or the page is not a secure context. */
  supported: boolean
  /** `'default'` = never asked, `'granted'`, `'denied'` (final — the user has to change settings). */
  permission: NotificationPermission
  /** Must be called from a user gesture; see the module. */
  requestPermission: () => Promise<NotificationPermission>
  /** True when a notification actually appeared, false when the policy or permission said no. */
  notify: (input: NotifyInput) => boolean
  /** Closes the notifications this page showed: one tag, or all. */
  close: (tag?: string) => void
}

/**
 * The component-side entry point to browser notifications, next to the module that owns them.
 *
 * ```tsx
 * const { supported, permission, requestPermission, notify } = useNotification()
 *
 * // 权限只能在用户手势里申请，所以接到按钮上
 * <Button onClick={() => void requestPermission()}>开启通知</Button>
 * ```
 *
 * Everything here is page-agnostic: which event turns into which notification, and where
 * clicking it goes, is business — that belongs in the page (see the placement rules).
 */
export function useNotification(): NotifyApi {
  // Permission lives outside React: `useSyncExternalStore` re-reads the snapshot after
  // subscribing, so a change between the first render and the subscription cannot be missed.
  const permission = useSyncExternalStore(
    subscribeNotification,
    readNotificationPermission,
    readNotificationPermission,
  )

  return useMemo(
    () => ({
      supported: isNotificationSupported(),
      permission,
      requestPermission: requestNotificationPermission,
      notify: notifyUser,
      close: closeNotifications,
    }),
    [permission],
  )
}
