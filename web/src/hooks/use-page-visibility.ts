import { useSyncExternalStore } from 'react'

/**
 * Whether the user is actually looking at this page.
 *
 * Two levels, because they are not the same question:
 * `visible` is "the tab is showing" (not switched away, not minimised), `focused` is "this
 * window is the one being used". `active` is both — the one you almost always want. A visible
 * but unfocused tab is the interesting case: the user is in another window with this page
 * still on screen, which is exactly when a system notification is welcome and an in-app toast
 * is not.
 *
 * `web/src/hooks/notification/notification.ts` asks the same question outside React, so the
 * predicates live here and both sides share them.
 */

export interface PageVisibility {
  /** The tab is showing: not in another tab, not minimised. */
  visible: boolean
  /** This window has focus. */
  focused: boolean
  /** Both: the user is here, in this page. */
  active: boolean
}

function hasDocument(): boolean {
  return typeof document !== 'undefined'
}

export function isPageVisible(): boolean {
  return hasDocument() ? document.visibilityState === 'visible' : true
}

export function isPageFocused(): boolean {
  return hasDocument() ? document.hasFocus() : true
}

/** The plain-function half, for code that is not a component. */
export function isPageActive(): boolean {
  return isPageVisible() && isPageFocused()
}

function compute(): PageVisibility {
  const visible = isPageVisible()
  const focused = isPageFocused()

  return { visible, focused, active: visible && focused }
}

/**
 * Cached on purpose: `useSyncExternalStore` re-renders whenever the snapshot is a different
 * reference, so handing back a fresh object on every read would loop forever. It is replaced
 * only when something actually changed.
 */
let snapshot = compute()

const listeners = new Set<() => void>()

/** The events are only "you should re-read now" signals; the state always comes from the DOM. */
function refresh() {
  const next = compute()

  if (next.visible === snapshot.visible && next.focused === snapshot.focused) return

  snapshot = next

  for (const listener of listeners) listener()
}

/** The subscribe half of `useSyncExternalStore`, exported for callers outside a component. */
export function subscribePageVisibility(listener: () => void): () => void {
  listeners.add(listener)

  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('blur', refresh)
    refresh()
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0) {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('blur', refresh)
    }
  }
}

/** The snapshot half — the same object identity until something actually changes. */
export function readPageVisibility(): PageVisibility {
  return snapshot
}

/**
 * ```tsx
 * const { active } = usePageVisibility()
 *
 * // 页面不在眼前就别标记已读
 * useEffect(() => {
 *   if (active) markRead()
 * }, [active])
 * ```
 *
 * One set of DOM listeners serves every component that asks, and the same store answers
 * non-React callers (`isPageActive()`), so nothing drifts out of sync.
 */
export function usePageVisibility(): PageVisibility {
  return useSyncExternalStore(subscribePageVisibility, readPageVisibility, readPageVisibility)
}

/** The shorthand for the common question: is the user in this page right now? */
export function useIsPageActive(): boolean {
  return usePageVisibility().active
}
