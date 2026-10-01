"use client";

import { useIsPresent } from "motion/react";
import type { ReactNode } from "react";

export interface PresenceGateRenderProps {
  /**
   * False from the render that starts the exit animation onward: an overlay kept in
   * the tree by `AnimatePresence` stays topmost for the whole exit.
   */
  isPresent: boolean;
  /**
   * Spread onto every layer that takes pointer events while the overlay is open: pointers
   * stop landing the moment the exit starts, and `inert` drops the subtree from focus and
   * tab order. A pointer-transparent layer takes `inert={!isPresent}` alone.
   */
  gate: {
    inert: boolean;
    style: { pointerEvents: "auto" | "none" };
  };
}

export interface PresenceGateProps {
  children: (props: PresenceGateRenderProps) => ReactNode;
}

/**
 * Reads presence one component below the `AnimatePresence` that owns it (`useIsPresent`
 * only answers inside that subtree) and hands it down through the render prop.
 */
export function PresenceGate({ children }: PresenceGateProps) {
  const isPresent = useIsPresent();

  return children({
    isPresent,
    gate: {
      inert: !isPresent,
      style: { pointerEvents: isPresent ? "auto" : "none" },
    },
  });
}
