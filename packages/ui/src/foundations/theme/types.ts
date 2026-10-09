/**
 * Theme model shared by LiquidGlassProvider, ThemeScript and LiquidGlassScope.
 * Server-safe: types and constants only.
 */

export type Appearance = "system" | "light" | "dark";
export type ResolvedAppearance = "light" | "dark";
export type TransparencyPreference = "system" | "reduced";
export type ContrastPreference = "system" | "more";
export type MotionPreference = "system" | "reduced";
/** Density. Apple differentiates control and text sizes between these two (HIG Accessibility, Typography). */
export type Platform = "macos" | "ios";

/** What a person can change. Persisted in localStorage by the provider. */
export interface LiquidGlassPreferences {
  /** `system` follows `prefers-color-scheme`. */
  appearance: Appearance;
  /**
   * How transparent glass is: 0 is fully tinted, 1 is ultra clear.
   * The range is VERIFIED (WWDC26 keynote); the numeric scale is INFERRED.
   */
  clarity: number;
  /** `system` follows `prefers-reduced-transparency`, which Safari does not support. */
  transparency: TransparencyPreference;
  /** `system` follows `prefers-contrast`. */
  contrast: ContrastPreference;
  /** `system` follows `prefers-reduced-motion`. */
  motion: MotionPreference;
  platform: Platform;
  /** Any CSS color, or `null` for the system blue. */
  accent: string | null;
}

/**
 * macOS 27 layout behaviors (VERIFIED: SOURCES section 3). The first value of
 * each pair is the macOS 27 behavior and the default; the second is the earlier one.
 * These are application decisions, so they are props and are not persisted.
 */
export interface LiquidGlassLayout {
  toolbarStyle: "uniform" | "floating";
  sidebarStyle: "edge-to-edge" | "floating";
  windowCorners: "uniform" | "per-window";
  activeWindowEmphasis: "strong" | "standard";
  menuIcons: "selective" | "all";
}

export const DEFAULT_PREFERENCES: LiquidGlassPreferences = {
  appearance: "system",
  // "Medium by default" is REPORTED (SOURCES P2), not stated by Apple.
  clarity: 0.5,
  transparency: "system",
  contrast: "system",
  motion: "system",
  platform: "macos",
  accent: null,
};

export const DEFAULT_LAYOUT: LiquidGlassLayout = {
  toolbarStyle: "uniform",
  sidebarStyle: "edge-to-edge",
  windowCorners: "uniform",
  activeWindowEmphasis: "strong",
  menuIcons: "selective",
};

export const DEFAULT_STORAGE_KEY = "caira-ui:liquid-glass";

/** Data attribute on the theme root for each layout option. */
export const LAYOUT_ATTRIBUTES = {
  toolbarStyle: "data-toolbar-style",
  sidebarStyle: "data-sidebar-style",
  windowCorners: "data-window-corners",
  activeWindowEmphasis: "data-active-window-emphasis",
  menuIcons: "data-menu-icons",
} as const satisfies Record<keyof LiquidGlassLayout, string>;

/** Allowed values per layout option, used to validate props and stored data. */
export const LAYOUT_VALUES = {
  toolbarStyle: ["uniform", "floating"],
  sidebarStyle: ["edge-to-edge", "floating"],
  windowCorners: ["uniform", "per-window"],
  activeWindowEmphasis: ["strong", "standard"],
  menuIcons: ["selective", "all"],
} as const satisfies { [K in keyof LiquidGlassLayout]: readonly LiquidGlassLayout[K][] };
