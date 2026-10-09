import { normalizePreferences } from "./preferences";
import type { LiquidGlassPreferences } from "./types";

/**
 * localStorage access for theme preferences. Every call is wrapped in try/catch:
 * storage can be missing (server), blocked (privacy modes) or full.
 */

const VERSION = 1;

export function readStoredPreferences(key: string, base: LiquidGlassPreferences): LiquidGlassPreferences | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return normalizePreferences(JSON.parse(raw), base);
  } catch {
    return null;
  }
}

export function writeStoredPreferences(key: string, preferences: LiquidGlassPreferences): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: VERSION, ...preferences }));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredPreferences(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
