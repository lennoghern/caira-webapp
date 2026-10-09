"use client";

import { useCallback, useSyncExternalStore } from "react";

function matches(query: string): boolean {
  // jsdom and very old browsers have no matchMedia.
  return typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false;
}

/**
 * Subscribes to a media query. Client only. Returns `false` on the server and
 * during hydration, then the real value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", listener);
      return () => list.removeEventListener("change", listener);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => matches(query),
    () => false,
  );
}
