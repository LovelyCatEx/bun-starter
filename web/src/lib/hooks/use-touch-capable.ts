"use client";

import { useEffect, useState } from "react";

/**
 * Not the inverse of `useHoverCapable`: iPadOS answers `(hover: hover)` with true while a
 * finger is the only input — gate the *touch path* here, hover-only polish on `useHoverCapable`.
 */
export function useTouchCapable() {
  const [canTouch, setCanTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(any-pointer: coarse)");
    // iPadOS disguises its pointer media queries; maxTouchPoints is the tell it will not spoof.
    const update = () =>
      setCanTouch(Boolean(mq?.matches) || navigator.maxTouchPoints > 0);
    update();
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);

  return canTouch;
}
