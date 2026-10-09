"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { GlassFilterDefs } from "../glass/GlassFilterDefs";
import { rendersBackdropSvgFilter, supportsBackdropSvgFilter } from "../glass/refraction";
import { LiquidGlassContext, type LiquidGlassContextValue } from "./context";
import { applyThemeDomState, clearThemeDomState, themeDomState } from "./dom";
import { normalizeLayout, normalizePreferences, preferencesEqual } from "./preferences";
import { createPreferencesStore } from "./store";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_STORAGE_KEY,
  type LiquidGlassLayout,
  type LiquidGlassPreferences,
} from "./types";
import { useMediaQuery } from "./useMediaQuery";

/**
 * How many blurred glass surfaces may be on screen before a development warning.
 * PROVISIONAL: taken from one desktop measurement (PROGRESS.md, Phase 1 notes),
 * not from the mid-range laptop and phone the plan calls for. Tune per app.
 */
export const DEFAULT_GLASS_BUDGET = 12;

export interface LiquidGlassProviderProps {
  children: ReactNode;
  /** Controlled preferences. When set, the provider neither reads nor writes storage. */
  preferences?: Partial<LiquidGlassPreferences>;
  /** Starting values when nothing is stored. Read once, on mount. */
  defaultPreferences?: Partial<LiquidGlassPreferences>;
  onPreferencesChange?: (preferences: LiquidGlassPreferences) => void;
  /** macOS 27 layout behaviors. Each defaults to the macOS 27 one. */
  layout?: Partial<LiquidGlassLayout>;
  /** localStorage key, read once on mount. `null` turns persistence off. */
  storageKey?: string | null;
  /**
   * Rendering tier 2, the SVG refraction. `auto` turns it on in Chromium when a
   * GPU draws the page. `on` also turns it on under software rendering, where it
   * is slow. `off` keeps tier 1. Outside Chromium it is always off.
   */
  refraction?: "auto" | "on" | "off";
  /** Renders the shared SVG filter. Turn off only if you mount `<GlassFilterDefs />` yourself. */
  filterDefs?: boolean;
  /** Development only: warn above this many blurred glass surfaces. `false` disables the check. */
  glassBudget?: number | false;
}

function layoutEqual(a: LiquidGlassLayout, b: LiquidGlassLayout): boolean {
  return (
    a.toolbarStyle === b.toolbarStyle &&
    a.sidebarStyle === b.sidebarStyle &&
    a.windowCorners === b.windowCorners &&
    a.activeWindowEmphasis === b.activeWindowEmphasis &&
    a.menuIcons === b.menuIcons
  );
}

/** Keeps the previous object while the new one is equal by value, so effects do not re-run. */
function useStable<T>(next: T, isEqual: (a: T, b: T) => boolean): T {
  const [stable, setStable] = useState(next);
  if (isEqual(stable, next)) return stable;
  setStable(next);
  return next;
}

const subscribeNever = () => () => {};

/** Blurred surfaces only: glass nested in glass renders a plain tint. */
function countGlassSurfaces(root: ParentNode): number {
  let count = 0;
  for (const element of root.querySelectorAll("[data-glass]")) {
    if (element.parentElement?.closest("[data-glass]") == null) count += 1;
  }
  return count;
}

/**
 * Owns the Liquid Glass theme: appearance, glass clarity, the accessibility
 * overrides, platform density, accent, and the macOS 27 layout behaviors. It
 * writes them on `<html>` as data attributes and CSS variables, so styles react
 * without re-rendering React, and persists what a person changed.
 *
 * Client Component. Pair it with `<ThemeScript>` in `<head>`, given the same
 * `storageKey`, `defaultPreferences` and `layout`, to avoid a flash on load.
 *
 * Apple reference: the system settings in macOS 27 (Appearance, including the
 * Liquid Glass slider from ultra clear to fully tinted; Accessibility > Display).
 * HIG: https://developer.apple.com/design/human-interface-guidelines/materials
 *
 * @example
 * <LiquidGlassProvider defaultPreferences={{ clarity: 0.5 }}>{children}</LiquidGlassProvider>
 */
export function LiquidGlassProvider({
  children,
  preferences: controlled,
  defaultPreferences,
  onPreferencesChange,
  layout: layoutProp,
  storageKey = DEFAULT_STORAGE_KEY,
  refraction: refractionMode = "auto",
  filterDefs = true,
  glassBudget = DEFAULT_GLASS_BUDGET,
}: LiquidGlassProviderProps) {
  const isControlled = controlled !== undefined;
  const [defaults] = useState(() => normalizePreferences(defaultPreferences, DEFAULT_PREFERENCES));
  const [store] = useState(() => createPreferencesStore(storageKey, defaults));
  const stored = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const preferences = useStable(isControlled ? normalizePreferences(controlled, defaults) : stored, preferencesEqual);
  const layout = useStable(normalizeLayout(layoutProp), layoutEqual);

  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const systemContrast = useMediaQuery("(prefers-contrast: more)");
  const systemMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const systemTransparency = useMediaQuery("(prefers-reduced-transparency: reduce)");
  const forcedColors = useMediaQuery("(forced-colors: active)");

  // Even `on` never applies outside Chromium: there the SVG filter switches the
  // whole backdrop filter off, and the contrast floor with it (measured in Firefox).
  const refractionRenders = useSyncExternalStore(subscribeNever, rendersBackdropSvgFilter, () => false);
  const refractionSupported = useSyncExternalStore(subscribeNever, supportsBackdropSvgFilter, () => false);
  const refraction =
    (refractionMode === "on" && refractionRenders) || (refractionMode === "auto" && refractionSupported);

  // Layout effect, not effect: React Strict Mode clears <html> attributes on its
  // development remount, and this must put them back before the next paint.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const state = themeDomState(preferences, layout);
    applyThemeDomState(root, state);
    return () => clearThemeDomState(root, state);
  }, [preferences, layout]);

  useLayoutEffect(() => {
    if (!refraction) return;
    const root = document.documentElement;
    root.setAttribute("data-glass-refraction", "on");
    return () => root.removeAttribute("data-glass-refraction");
  }, [refraction]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || glassBudget === false) return;
    let warned = false;
    let frame = 0;
    const check = () => {
      frame = 0;
      const count = countGlassSurfaces(document);
      if (count > glassBudget && !warned) {
        warned = true;
        console.warn(
          `@caira/ui: ${count} blurred glass surfaces are mounted; the budget is ${glassBudget}. ` +
            "Apple advises using Liquid Glass sparingly, and each surface costs a backdrop filter.",
        );
      }
    };
    const observer = new MutationObserver(() => {
      if (frame === 0) frame = requestAnimationFrame(check);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    check();
    return () => {
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [glassBudget]);

  const setPreferences = useCallback(
    (patch: Partial<LiquidGlassPreferences>) => {
      // Uncontrolled: read the store, so two calls in one event do not overwrite each other.
      const base = isControlled ? preferences : store.getSnapshot();
      const next = normalizePreferences({ ...base, ...patch }, base);
      if (preferencesEqual(base, next)) return;
      if (!isControlled) store.set(next);
      onPreferencesChange?.(next);
    },
    [isControlled, preferences, store, onPreferencesChange],
  );

  const resetPreferences = useCallback(() => {
    if (!isControlled) store.reset();
    onPreferencesChange?.(defaults);
  }, [isControlled, store, onPreferencesChange, defaults]);

  const value = useMemo<LiquidGlassContextValue>(
    () => ({
      preferences,
      layout,
      resolved: {
        appearance: preferences.appearance === "system" ? (systemDark ? "dark" : "light") : preferences.appearance,
        reducedTransparency: preferences.transparency === "reduced" || systemTransparency,
        increasedContrast: preferences.contrast === "more" || systemContrast,
        reducedMotion: preferences.motion === "reduced" || systemMotion,
        forcedColors,
      },
      refraction,
      setPreferences,
      resetPreferences,
    }),
    [
      preferences,
      layout,
      systemDark,
      systemTransparency,
      systemContrast,
      systemMotion,
      forcedColors,
      refraction,
      setPreferences,
      resetPreferences,
    ],
  );

  return (
    <LiquidGlassContext value={value}>
      {children}
      {filterDefs ? <GlassFilterDefs /> : null}
    </LiquidGlassContext>
  );
}
