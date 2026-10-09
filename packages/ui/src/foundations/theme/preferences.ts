import {
  DEFAULT_LAYOUT,
  DEFAULT_PREFERENCES,
  LAYOUT_VALUES,
  type LiquidGlassLayout,
  type LiquidGlassPreferences,
} from "./types";

/** Server-safe: pure functions. */

export function clampClarity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PREFERENCES.clarity;
  return Math.min(1, Math.max(0, value));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Builds a complete, valid preferences object from untrusted input (stored JSON,
 * partial props). Unknown or malformed fields fall back to `base`.
 */
export function normalizePreferences(
  input: unknown,
  base: LiquidGlassPreferences = DEFAULT_PREFERENCES,
): LiquidGlassPreferences {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  return {
    appearance: oneOf(raw.appearance, ["system", "light", "dark"], base.appearance),
    clarity: typeof raw.clarity === "number" ? clampClarity(raw.clarity) : base.clarity,
    transparency: oneOf(raw.transparency, ["system", "reduced"], base.transparency),
    contrast: oneOf(raw.contrast, ["system", "more"], base.contrast),
    motion: oneOf(raw.motion, ["system", "reduced"], base.motion),
    platform: oneOf(raw.platform, ["macos", "ios"], base.platform),
    accent:
      typeof raw.accent === "string" && raw.accent.trim() !== ""
        ? raw.accent.trim()
        : raw.accent === null
          ? null
          : base.accent,
  };
}

export function normalizeLayout(input: Partial<LiquidGlassLayout> | undefined): LiquidGlassLayout {
  const raw = input ?? {};
  return {
    toolbarStyle: oneOf(raw.toolbarStyle, LAYOUT_VALUES.toolbarStyle, DEFAULT_LAYOUT.toolbarStyle),
    sidebarStyle: oneOf(raw.sidebarStyle, LAYOUT_VALUES.sidebarStyle, DEFAULT_LAYOUT.sidebarStyle),
    windowCorners: oneOf(raw.windowCorners, LAYOUT_VALUES.windowCorners, DEFAULT_LAYOUT.windowCorners),
    activeWindowEmphasis: oneOf(
      raw.activeWindowEmphasis,
      LAYOUT_VALUES.activeWindowEmphasis,
      DEFAULT_LAYOUT.activeWindowEmphasis,
    ),
    menuIcons: oneOf(raw.menuIcons, LAYOUT_VALUES.menuIcons, DEFAULT_LAYOUT.menuIcons),
  };
}

export function preferencesEqual(a: LiquidGlassPreferences, b: LiquidGlassPreferences): boolean {
  return (
    a.appearance === b.appearance &&
    a.clarity === b.clarity &&
    a.transparency === b.transparency &&
    a.contrast === b.contrast &&
    a.motion === b.motion &&
    a.platform === b.platform &&
    a.accent === b.accent
  );
}
