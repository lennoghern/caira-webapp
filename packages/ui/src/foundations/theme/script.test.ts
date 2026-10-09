import { describe, expect, it, vi } from "vitest";
import { applyThemeDomState, themeDomState } from "./dom";
import { normalizeLayout, normalizePreferences } from "./preferences";
import { themeScriptSource } from "./script";
import { DEFAULT_LAYOUT, DEFAULT_PREFERENCES, type LiquidGlassLayout } from "./types";

const KEY = "test:theme";

/** What <html> looks like after the given code touched it. */
function snapshot(run: () => void): { attributes: Record<string, string>; style: string } {
  const root = document.documentElement;
  for (const name of root.getAttributeNames()) root.removeAttribute(name);
  run();
  const attributes: Record<string, string> = {};
  for (const name of root.getAttributeNames()) {
    if (name !== "style") attributes[name] = root.getAttribute(name)!;
  }
  return { attributes, style: root.style.cssText };
}

function runScript(stored: string | null, defaults = DEFAULT_PREFERENCES, layout: LiquidGlassLayout = DEFAULT_LAYOUT) {
  return snapshot(() => {
    if (stored === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, stored);
    // The script is what the browser would run from <head>.
    new Function(themeScriptSource(KEY, defaults, layout))();
  });
}

function runProviderPath(stored: unknown, defaults = DEFAULT_PREFERENCES, layout: LiquidGlassLayout = DEFAULT_LAYOUT) {
  return snapshot(() => {
    applyThemeDomState(document.documentElement, themeDomState(normalizePreferences(stored, defaults), layout));
  });
}

describe("the inline theme script", () => {
  const cases: [string, unknown][] = [
    ["nothing stored", null],
    ["dark, tinted", { v: 1, appearance: "dark", clarity: 0 }],
    ["everything set", {
      v: 1,
      appearance: "light",
      clarity: 0.85,
      transparency: "reduced",
      contrast: "more",
      motion: "reduced",
      platform: "ios",
      accent: "rgb(255 45 85)",
    }],
    ["out-of-range and unknown values", { appearance: "sepia", clarity: 12, platform: "watchos", contrast: true }],
    ["accent cleared", { accent: null, appearance: "system" }],
    ["a stored array", [1, 2, 3]],
    ["a stored string", "dark"],
  ];

  it.each(cases)("writes the same state as the provider: %s", (_name, stored) => {
    expect(runScript(stored === null ? null : JSON.stringify(stored))).toEqual(runProviderPath(stored));
  });

  it("writes the same state as the provider for custom defaults and layout", () => {
    const defaults = normalizePreferences({ appearance: "dark", clarity: 0.3, accent: "orange" });
    const layout = normalizeLayout({ sidebarStyle: "floating", menuIcons: "all" });
    expect(runScript(null, defaults, layout)).toEqual(runProviderPath(null, defaults, layout));
    expect(runScript(JSON.stringify({ accent: null }), defaults, layout)).toEqual(
      runProviderPath({ accent: null }, defaults, layout),
    );
  });

  it("applies the defaults when the stored value is not JSON", () => {
    expect(runScript("{not json")).toEqual(runProviderPath(null));
  });

  it("applies the defaults when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(runScript(null)).toEqual(runProviderPath(null));
  });

  it("carries the macOS 27 layout defaults as attributes", () => {
    expect(runScript(null).attributes).toMatchObject({
      "data-platform": "macos",
      "data-toolbar-style": "uniform",
      "data-sidebar-style": "edge-to-edge",
      "data-window-corners": "uniform",
      "data-active-window-emphasis": "strong",
      "data-menu-icons": "selective",
    });
  });

  it("cannot be broken out of by a hostile storage key or default", () => {
    const source = themeScriptSource(
      'k"</script><script>alert(1)</script>',
      normalizePreferences({ accent: "</script><img src=x onerror=alert(1)>" }),
      DEFAULT_LAYOUT,
    );
    expect(source).not.toContain("</script");
    expect(source).not.toContain("<img");
    // Still valid JavaScript.
    expect(() => new Function(source)).not.toThrow();
  });
});
