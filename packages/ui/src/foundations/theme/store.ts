import { normalizePreferences, preferencesEqual } from "./preferences";
import { clearStoredPreferences, readStoredPreferences, writeStoredPreferences } from "./storage";
import type { LiquidGlassPreferences } from "./types";

/**
 * A small external store for theme preferences, shaped for `useSyncExternalStore`.
 *
 * Why a store and not a lazy `useState` initializer: the server renders the
 * defaults, and the browser may hold something else in localStorage. With
 * `getServerSnapshot` React hydrates with the defaults and then re-renders with
 * the stored value, so nothing that renders from the preferences (a settings
 * panel, say) can cause a hydration mismatch. The page itself does not flash,
 * because ThemeScript already applied the stored value before first paint.
 */
export interface PreferencesStore {
  getSnapshot: () => LiquidGlassPreferences;
  getServerSnapshot: () => LiquidGlassPreferences;
  subscribe: (listener: () => void) => () => void;
  set: (next: LiquidGlassPreferences) => void;
  reset: () => void;
}

export function createPreferencesStore(
  storageKey: string | null,
  defaults: LiquidGlassPreferences,
): PreferencesStore {
  const listeners = new Set<() => void>();
  // Read lazily: the first call happens in the browser, after hydration starts.
  let current: LiquidGlassPreferences | null = null;

  function read(): LiquidGlassPreferences {
    if (storageKey === null || typeof window === "undefined") return defaults;
    return readStoredPreferences(storageKey, defaults) ?? defaults;
  }

  function publish(next: LiquidGlassPreferences): void {
    if (current !== null && preferencesEqual(current, next)) return;
    current = next;
    for (const listener of listeners) listener();
  }

  function onStorage(event: StorageEvent): void {
    // Another tab changed the preferences (or cleared storage: key === null).
    if (event.key === null || event.key === storageKey) publish(read());
  }

  return {
    getSnapshot() {
      current ??= read();
      return current;
    },
    getServerSnapshot() {
      return defaults;
    },
    subscribe(listener) {
      if (listeners.size === 0 && storageKey !== null && typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== "undefined") {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    set(next) {
      const normalized = normalizePreferences(next, defaults);
      if (storageKey !== null) writeStoredPreferences(storageKey, normalized);
      publish(normalized);
    },
    reset() {
      if (storageKey !== null) clearStoredPreferences(storageKey);
      publish(defaults);
    },
  };
}
