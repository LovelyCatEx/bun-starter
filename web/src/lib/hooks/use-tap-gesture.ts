"use client";

import { useMemo, useRef } from "react";

/** What a pointerdown recorded, read back by the click that ends its gesture. */
export interface TapRecord<S> {
  /** Which input started the gesture. */
  pointerType: string;
  /** What the surface was showing when it started. */
  state: S;
}

export interface TapGesture<S> {
  /** Record the gesture a pointerdown starts, with the state it starts in. */
  start: (event: { pointerType: string }, state: S) => void;
  /** Read the record and clear it. `null` when no pointer is behind this click. */
  take: () => TapRecord<S> | null;
  /** Drop the record: this gesture will never spend it on a click. */
  drop: () => void;
}

/**
 * Records the `pointerdown` behind a click (a `click` carries no `pointerType`; keyboard
 * activation synthesizes one with no pointer). The record is spent by at most one click
 * and dropped on `pointercancel` / `keydown`, which the surface has to wire.
 */
export function useTapGesture<S>(): TapGesture<S> {
  const record = useRef<TapRecord<S> | null>(null);

  return useMemo(
    () => ({
      start: (event, state) => {
        record.current = { pointerType: event.pointerType, state };
      },
      take: () => {
        const spent = record.current;
        record.current = null;
        return spent;
      },
      drop: () => {
        record.current = null;
      },
    }),
    [],
  );
}
