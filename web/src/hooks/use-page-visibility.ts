import { useSyncExternalStore } from 'react'

/**
 * Two questions, two booleans: `visible` (the tab is showing) and `focused` (this window is
 * the one in use). `active` is both — see `frontend.md`「页面可见性」for what each is for.
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
 * Cached on purpose: `useSyncExternalStore` re-renders on a new snapshot reference, so
 * handing back a fresh object per read would loop forever.
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
