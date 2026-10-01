"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Where the keyboard or the pointer last moved to: the row's id, stamped with the query it
 * was placed under.
 */
type RowCursor = { id: string; query: string };

/** The cursor's row, or -1 once the query has moved on or the row has left. */
function indexOfCursor(
  rows: readonly { id: string }[],
  query: string,
  cursor: RowCursor | null,
) {
  if (cursor === null || cursor.query !== query) return -1;
  return rows.findIndex((row) => row.id === cursor.id);
}

/**
 * The highlighted row of a list whose rows can change under it: resolved during render, never
 * in an effect, whose late commit would leave an `aria-activedescendant` naming a row that has
 * left. It holds the row's id, not its position, and is stamped with the query it was placed under.
 */
export function useRowCursor(rows: readonly { id: string }[], query: string) {
  const [cursor, setCursor] = useState<RowCursor | null>(null);
  // Written after commit, not during render: a render React discards still runs the component
  // body, and a handler reading this in that window would stamp a query the tree does not have.
  const latest = useRef({ rows, query });
  useLayoutEffect(() => {
    latest.current = { rows, query };
  });

  const cursorRow = indexOfCursor(rows, query, cursor);
  // Cleared rather than ignored: React re-runs this render with the cursor already gone, so
  // rows that come back cannot revive a highlight the user stopped aiming at.
  if (cursor !== null && cursorRow < 0) setCursor(null);

  const moveTo = useCallback(
    (id: string | null) =>
      setCursor(id === null ? null : { id, query: latest.current.query }),
    [],
  );

  const moveActive = useCallback((direction: 1 | -1) => {
    const { rows: live, query: liveQuery } = latest.current;
    const last = live.length - 1;
    if (last < 0) return;
    // Steps from the row the cursor is really on, inside the update, so that
    // two keys landing in one batch move two rows rather than one.
    setCursor((current) => {
      const at = Math.max(indexOfCursor(live, liveQuery, current), 0);
      const next = Math.min(Math.max(at + direction, 0), last);
      return { id: live[next].id, query: liveQuery };
    });
  }, []);

  return { activeIndex: cursorRow < 0 ? 0 : cursorRow, moveTo, moveActive };
}
