import { LAYOUT_ATTRIBUTES, type LiquidGlassLayout, type LiquidGlassPreferences } from "./types";

/**
 * The attributes and custom properties that carry theme state on an element
 * (ARCHITECTURE.md 5.2). `null` means "must be absent". Server-safe.
 *
 * `script.ts` writes the same state from an inline script before first paint;
 * `script.test.ts` keeps the two in step.
 */
export interface ThemeDomState {
  attributes: Record<string, string | null>;
  properties: Record<`--${string}`, string | null>;
}

export function themeDomState(preferences: LiquidGlassPreferences, layout?: LiquidGlassLayout): ThemeDomState {
  const attributes: Record<string, string | null> = {
    "data-appearance": preferences.appearance === "system" ? null : preferences.appearance,
    "data-transparency": preferences.transparency === "reduced" ? "reduced" : null,
    "data-contrast": preferences.contrast === "more" ? "more" : null,
    "data-motion": preferences.motion === "reduced" ? "reduced" : null,
    "data-platform": preferences.platform,
  };
  if (layout) {
    for (const key of Object.keys(LAYOUT_ATTRIBUTES) as (keyof LiquidGlassLayout)[]) {
      attributes[LAYOUT_ATTRIBUTES[key]] = layout[key];
    }
  }
  return {
    attributes,
    properties: {
      "--glass-clarity": String(preferences.clarity),
      "--accent-custom": preferences.accent,
    },
  };
}

/** Whether a string is a color the browser accepts. Unknown environments say yes. */
export function isCssColor(value: string): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return true;
  return CSS.supports("color", value);
}

export function applyThemeDomState(element: HTMLElement, state: ThemeDomState): void {
  for (const [name, value] of Object.entries(state.attributes)) {
    if (value === null) element.removeAttribute(name);
    else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }
  for (const [name, value] of Object.entries(state.properties)) {
    const usable = value !== null && (name !== "--accent-custom" || isCssColor(value));
    if (usable) element.style.setProperty(name, value);
    else element.style.removeProperty(name);
  }
}

export function clearThemeDomState(element: HTMLElement, state: ThemeDomState): void {
  for (const name of Object.keys(state.attributes)) element.removeAttribute(name);
  for (const name of Object.keys(state.properties)) element.style.removeProperty(name);
}
