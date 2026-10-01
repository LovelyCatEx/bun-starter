"use client";

import { useState } from "react";

/**
 * Runs `start` during the render in which `open` becomes true: a passive effect runs after
 * the commit, leaving a window in which the fresh session still carries the old state.
 * `start` may only set the calling component's state; anything else goes in an effect on `open`.
 */
export function useOnOpen(open: boolean, start: () => void) {
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) start();
  }
}
