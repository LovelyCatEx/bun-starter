"use client";
// beui.dev/components/motion/tooltip

import { AnimatePresence } from "motion/react";
import { TooltipPositioner } from "./tooltip/positioner";
import { useTooltipPointer } from "./tooltip/use-position";
import {
  cloneElement,
  isValidElement,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { TooltipSurface } from "@/components/motion/tooltip-surface";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { useHoverGesture } from "@/lib/hooks/use-hover-gesture";
import { useTapGesture } from "@/lib/hooks/use-tap-gesture";
import { cn } from "@/lib/utils";

type Side = "top" | "right" | "bottom" | "left";

export interface TooltipProps {
  content: ReactNode;
  children?: ReactElement;
  /** Existing trigger for controlled integrations such as chart cells. */
  anchorRef?: RefObject<HTMLElement | SVGElement | null>;
  /** Point within the anchor, as fractions of its rendered width and height. */
  anchorPoint?: { x: number; y: number };
  /** Follow real pointer coordinates; keyboard focus still uses the anchor. */
  followCursor?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  side?: Side;
  /** Delay before showing (ms). Default 120. */
  delay?: number;
  className?: string;
  /** Classes for the outer wrapper span. Use to fix baseline / fill parent. */
  wrapperClassName?: string;
}

// Once any tooltip has just closed, neighbouring tooltips open without the
// initial delay — moving along a toolbar feels instant after the first one.
const WARM_WINDOW_MS = 300;
let lastHiddenAt = 0;

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 120,
  className,
  wrapperClassName,
  anchorRef: externalAnchorRef,
  anchorPoint,
  followCursor = false,
  open: controlledOpen,
  onOpenChange,
  id: providedId,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const anchorRef = externalAnchorRef ?? wrapperRef;
  const hover = useHoverGesture();
  const floatingRef = useRef<HTMLSpanElement | null>(null);
  const pointer = useTooltipPointer(anchorRef, followCursor);
  const focused = useRef(false);

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (open) return;
    const warm = Date.now() - lastHiddenAt < WARM_WINDOW_MS;
    if (warm) {
      setOpen(true);
      return;
    }
    timer.current = setTimeout(() => {
      setOpen(true);
    }, delay);
  }, [delay, setOpen, open]);

  const hide = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (open) lastHiddenAt = Date.now();
    setOpen(false);
  }, [open, setOpen]);

  const leave = useCallback(() => {
    if (focused.current) return;
    if (timer.current) clearTimeout(timer.current);
    // Bridge the small physical gap to a stationary, readable tooltip.
    if (followCursor) hide();
    else timer.current = setTimeout(hide, 100);
  }, [followCursor, hide]);
  const insideTooltip = useCallback(
    (target: Element) => Boolean(floatingRef.current?.contains(target)),
    [],
  );

  // A finger never hovers and Safari does not focus a button on tap, so the tap
  // itself must open the label. A click carries no pointerType — the preceding
  // pointerdown is what says whether this was a tap.
  const tap = useTapGesture<boolean>();

  const toggleOnTap = useCallback(() => {
    const gesture = tap.take();
    if (!gesture || gesture.pointerType === "mouse") return;
    if (gesture.state) {
      hide();
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }, [hide, tap, setOpen]);

  // Closed again by the next tap anywhere; the label covers nothing interactive.
  useDismiss(open, hide, anchorRef, { ignore: insideTooltip });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (!externalAnchorRef && !isValidElement(children)) return children;

  // Only `aria-describedby` is cloned on: a handler written onto the child is
  // the child's handler as far as that child can tell, so a component that owns
  // its activation (ThemeToggle) would run the tooltip's instead of its own.
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-describedby":
          [(children.props as Record<string, unknown>)["aria-describedby"], open ? id : undefined]
            .filter(Boolean)
            .join(" ") || undefined,
      })
    : null;

  return (
    <>
      {!externalAnchorRef ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: This wrapper observes bubbling trigger events without replacing the control's handlers.
        <span
          ref={wrapperRef}
          className={cn("relative inline-flex align-middle", wrapperClassName)}
          // Pointer events, not the mouse pair: a tap's compatibility
          // mouseenter/mouseleave carry no pointerType and race the tap path.
          onPointerEnter={(event: PointerEvent) => {
            if (hover.enter(event)) show();
          }}
          onPointerLeave={(event: PointerEvent) => {
            if (hover.leave(event)) leave();
          }}
          onFocus={() => {
            focused.current = true;
            show();
          }}
          onBlur={() => {
            focused.current = false;
            hide();
          }}
          onPointerDown={(event: PointerEvent) => tap.start(event, open)}
          // A cancelled gesture sends no click and a key press had no pointer
          // behind it; either way the record must go, or the next click reads it.
          onPointerCancel={tap.drop}
          onKeyDown={(event) => {
            tap.drop();
            if (event.key === "Escape") hide();
          }}
          onClick={toggleOnTap}
        >
          {trigger}
        </span>
      ) : null}
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <TooltipPositioner
                  key="tooltip"
                  anchorRef={anchorRef}
                  floatingRef={floatingRef}
                  anchorPoint={anchorPoint}
                  followCursor={followCursor}
                  side={side}
                  onDismiss={hide}
                  pointer={pointer}
                >
                  {(positioned, isPresent) => (
                    <TooltipSurface
                      id={id}
                      ready={positioned}
                      side={side}
                      onPointerEnter={() => {
                        if (timer.current) clearTimeout(timer.current);
                      }}
                      onPointerLeave={leave}
                      style={{
                        maxWidth: "calc(100vw - 16px)",
                        whiteSpace: "normal",
                        pointerEvents: isPresent && !followCursor ? "auto" : "none",
                      }}
                      className={cn("overflow-hidden", className)}
                    >
                      {content}
                    </TooltipSurface>
                  )}
                </TooltipPositioner>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
