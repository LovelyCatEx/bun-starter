"use client";

import { History, Search } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/ease";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { cn } from "@/lib/utils";
import { ITEM, LIST, MORPH } from "./constants";

/**
 * Search icon morphs into a full-width bar via a shared layoutId, growing
 * leftward across the header row. Results are a SEPARATE dropdown, so filtering
 * resizes only that and never re-fires the morph (which would scale-distort text).
 */
export function SearchBar({
  placeholder = "Search",
  recent = [],
  onChange,
  onSubmit,
}: {
  placeholder?: string;
  recent?: string[];
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const layoutId = `${useId()}-search`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  // Hover arms after the dropdown reveals so it doesn't flash a phantom hover.
  const [armed, setArmed] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useDismiss(open, close, rootRef);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setArmed(false);
      return;
    }
    const t = window.setTimeout(() => setArmed(true), reduce ? 0 : 260);
    return () => window.clearTimeout(t);
  }, [open, reduce]);

  // The box keeps the bouncy morph (same feel as the account switcher)...
  const morph: Transition = reduce ? { duration: 0 } : MORPH;
  // ...but the icon + input travel across the row, so their own layout uses a
  // critically-damped spring instead of inheriting the box's overshoot.
  const glide: Transition = reduce
    ? { duration: 0 }
    : { type: "spring", duration: 0.5, bounce: 0 };

  const query = value.trim().toLowerCase();
  const filtered = query
    ? recent.filter((r) => r.toLowerCase().includes(query))
    : recent;

  const submit = (next: string) => {
    onSubmit?.(next);
    setOpen(false);
  };

  return (
    // static so the open bar + dropdown anchor to the header row (spanning its
    // width), while the slot below reserves the icon's footprint.
    <div ref={rootRef} className="shrink-0">
      {/* reserve the icon's width while open (the icon has left the flow) */}
      {open ? <div aria-hidden className="h-8 w-8" /> : null}

      <AnimatePresence initial={false} mode="popLayout">
        {open ? null : (
          <motion.button
            key="icon"
            layoutId={layoutId}
            type="button"
            // frosted blur hook
            data-slot="wallet-search-trigger"
            aria-label="Search"
            onClick={() => setOpen(true)}
            transition={morph}
            style={{ borderRadius: 12 }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* one connected panel: input + results grow out of the trigger; the text
          nodes use layout="position" so a resize repositions them without scaling. */}
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="panel"
            layoutId={layoutId}
            // frosted blur hook
            data-slot="wallet-search-panel"
            transition={morph}
            style={{ borderRadius: 16 }}
            className="absolute top-0 -right-2 -left-2 z-40 overflow-hidden border border-border/30 bg-background backdrop-blur-md"
          >
            <div className="flex h-9 items-center gap-2 px-3">
              <motion.span
                layout="position"
                transition={glide}
                className="shrink-0"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </motion.span>
              <motion.input
                ref={inputRef}
                layout="position"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  opacity: { duration: 0.15, delay: 0.12, ease: EASE_OUT },
                  layout: glide,
                }}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  onChange?.(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && value.trim()) submit(value.trim());
                  if (e.key === "Escape") close();
                }}
                placeholder={placeholder}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="h-px bg-border/40" />

            {filtered.length > 0 ? (
              <motion.ul
                initial="hidden"
                animate="show"
                variants={reduce ? undefined : LIST}
                className={cn(
                  "max-h-56 overflow-y-auto p-1.5",
                  armed ? "" : "pointer-events-none",
                )}
              >
                {filtered.map((term) => (
                  <motion.li
                    key={term}
                    layout="position"
                    // frosted blur hook
                    data-slot="wallet-search-option"
                    variants={reduce ? undefined : ITEM}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setValue(term);
                        onChange?.(term);
                        submit(term);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-muted-foreground outline-none transition-colors",
                        armed && "hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <History className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{term}</span>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <motion.div
                layout="position"
                className="flex flex-col items-center gap-1 px-4 py-8 text-center"
              >
                <Search className="h-5 w-5 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  {query ? "No matches" : "No recent searches"}
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
