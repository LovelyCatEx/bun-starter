"use client";

import { useCallback, useState } from "react";
import { getFaviconUrl } from "@/lib/favicon";

/**
 * Drops the favicon once it is known unusable. `onError` is not enough: an image loaded from
 * server-rendered HTML fails before React attaches a handler — `decode()` settles instead.
 */
export function useFavicon(url?: string) {
  const resolved = url ? getFaviconUrl(url) : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolved && resolved !== failedSrc ? resolved : null;

  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || !src) return;

      let released = false;
      img.decode().catch(() => {
        if (!released) setFailedSrc(src);
      });

      // A late rejection would describe an image we are no longer showing.
      return () => {
        released = true;
      };
    },
    [src],
  );

  return { src, ref };
}
