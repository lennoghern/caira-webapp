"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_LAYOUT,
  DEFAULT_PREFERENCES,
  type LiquidGlassLayout,
  type LiquidGlassPreferences,
  type ResolvedAppearance,
} from "./types";

/** Preferences after the system settings are taken into account. */
export interface ResolvedLiquidGlass {
  appearance: ResolvedAppearance;
  reducedTransparency: boolean;
  increasedContrast: boolean;
  reducedMotion: boolean;
  forcedColors: boolean;
}

export interface LiquidGlassContextValue {
  preferences: LiquidGlassPreferences;
  layout: LiquidGlassLayout;
  /**
   * What is in effect right now. On the server and during hydration this holds
   * the non-system defaults; it settles after the first client render. Style with
   * CSS where you can (the tokens already follow all of this) and use these
   * values only for behavior, such as skipping a scripted animation.
   */
  resolved: ResolvedLiquidGlass;
  /** Whether rendering tier 2 (SVG refraction, Chromium only) is on. */
  refraction: boolean;
  /** Merges a patch into the preferences. Values are validated and clarity is clamped to 0..1. */
  setPreferences: (patch: Partial<LiquidGlassPreferences>) => void;
  /** Back to the provider's defaults; clears the stored copy. */
  resetPreferences: () => void;
}

function warnNoProvider(): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn("@caira/ui: useLiquidGlass() was asked to change the theme, but no <LiquidGlassProvider> is mounted.");
  }
}

/** What components see when no provider is mounted: the defaults, read-only. */
export const FALLBACK_CONTEXT: LiquidGlassContextValue = {
  preferences: DEFAULT_PREFERENCES,
  layout: DEFAULT_LAYOUT,
  resolved: {
    appearance: "light",
    reducedTransparency: false,
    increasedContrast: false,
    reducedMotion: false,
    forcedColors: false,
  },
  refraction: false,
  setPreferences: warnNoProvider,
  resetPreferences: warnNoProvider,
};

export const LiquidGlassContext = createContext<LiquidGlassContextValue>(FALLBACK_CONTEXT);

/**
 * Reads and changes the Liquid Glass theme. Client only.
 *
 * Works without a provider: it then returns the defaults and ignores changes,
 * so a component can be rendered alone in a test or a story.
 */
export function useLiquidGlass(): LiquidGlassContextValue {
  return useContext(LiquidGlassContext);
}
