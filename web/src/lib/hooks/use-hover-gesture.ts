"use client";

import { useMemo, useRef } from "react";
import { isHoveringPointer } from "@/lib/touch";

interface BoundaryEvent {
  pointerId: number;
  pointerType: string;
  buttons: number;
}

export interface HoverGesture {
  /** True when this enter starts a hover: the pointer arrived resting, not pressing. */
  enter: (event: BoundaryEvent) => boolean;
  /** True when this leave ends a hover that entered as one. */
  leave: (event: BoundaryEvent) => boolean;
}

/**
 * Pairs a surface's enter with its leave, per pointer. `buttons` at the leave
 * boundary cannot say which kind it was, so pointers that arrived in contact
 * are tracked at enter, and their leave never ends a hover.
 */
export function useHoverGesture(): HoverGesture {
  const contact = useRef(new Set<number>());

  return useMemo(
    () => ({
      enter: (event) => {
        if (isHoveringPointer(event)) {
          contact.current.delete(event.pointerId);
          return true;
        }
        contact.current.add(event.pointerId);
        return false;
      },
      leave: (event) => {
        const arrivedInContact = contact.current.delete(event.pointerId);
        return !arrivedInContact && event.pointerType !== "touch";
      },
    }),
    [],
  );
}
