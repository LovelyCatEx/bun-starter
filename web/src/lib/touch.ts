export const TOUCH_GESTURE_CLASS = "select-none [-webkit-touch-callout:none]";

/**
 * The same opt-out for a gesture surface wrapping content the consumer owns: selection is
 * suppressed only under a coarse primary pointer, so a mouse user can still select. The query
 * describes the device, not the gesture, so a hybrid reads it wrong either way.
 */
export const TOUCH_GESTURE_CONTENT_CLASS =
  "[-webkit-touch-callout:none] pointer-coarse:select-none";

/**
 * Suppress selection on `element` for as long as a gesture runs on it, whatever the primary
 * pointer is — for the presses a native selection would otherwise steal, like a long-press
 * that opens a menu. Returns the release.
 */
export function holdSelection(element: HTMLElement) {
  element.style.setProperty("user-select", "none");
  element.style.setProperty("-webkit-user-select", "none");
  return () => {
    element.style.removeProperty("user-select");
    element.style.removeProperty("-webkit-user-select");
  };
}

/**
 * Pointer capture, best effort: WebKit throws `NotFoundError` when the pointer is already
 * gone by the time the handler runs (routine on iOS), and an uncaught throw takes the rest of
 * the handler down with it. Touch pointers carry implicit capture anyway.
 */
export function capturePointer(element: Element, pointerId: number) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Pointer is no longer active — implicit capture still applies on touch.
  }
}

/** Release a capture taken with `capturePointer`, ignoring a stale pointer. */
export function releasePointer(element: Element, pointerId: number) {
  try {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    // Capture was already dropped by the browser.
  }
}

/**
 * Whether this event came from a hovering pointer: not a touch, and not currently pressed
 * (`buttons` is the tell, so a pen resting on the glass reads as contact). Handlers branch on
 * the event rather than on a capability; the leave half belongs to `useHoverGesture`.
 */
export const isHoveringPointer = (event: {
  pointerType: string;
  buttons: number;
}) => event.pointerType !== "touch" && event.buttons === 0;
