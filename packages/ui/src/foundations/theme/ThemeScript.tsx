import { normalizeLayout, normalizePreferences } from "./preferences";
import { themeScriptSource } from "./script";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_STORAGE_KEY,
  type LiquidGlassLayout,
  type LiquidGlassPreferences,
} from "./types";

export interface ThemeScriptProps {
  /** Must match the provider's `storageKey`. `null` applies the defaults only. */
  storageKey?: string | null;
  /** Must match the provider's `defaultPreferences`. */
  defaultPreferences?: Partial<LiquidGlassPreferences>;
  /** Must match the provider's `layout`. */
  layout?: Partial<LiquidGlassLayout>;
  /** Required when the page has a Content Security Policy without `'unsafe-inline'`. */
  nonce?: string;
}

/**
 * Applies the stored theme to `<html>` while the browser parses the page, so the
 * first paint is already correct. Render it in `<head>` of the root layout and
 * put `suppressHydrationWarning` on `<html>`.
 *
 * Server-safe (no directive, no hooks). No Apple API corresponds to this: it is
 * the web technique from the bundled Next.js guide "How to prevent flash before
 * hydration". Theme data is never read from `cookies()` or `headers()`
 * (DECISIONS D-018).
 */
export function ThemeScript({
  storageKey = DEFAULT_STORAGE_KEY,
  defaultPreferences,
  layout,
  nonce,
}: ThemeScriptProps) {
  const source = themeScriptSource(
    storageKey,
    normalizePreferences(defaultPreferences, DEFAULT_PREFERENCES),
    normalizeLayout(layout),
  );
  return (
    <script
      // On the client React would warn about a script it cannot run; a plain-text
      // type silences that, and the server-rendered type is what the parser sees.
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}
