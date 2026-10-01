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
 * Which event turns into which notification belongs to the page — see `.claude/rules/frontend.md`.
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
