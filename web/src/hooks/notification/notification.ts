/**
 * Browser notifications, the one place they are asked for and sent from — **local** only, the
 * page has to be alive. Permission needs a user gesture, `isSecureContext` is a hard gate, and
 * a visible focused page gets nothing by default. See `frontend.md`「浏览器通知」.
 */

import { isPageActive, isPageVisible } from '../use-page-visibility'

export interface NotifyInput {
  title: string
  body?: string
  /** Notifications sharing a tag replace one another, so use it to collapse a burst:
   * `<feature>.<id>` (`chat.<roomId>`). Omit it and every call is its own notification. */
  tag?: string
  /** Defaults to the app's favicon. */
  icon?: string
  /** Nothing but the banner: for low-priority events. */
  silent?: boolean
  /** Show it even while this page is visible and focused. Defaults to false. */
  whenFocused?: boolean
  /** What clicking it does — focusing the window is done for you; going somewhere is the
   * caller's business (this module is not inside the router). */
  onClick?: () => void
}

const DEFAULT_ICON = '/favicon.svg'

/** Permission is global state and `Notification.permission` never announces a change, so we
 * keep our own copy and let components subscribe to it. */
const listeners = new Set<() => void>()

/** What we have shown and not yet closed, so coming back to the page can clear it. */
const shown = new Set<Notification>()

/** `isSecureContext` is part of the answer: a packaged build over plain http on a LAN address
 * has no `Notification` at all, so a `'Notification' in window` check alone offers a dead button. */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext
}

/** Unsupported reports `denied`: nobody should read `permission` alone and think asking will work. */
function currentPermission(): NotificationPermission {
  return isNotificationSupported() ? Notification.permission : 'denied'
}

let permission = currentPermission()

function emit() {
  for (const listener of listeners) listener()
}

/** The user may have changed it in the browser's own settings while we were away. */
function refresh() {
  const next = currentPermission()

  if (next !== permission) {
    permission = next
    emit()
  }
}

function onVisibilityChange() {
  refresh()

  // Back in the page: clear what we put in the system's notification centre, or it fills up
  // with things that were read minutes ago.
  if (isPageVisible()) closeNotifications()
}

/** The subscribe half of `useSyncExternalStore`. */
export function subscribeNotification(listener: () => void): () => void {
  listeners.add(listener)

  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', onVisibilityChange)
    refresh()
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0) {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}

/** The snapshot half of `useSyncExternalStore`. */
export function readNotificationPermission(): NotificationPermission {
  return permission
}

/**
 * Asks the browser for permission. **Call it from a user gesture** — Safari refuses to prompt
 * from an effect and Chrome treats one as a quiet request, spending the origin's one prompt.
 * A `denied` answer is final, so callers must tell it apart from "not asked yet".
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'

  permission = await Notification.requestPermission()
  emit()

  return permission
}

/** Shows one notification, returning whether it appeared so a caller can fall back to an
 * in-app toast. It never throws. */
export function notifyUser(input: NotifyInput): boolean {
  if (permission !== 'granted') return false

  // Someone looking right at the page gets the in-app toast instead; "visible but in another
  // window" is *active* here in the sense that matters — see `use-page-visibility`.
  if (isPageActive() && input.whenFocused !== true) return false

  try {
    const notification = new Notification(input.title, {
      body: input.body,
      tag: input.tag,
      icon: input.icon ?? DEFAULT_ICON,
      silent: input.silent,
    })

    shown.add(notification)
    notification.onclose = () => shown.delete(notification)

    if (input.onClick) {
      notification.onclick = () => {
        window.focus()
        notification.close()
        input.onClick?.()
      }
    }

    return true
  } catch {
    // Permission was checked above and it still failed, which means this environment does not
    // accept the constructor. Notifications are best-effort: report it, never throw.
    return false
  }
}

/** Closes what we showed — one tag, or all of it. */
export function closeNotifications(tag?: string) {
  for (const notification of [...shown]) {
    if (tag === undefined || notification.tag === tag) {
      notification.close()
      shown.delete(notification)
    }
  }
}
