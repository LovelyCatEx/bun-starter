"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Where the keyboard or the pointer last moved to, stamped with the query it was placed under.
 * *Active* is resolved from this during render, never in an effect: an effect commits late,
 * leaving a window where no option is active and a key moves from nowhere.
 */
type ActiveCursor = { value: string; query: string };

type Options = {
  query: string;
  value: string | undefined;
  /** The enabled, visible options in list order — all this hook reads of them. */
  enabledItems: readonly { value: string }[];
};

const isEnabled = (
  enabledItems: Options["enabledItems"],
  candidate: string | undefined,
): candidate is string =>
  candidate !== undefined && enabledItems.some((i) => i.value === candidate);

/**
 * The cursor's option, or null once the query or the result set it was placed in has changed —
 * a cursor that outlived either would steal Enter from the row the user is aiming at. It is
 * stamped with the query, not the visible list, because callers pass an inline `filter`.
 */
function liveCursorValue(cursor: ActiveCursor | null, options: Options) {
  if (cursor === null || cursor.query !== options.query) return null;
  return isEnabled(options.enabledItems, cursor.value) ? cursor.value : null;
}

/**
 * Where the highlight sits with no live cursor: the selection if it can be selected, otherwise
 * the first option that can. Only enabled options qualify — an active disabled one would point
 * `aria-activedescendant` at a row Enter refuses to select.
 */
function fallbackActive({ value, enabledItems }: Options) {
  return isEnabled(enabledItems, value) ? value : (enabledItems[0]?.value ?? null);
}

/** The active option, from a cursor that may or may not still be live. */
const resolveActive = (cursor: ActiveCursor | null, options: Options) =>
  liveCursorValue(cursor, options) ?? fallbackActive(options);

export function useActiveOption({ open, ...options }: Options & { open: boolean }) {
  const { query, value, enabledItems } = options;
  const [cursor, setCursor] = useState<ActiveCursor | null>(null);

  const live = liveCursorValue(cursor, options);
  // Cleared rather than ignored: React re-runs this render with the cursor
  // gone, so a value that reappears later cannot revive it.
  if (cursor !== null && live === null) setCursor(null);
  const derived = live ?? fallbackActive(options);

  // Nothing is active until the list has been opened once; after that the resolution above is
  // stable across a close, so the highlight holds its row through the exit on its own.
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  const activeValue = opened ? derived : null;

  // Both callbacks keep one identity for the life of the component, reading the list through
  // a ref: `enabledItems` is a fresh array whenever a caller passes an inline `filter`, so a
  // callback keyed to it would be rebuilt every render. The ref is written after commit.
  const latest = useRef({ open, query, value, enabledItems });
  useLayoutEffect(() => {
    latest.current = { open, query, value, enabledItems };
  });

  const setActiveValue = useCallback((next: string | null) => {
    setCursor(
      next === null ? null : { value: next, query: latest.current.query },
    );
  }, []);

  // Steps from the option the cursor really resolves to, inside the update, so
  // that two keys landing in one batch move two rows rather than one.
  const moveActive = useCallback(
    (direction: 1 | -1 | "first" | "last") => {
      const options = latest.current;
      // While closed the list still filters by the query it was open with, so a step now would
      // be measured against rows the next render replaces. Stepping waits for open.
      if (!options.open) return;
      const rows = options.enabledItems;
      const last = rows.length - 1;
      if (last < 0) {
        setCursor(null);
        return;
      }
      setCursor((current) => {
        // `resolveActive` always lands on a member of `enabledItems` once the list is
        // non-empty, which the early return above guarantees, so there is a row to step from.
        const from = resolveActive(current, options);
        const at = rows.findIndex((item) => item.value === from);
        const index =
          direction === "first"
            ? 0
            : direction === "last"
              ? last
              : (at + direction + rows.length) % rows.length;
        return { value: rows[index].value, query: options.query };
      });
    },
    [],
  );

  return { activeValue, setActiveValue, moveActive };
}
